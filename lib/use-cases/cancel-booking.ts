import { supabaseAdmin } from '@/lib/supabase/admin'
import { Errors } from '@/lib/errors'
import { bookingsRepo } from '@/lib/repositories/bookings'
import { stripe } from '@/lib/stripe'
import { notifyBookingStatusChange } from '@/lib/notifications'
import { sendBookingCancelledBoth } from '@/lib/email'

export async function cancelBooking(
  bookingId: string,
  userId: string,
  cancellationReason?: string,
): Promise<{ refundAmount?: number; refundStatus?: string }> {
  const booking = await bookingsRepo.findByIdWithParties(bookingId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = booking as any

  const isProvider = b.provider_id === userId
  const isCustomer = b.customer_id === userId
  if (!isProvider && !isCustomer) throw Errors.forbidden()

  if (!['pending', 'confirmed', 'in_progress'].includes(b.status))
    throw Errors.badRequest('Booking cannot be cancelled in its current status')

  const now = new Date().toISOString()
  let refundAmount = 0
  let refundStatus = ''

  const update: Record<string, unknown> = {
    status: 'cancelled',
    cancelled_at: now,
    cancelled_by: userId,
    cancellation_reason: cancellationReason ?? null,
    updated_at: now,
  }

  if (b.payment_status === 'paid' && b.payment_method === 'stripe') {
    const sessionDate = new Date(`${b.scheduled_date}T${b.start_time ?? '00:00'}`)
    const hoursUntil = (sessionDate.getTime() - Date.now()) / 3_600_000
    const totalAmt = parseFloat(String(b.total_amount))
    refundAmount = hoursUntil >= 24 ? totalAmt : totalAmt * 0.5

    const payment = await bookingsRepo.getPaymentTransaction(bookingId)
    if (payment?.transaction_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(payment.transaction_id)
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id

        if (paymentIntentId) {
          await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: Math.round(refundAmount * 100),
          })
          refundStatus = hoursUntil >= 24 ? 'full' : 'partial'
          update.payment_status = 'refunded'
          await supabaseAdmin.from('payments').update({ status: 'refunded' }).eq('booking_id', bookingId)
        }
      } catch (err) {
        console.error('[cancelBooking] Stripe refund failed:', err)
      }
    }
  }

  await bookingsRepo.update(bookingId, update)

  // Emails + notifications (fire and forget)
  const [customerAuth, providerAuth] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(b.customer_id),
    supabaseAdmin.auth.admin.getUserById(b.provider_id),
  ])
  const customerEmail = customerAuth.data?.user?.email ?? ''
  const providerEmail = providerAuth.data?.user?.email ?? ''
  const customerName = b.customer?.full_name ?? ''
  const providerName = b.provider?.full_name ?? ''
  const cancelledBy = isCustomer ? 'customer' : 'provider'

  notifyBookingStatusChange({
    bookingId, bookingCode: b.booking_code, status: 'cancelled',
    customerId: b.customer_id, providerId: b.provider_id,
    customerName, providerName,
  }).catch(() => {})

  if (customerEmail) {
    sendBookingCancelledBoth({
      to: customerEmail, name: customerName, otherName: providerName,
      bookingCode: b.booking_code, bookingId, scheduledDate: b.scheduled_date, cancelledBy,
    }).catch(() => {})
  }
  if (providerEmail) {
    sendBookingCancelledBoth({
      to: providerEmail, name: providerName, otherName: customerName,
      bookingCode: b.booking_code, bookingId, scheduledDate: b.scheduled_date, cancelledBy,
    }).catch(() => {})
  }

  return {
    refundAmount: refundAmount || undefined,
    refundStatus: refundStatus || undefined,
  }
}
