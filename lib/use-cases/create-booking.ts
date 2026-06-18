import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Errors } from '@/lib/errors'
import { providersRepo } from '@/lib/repositories/providers'
import { usersRepo } from '@/lib/repositories/users'
import { getPlatformFee, getProviderAmount, LOCUM_TYPES } from '@/lib/services'
import { notifyNewBooking } from '@/lib/notifications'
import { sendBookingNewProvider } from '@/lib/email'

export const createBookingSchema = z.object({
  providerId: z.string(),
  serviceType: z.enum(['nursing', 'physiotherapy', 'home_care', 'medical_escort', 'riadah', 'ibadah', 'makan']),
  scheduledDate: z.string(),
  startTime: z.string(),
  durationHours: z.number().int().min(1).max(24),
  locationAddress: z.string().optional(),
  requirements: z.string().optional(),
  recipientName: z.string().optional(),
  paymentMethod: z.enum(['stripe', 'cash']).default('stripe'),
  promoCode: z.string().optional(),
  // discountAmount is derived server-side from promoCode; client value is ignored
  creditUsed: z.number().nonnegative().default(0),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>

export async function createBooking(
  customerId: string,
  input: CreateBookingInput,
): Promise<{ id: string; bookingCode: string }> {
  const providerProfile = await providersRepo.findProfileByUserId(input.providerId)

  if (!providerProfile.is_active || !providerProfile.ic_verified)
    throw Errors.forbidden('Provider is not verified or inactive')

  if (!providerProfile.is_available)
    throw Errors.conflict('Provider is not available for bookings')

  if (LOCUM_TYPES.includes(input.serviceType) && !providerProfile.license_verified)
    throw Errors.forbidden('Provider license not verified for this service type')

  const pricing = await providersRepo.getPricingForService(providerProfile.id, input.serviceType)
  if (!pricing) throw Errors.badRequest('Provider does not offer this service')

  const baseAmount = Number(pricing.price) * input.durationHours
  const platformFee = getPlatformFee(input.serviceType, baseAmount)
  const providerPrice = getProviderAmount(input.serviceType, baseAmount)

  // Re-validate promo server-side — never trust client-supplied discountAmount
  let serverDiscountAmount = 0
  let promoId: string | null = null
  if (input.promoCode) {
    const { data: promo } = await supabaseAdmin
      .from('promo_codes')
      .select('id, discount_type, discount_value, min_purchase, max_uses, uses_count, expires_at')
      .eq('code', input.promoCode.toUpperCase())
      .maybeSingle()

    if (!promo) throw Errors.badRequest('Invalid promo code')
    if (promo.expires_at && new Date(promo.expires_at) < new Date())
      throw Errors.badRequest('Promo code has expired')
    if (promo.max_uses !== null && (promo.uses_count ?? 0) >= promo.max_uses)
      throw Errors.badRequest('Promo code usage limit reached')
    if (promo.min_purchase && baseAmount < promo.min_purchase)
      throw Errors.badRequest(`Minimum purchase of RM${promo.min_purchase} required`)

    serverDiscountAmount = promo.discount_type === 'percentage'
      ? (baseAmount * promo.discount_value) / 100
      : promo.discount_value
    serverDiscountAmount = Math.min(serverDiscountAmount, baseAmount)
    promoId = promo.id
  }

  // Validate requested credit against actual balance before creating booking
  let creditUsed = 0
  if (input.creditUsed > 0) {
    const currentCredit = await usersRepo.getCreditBalance(customerId)
    creditUsed = Math.min(input.creditUsed, currentCredit)
  }

  const totalAmount = Math.max(0, baseAmount - serverDiscountAmount - creditUsed)
  const bookingCode = 'BK' + Date.now().toString(36).toUpperCase()

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .insert({
      id: crypto.randomUUID(),
      booking_code: bookingCode,
      customer_id: customerId,
      provider_id: providerProfile.user_id,
      service_type: input.serviceType,
      scheduled_date: input.scheduledDate,
      start_time: input.startTime,
      duration_hours: input.durationHours,
      location_address: input.locationAddress ?? null,
      requirements: input.requirements ?? null,
      recipient_name: input.recipientName ?? null,
      booked_by_care_center: !!(input.recipientName),
      provider_price: providerPrice,
      platform_fee: platformFee,
      total_amount: totalAmount,
      payment_method: input.paymentMethod,
      promo_code: input.promoCode ?? null,
      discount_amount: serverDiscountAmount,
      updated_at: new Date().toISOString(),
    })
    .select('id, booking_code')
    .single()

  if (bookingError || !booking) throw Errors.serverError('Failed to create booking')

  // Atomic credit deduction — single UPDATE prevents concurrent over-spend
  if (creditUsed > 0) {
    const { data: deducted, error: creditError } = await supabaseAdmin.rpc('atomic_deduct_credit', {
      p_user_id: customerId,
      p_amount:  creditUsed,
    })
    if (creditError || !deducted) {
      // Rollback booking if credit deduction fails
      await supabaseAdmin.from('bookings').delete().eq('id', booking.id)
      throw Errors.conflict('Insufficient credit balance')
    }
  }

  // Increment promo uses_count atomically (non-fatal if it fails)
  if (promoId) {
    void supabaseAdmin.rpc('atomic_increment_promo_uses', { p_promo_id: promoId }).then(null, () => {})
  }

  // Notify provider (fire and forget)
  const [customerUser, providerAuth] = await Promise.all([
    supabaseAdmin.from('users').select('full_name').eq('id', customerId).single(),
    supabaseAdmin.auth.admin.getUserById(providerProfile.user_id),
  ])
  const customerName = customerUser.data?.full_name ?? ''
  const providerEmail = providerAuth.data?.user?.email ?? ''

  notifyNewBooking({
    bookingId: booking.id,
    bookingCode: booking.booking_code,
    providerId: providerProfile.user_id,
    customerName,
    scheduledDate: input.scheduledDate,
  }).catch(() => {})

  if (providerEmail) {
    sendBookingNewProvider({
      to: providerEmail,
      providerName: '',
      customerName,
      bookingCode: booking.booking_code,
      bookingId: booking.id,
      scheduledDate: input.scheduledDate,
      serviceType: input.serviceType,
      totalAmount,
    }).catch(() => {})
  }

  return { id: booking.id, bookingCode: booking.booking_code }
}
