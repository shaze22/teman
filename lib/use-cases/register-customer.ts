import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Errors } from '@/lib/errors'
import { usersRepo } from '@/lib/repositories/users'

export const registerCustomerSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  registrantDob: z.string().min(8),
  isForSelf: z.boolean(),
  seniorFullName: z.string().optional(),
  seniorAge: z.string().optional(),
  seniorPhone: z.string().optional(),
  locationState: z.string().min(2),
  locationCity: z.string().min(2),
  locationPostcode: z.string().optional(),
  mobilityStatus: z.enum(['independent', 'walking_stick', 'wheelchair', 'bedridden']),
  needs: z.array(z.string()),
  emergencyName: z.string().min(2),
  emergencyRelation: z.string().optional(),
  emergencyPhone: z.string().min(8),
  referralCode: z.string().optional(),
  customerConsent: z.boolean(),
})

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>

function calcAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'TM' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function registerCustomer(input: RegisterCustomerInput): Promise<void> {
  if (!input.customerConsent) throw Errors.badRequest('Consent is required')

  const registrantAge = calcAge(input.registrantDob)
  if (input.isForSelf && registrantAge < 40)
    throw Errors.badRequest('Senior must be at least 40 years old')
  if (!input.isForSelf && registrantAge < 25)
    throw Errors.badRequest('Waris must be at least 25 years old')

  // Resolve referral code
  let referrerId: string | null = null
  if (input.referralCode) {
    const { data: referrer } = await supabaseAdmin
      .from('users').select('id').eq('referral_code', input.referralCode.trim().toUpperCase()).single()
    if (referrer) referrerId = referrer.id
  }

  // Generate unique referral code for new customer
  let myReferralCode = generateReferralCode()
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabaseAdmin
      .from('users').select('id').eq('referral_code', myReferralCode).single()
    if (!existing) break
    myReferralCode = generateReferralCode()
  }

  const now = new Date().toISOString()

  // Remove orphaned record from failed previous attempt
  await supabaseAdmin.from('users').delete()
    .eq('email', input.email).neq('id', input.userId)

  const { error: userError } = await supabaseAdmin.from('users').insert({
    id: input.userId, email: input.email, phone: input.phone, full_name: input.fullName,
    role: input.isForSelf ? 'customer' : 'waris',
    status: 'active', referral_code: myReferralCode,
    referred_by: referrerId, updated_at: now,
  })
  if (userError) throw Errors.serverError(userError.message)

  // Credit referrer RM5 immediately
  if (referrerId) {
    const current = await usersRepo.getCreditBalance(referrerId)
    await usersRepo.updateCreditBalance(referrerId, current + 5)
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('customer_profiles')
    .insert({
      id: crypto.randomUUID(),
      user_id: input.userId,
      is_for_self: input.isForSelf,
      registrant_dob: input.registrantDob,
      customer_consent: true,
      customer_consent_at: now,
      senior_full_name: input.seniorFullName ?? null,
      senior_age: input.seniorAge ? parseInt(input.seniorAge) : null,
      senior_phone: input.seniorPhone ?? null,
      location_state: input.locationState,
      location_city: input.locationCity,
      location_postcode: input.locationPostcode ?? null,
      mobility_status: input.mobilityStatus,
      needs: input.needs,
      updated_at: now,
    })
    .select('id')
    .single()
  if (profileError) throw Errors.serverError(profileError.message)

  const { error: ecError } = await supabaseAdmin.from('emergency_contacts').insert({
    id: crypto.randomUUID(),
    customer_profile_id: profile.id,
    name: input.emergencyName,
    relationship: input.emergencyRelation ?? '',
    phone: input.emergencyPhone,
    is_primary: true,
  })
  if (ecError) throw Errors.serverError(ecError.message)
}
