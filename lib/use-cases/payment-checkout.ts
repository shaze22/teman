import { supabaseAdmin } from '@/lib/supabase/admin'
import { Errors } from '@/lib/errors'
import { stripe } from '@/lib/stripe'
import { getServiceLabel } from '@/lib/services'

export async function paymentCheckout(
  bookingId: string,
  customerId: string,
): Promise<{ billUrl: string }> {
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_code, total_amount, payment_status, customer_id, status, service_type')
    .eq('id', bookingId)
    .single()

  if (!booking) throw Errors.notFound('Booking')
  if (booking.customer_id !== customerId) throw Errors.forbidden()
  if (booking.payment_status === 'paid') throw Errors.badRequest('Booking already paid')
  if (!['pending', 'confirmed', 'in_progress'].includes(booking.status))
    throw Errors.badRequest('Booking status does not allow payment')

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(customerId)
  const email = authUser?.user?.email ?? undefined

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const amountSen = Math.round(parseFloat(String(booking.total_amount)) * 100)
  const serviceLabel = getServiceLabel(booking.service_type, 'en')

  let session: { id: string; url: string | null }
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'fpx', 'grabpay'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'myr',
            unit_amount: amountSen,
            product_data: {
              name: `Booking #${booking.booking_code}`,
              description: serviceLabel,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/payment/result?bookingId=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/booking/${booking.id}`,
      metadata: {
        bookingId: booking.id,
        bookingCode: booking.booking_code,
        userId: customerId,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create payment session'
    throw Errors.serverError(msg)
  }

  await supabaseAdmin.from('payments').insert({
    id: crypto.randomUUID(),
    booking_id: bookingId,
    user_id: customerId,
    amount: booking.total_amount,
    type: 'booking_full',
    status: 'pending',
    payment_method: 'stripe',
    transaction_id: session.id,
    created_at: new Date().toISOString(),
  })

  if (!session.url) throw Errors.serverError('Payment session URL not returned')
  return { billUrl: session.url }
}
