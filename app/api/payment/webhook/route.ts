import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { sendPaymentReceiptCustomer, sendPaymentNotifyProvider } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ message: 'Missing signature' }, { status: 400 })
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Webhook signature failed'
    console.error('[payment/webhook]', msg)
    return NextResponse.json({ message: msg }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { bookingId, userId } = session.metadata ?? {}

    if (!bookingId) {
      console.warn('[payment/webhook] No bookingId in metadata')
      return NextResponse.json({ ok: true })
    }

    // Update payment + booking
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('transaction_id', session.id)
      .single()

    const now = new Date().toISOString()
    await Promise.all([
      payment
        ? supabaseAdmin.from('payments').update({ status: 'paid' }).eq('id', payment.id)
        : Promise.resolve(),
      supabaseAdmin
        .from('bookings')
        .update({ status: 'confirmed', payment_status: 'paid', payment_method: 'stripe', updated_at: now })
        .eq('id', bookingId),
    ])

    // Fetch booking details for emails
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select(`
        booking_code, scheduled_date, total_amount, provider_price,
        customer:users!bookings_customer_id_fkey(full_name),
        provider:users!bookings_provider_id_fkey(full_name)
      `)
      .eq('id', bookingId)
      .single()

    if (booking) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b = booking as any
      const customerId = userId ?? ''
      const { data: providerUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('full_name', b.provider?.full_name)
        .single()

      const [customerAuth, providerAuth] = await Promise.all([
        customerId ? supabaseAdmin.auth.admin.getUserById(customerId) : Promise.resolve({ data: { user: null } }),
        providerUser ? supabaseAdmin.auth.admin.getUserById(providerUser.id) : Promise.resolve({ data: { user: null } }),
      ])

      const customerEmail = (customerAuth as any)?.data?.user?.email ?? ''
      const providerEmail = (providerAuth as any)?.data?.user?.email ?? ''
      const customerName = b.customer?.full_name ?? ''
      const providerName = b.provider?.full_name ?? ''
      const totalAmount = parseFloat(String(b.total_amount))
      const providerAmount = parseFloat(String(b.provider_price)) * 0.85

      // In-app notification to provider
      if (providerUser) {
        createNotification({
          userId: providerUser.id,
          type: 'booking_confirmed',
          title: 'Booking Baru Disahkan',
          message: `${customerName} telah membuat booking #${b.booking_code}. Pembayaran berjaya diterima.`,
          actionUrl: `/booking/${bookingId}`,
          data: { bookingId },
        }).catch(() => {})
      }

      if (customerEmail) {
        sendPaymentReceiptCustomer({
          to: customerEmail, customerName, providerName,
          bookingCode: b.booking_code, bookingId,
          scheduledDate: b.scheduled_date, totalAmount,
        }).catch(() => {})
      }
      if (providerEmail) {
        sendPaymentNotifyProvider({
          to: providerEmail, providerName, customerName,
          bookingCode: b.booking_code, bookingId,
          scheduledDate: b.scheduled_date, providerAmount,
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ ok: true })
}
