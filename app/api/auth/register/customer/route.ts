import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
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
  ngoReferralCode: z.string().optional(),
  referralCode: z.string().optional(),
  customerConsent: z.boolean(),
})

function calcAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'TM' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Data tidak lengkap', errors: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const now = new Date().toISOString()

  // Consent must be given
  if (!data.customerConsent) {
    return NextResponse.json({ message: 'Persetujuan wajib diberikan sebelum mendaftar.' }, { status: 400 })
  }

  // Age validation
  const registrantAge = calcAge(data.registrantDob)
  if (data.isForSelf && registrantAge < 40) {
    return NextResponse.json({ message: 'Senior mestilah berumur sekurang-kurangnya 40 tahun.' }, { status: 400 })
  }
  if (!data.isForSelf && registrantAge < 25) {
    return NextResponse.json({ message: 'Waris mestilah berumur sekurang-kurangnya 25 tahun.' }, { status: 400 })
  }

  try {
    // Resolve NGO from referral code if provided
    let ngoId: string | null = null
    if (data.ngoReferralCode) {
      const { data: ngo } = await supabaseAdmin
        .from('ngos')
        .select('id')
        .eq('referral_code', data.ngoReferralCode.trim().toUpperCase())
        .eq('status', 'active')
        .single()
      if (ngo) ngoId = ngo.id
    }

    // Resolve referral code (friend referral)
    let referrerId: string | null = null
    if (data.referralCode) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referral_code', data.referralCode.trim().toUpperCase())
        .single()
      if (referrer) referrerId = referrer.id
    }

    // Generate unique referral code for new user
    let myReferralCode = generateReferralCode()
    let codeUnique = false
    for (let i = 0; i < 5 && !codeUnique; i++) {
      const { data: existing } = await supabaseAdmin.from('users').select('id').eq('referral_code', myReferralCode).single()
      if (!existing) codeUnique = true
      else myReferralCode = generateReferralCode()
    }

    // Remove orphaned record if previous registration failed mid-way
    await supabaseAdmin.from('users').delete().eq('email', data.email).neq('id', data.userId)

    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: data.userId,
      email: data.email,
      phone: data.phone,
      full_name: data.fullName,
      role: data.isForSelf ? 'customer' : 'waris',
      status: 'active',
      referral_code: myReferralCode,
      referred_by: referrerId,
      updated_at: now,
    })
    if (userError) throw new Error(userError.message)

    // Credit referrer RM5 immediately
    if (referrerId) {
      const { data: referrerUser } = await supabaseAdmin
        .from('users')
        .select('credit_balance')
        .eq('id', referrerId)
        .single()
      const current = parseFloat(String(referrerUser?.credit_balance ?? 0))
      await supabaseAdmin.from('users').update({ credit_balance: current + 5 }).eq('id', referrerId)
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('customer_profiles')
      .insert({
        id: crypto.randomUUID(),
        user_id: data.userId,
        is_for_self: data.isForSelf,
        registrant_dob: data.registrantDob,
        customer_consent: true,
        customer_consent_at: now,
        senior_full_name: data.seniorFullName ?? null,
        senior_age: data.seniorAge ? parseInt(data.seniorAge) : null,
        senior_phone: data.seniorPhone ?? null,
        location_state: data.locationState,
        location_city: data.locationCity,
        location_postcode: data.locationPostcode ?? null,
        mobility_status: data.mobilityStatus,
        needs: data.needs,
        ngo_id: ngoId,
        updated_at: now,
      })
      .select('id')
      .single()
    if (profileError) throw new Error(profileError.message)

    const { error: ecError } = await supabaseAdmin.from('emergency_contacts').insert({
      id: crypto.randomUUID(),
      customer_profile_id: profile.id,
      name: data.emergencyName,
      relationship: data.emergencyRelation ?? '',
      phone: data.emergencyPhone,
      is_primary: true,
    })
    if (ecError) throw new Error(ecError.message)
  } catch (err) {
    console.error('[register/customer]', err)
    const message = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
