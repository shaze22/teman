import { supabaseAdmin } from '@/lib/supabase/admin'
import { getProviderAmount } from '@/lib/services'
import { sendPaymentReceiptCustomer, sendPaymentNotifyProvider } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

export async function handlePaymentWebhook(sessionId: string, bookingId: string, userId: string): Promise<void> {
  // Idempotency: skip if already processed
  const { data: existingBooking } = await supabaseAdmin
    .from('bookings')
    .select('id, payment_status, service_type')
    .eq('id', bookingId)
    .single()

  if (existingBooking?.payment_status === 'paid') return

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('transaction_id', sessionId)
    .single()

  const now = new Date().toISOString()
  const [paymentResult, bookingResult] = await Promise.all([
    payment
      ? supabaseAdmin.from('payments').update({ status: 'paid' }).eq('id', payment.id)
      : Promise.resolve({ error: null }),
    supabaseAdmin.from('bookings')
      .update({ status: 'confirmed', payment_status: 'paid', payment_method: 'stripe', updated_at: now })
      .eq('id', bookingId),
  ])

  if (bookingResult.error) {
    console.error('[webhook] booking update failed:', bookingResult.error.message, { bookingId, sessionId })
    throw new Error(`Booking update failed: ${bookingResult.error.message}`)
  }
  if (paymentResult.error) {
    console.error('[webhook] payment update failed:', paymentResult.error.message, { bookingId, sessionId })
    // Non-fatal — booking is confirmed; payment record mismatch is fixable
  }

  // Fetch booking details for notifications
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select(`
      booking_code, scheduled_date, total_amount, provider_price, service_type, customer_id, provider_id,
      customer:users!bookings_customer_id_fkey(full_name),
      provider:users!bookings_provider_id_fkey(full_name)
    `)
    .eq('id', bookingId)
    .single()

  if (!booking) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = booking as any
  const customerId = (b.customer_id ?? userId) as string
  const providerId = b.provider_id as string

  const [customerAuth, providerAuth] = await Promise.all([
    customerId ? supabaseAdmin.auth.admin.getUserById(customerId) : Promise.resolve({ data: { user: null } }),
    providerId ? supabaseAdmin.auth.admin.getUserById(providerId) : Promise.resolve({ data: { user: null } }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customerEmail = (customerAuth as any)?.data?.user?.email ?? ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const providerEmail = (providerAuth as any)?.data?.user?.email ?? ''
  const customerName = b.customer?.full_name ?? ''
  const providerName = b.provider?.full_name ?? ''
  const totalAmount = parseFloat(String(b.total_amount))
  const providerAmount = getProviderAmount(b.service_type, parseFloat(String(b.provider_price)))

  if (providerId) {
    createNotification({
      userId: providerId,
      type: 'booking_confirmed',
      title: 'New Booking Confirmed',
      message: `${customerName} booked #${b.booking_code}. Payment received.`,
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
