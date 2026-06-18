import { supabaseAdmin } from '@/lib/supabase/admin'
import { Errors } from '@/lib/errors'
import { bookingsRepo } from '@/lib/repositories/bookings'
import { walletsRepo } from '@/lib/repositories/wallets'
import { getProviderAmount } from '@/lib/services'
import { notifyBookingStatusChange, notifyFundsReleased } from '@/lib/notifications'
import { sendBookingCompletedCustomer } from '@/lib/email'

export async function completeBooking(bookingId: string, userId: string): Promise<void> {
  const booking = await bookingsRepo.findByIdWithParties(bookingId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = booking as any

  const isProvider = b.provider_id === userId
  const isCustomer = b.customer_id === userId
  if (!isProvider && !isCustomer) throw Errors.forbidden()

  if (b.status !== 'in_progress' && b.status !== 'confirmed')
    throw Errors.badRequest('Booking cannot be completed in its current status')

  const now = new Date().toISOString()
  await bookingsRepo.update(bookingId, {
    status: 'completed',
    checked_out_at: now,
    completed_at: now,
  })

  // Referral reward: trigger on provider's first completed booking
  const { data: reward } = await supabaseAdmin
    .from('referral_rewards')
    .select('id, referrer_id, referrer_amount, referee_amount')
    .eq('referee_id', b.provider_id)
    .eq('status', 'pending')
    .maybeSingle()

  if (reward) {
    const completedCount = await bookingsRepo.countCompleted(b.provider_id)
    if (completedCount === 1) {
      const refereeCredit = parseFloat(String(reward.referee_amount))
      const referrerCredit = parseFloat(String(reward.referrer_amount))

      await Promise.all([
        walletsRepo.credit(b.provider_id, refereeCredit, {
          referenceType: 'referral',
          referenceId: reward.id,
          description: 'Referral bonus — first session completed!',
        }),
        walletsRepo.credit(reward.referrer_id, referrerCredit, {
          referenceType: 'referral',
          referenceId: reward.id,
          description: 'Referral commission — your referral completed their first session!',
        }),
      ])

      await supabaseAdmin.from('referral_rewards')
        .update({ status: 'credited', booking_id: bookingId, credited_at: now })
        .eq('id', reward.id)
    }
  }

  // Auto-release escrow — atomic flag flip prevents double-release under concurrent requests
  if (b.payment_status === 'paid') {
    const wasFirst = await bookingsRepo.releaseEscrow(bookingId)
    if (wasFirst) {
      const providerNet = getProviderAmount(b.service_type, parseFloat(String(b.provider_price)))
      const newBalance = await walletsRepo.credit(b.provider_id, providerNet, {
        referenceType: 'booking',
        referenceId: bookingId,
        description: `Earnings from booking #${b.booking_code}`,
      })

      // Denormalize earnings on provider_profiles (non-fatal)
      void supabaseAdmin.from('provider_profiles')
        .update({ earnings_total: newBalance, updated_at: now })
        .eq('user_id', b.provider_id)

      notifyFundsReleased({
        bookingId, bookingCode: b.booking_code,
        providerId: b.provider_id, amount: providerNet,
      }).catch(() => {})
    }
  }

  // Notifications + email (fire and forget)
  const [customerAuth, providerAuth] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(b.customer_id),
    supabaseAdmin.auth.admin.getUserById(b.provider_id),
  ])
  const customerEmail = customerAuth.data?.user?.email ?? ''
  const customerName = b.customer?.full_name ?? ''
  const providerName = b.provider?.full_name ?? ''

  notifyBookingStatusChange({
    bookingId, bookingCode: b.booking_code, status: 'completed',
    customerId: b.customer_id, providerId: b.provider_id,
    customerName, providerName,
  }).catch(() => {})

  if (customerEmail) {
    sendBookingCompletedCustomer({
      to: customerEmail, customerName, providerName,
      bookingCode: b.booking_code, bookingId,
    }).catch(() => {})
  }
}
