import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { walletsRepo } from '@/lib/repositories/wallets'
import { getProviderAmount } from '@/lib/services'
import { notifyFundsReleased } from '@/lib/notifications'
import { Errors } from '@/lib/errors'

export const POST = withAuth(async ({ user, params }) => {
  const { id } = params

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_code, customer_id, provider_id, status, payment_status, provider_price, service_type, funds_released')
    .eq('id', id)
    .single()

  if (!booking) throw Errors.notFound('Booking')
  if (booking.customer_id !== user.id) throw Errors.forbidden('Only the customer can release funds')
  if (booking.status !== 'completed') throw Errors.badRequest('Booking is not completed')
  if (booking.payment_status !== 'paid') throw Errors.badRequest('Payment not received')
  if (booking.funds_released) throw Errors.badRequest('Funds already released')

  const now = new Date().toISOString()
  const providerNet = getProviderAmount(booking.service_type, parseFloat(String(booking.provider_price)))

  const [, newBalance] = await Promise.all([
    supabaseAdmin.from('bookings')
      .update({ funds_released: true, funds_released_at: now, updated_at: now })
      .eq('id', id),
    walletsRepo.credit(booking.provider_id, providerNet, {
      referenceType: 'booking',
      referenceId: id,
      description: `Earnings from booking #${booking.booking_code}`,
    }),
  ])

  void supabaseAdmin.from('provider_profiles')
    .update({ earnings_total: newBalance, updated_at: now })
    .eq('user_id', booking.provider_id)

  notifyFundsReleased({
    bookingId: id, bookingCode: booking.booking_code,
    providerId: booking.provider_id, amount: providerNet,
  }).catch(() => {})

  return NextResponse.json({ success: true, amountReleased: providerNet })
})
