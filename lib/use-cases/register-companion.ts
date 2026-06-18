import { supabaseAdmin } from '@/lib/supabase/admin'
import { Errors } from '@/lib/errors'
import { compareFaceWithIC } from '@/lib/gemini'

export interface RegisterCompanionInput {
  userId: string
  fullName: string
  email: string
  phone: string
  locationState: string
  locationCity: string
  referralCode?: string | null
  icFrontFile: File
  selfieFile: File
}

async function uniqueReferralCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  for (let i = 0; i < 10; i++) {
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const { data } = await supabaseAdmin.from('provider_profiles').select('id').eq('referral_code', code).maybeSingle()
    if (!data) return code
  }
  const chars2 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars2[Math.floor(Math.random() * chars2.length)]).join('')
    + Date.now().toString(36).slice(-2).toUpperCase()
}

export async function registerCompanion(input: RegisterCompanionInput): Promise<void> {
  const { userId, fullName, email, phone, locationState, locationCity,
    referralCode, icFrontFile, selfieFile } = input

  const [ic, selfie] = await Promise.all([
    icFrontFile.arrayBuffer().then(b => Buffer.from(b)),
    selfieFile.arrayBuffer().then(b => Buffer.from(b)),
  ])

  const result = await compareFaceWithIC(
    ic.toString('base64'), icFrontFile.type || 'image/jpeg',
    selfie.toString('base64'), selfieFile.type || 'image/jpeg',
  )

  if (!result.faceMatch || !result.icAuthentic || !result.isAdult)
    throw Errors.unprocessable('Identity verification failed. Please retry with clearer photos.')

  const now = new Date().toISOString()

  async function uploadFile(buf: Buffer, path: string, mimeType: string): Promise<string | null> {
    const { error } = await supabaseAdmin.storage.from('ic-documents')
      .upload(path, buf, { contentType: mimeType, upsert: true })
    if (error) throw new Error(error.message)
    return supabaseAdmin.storage.from('ic-documents').getPublicUrl(path).data.publicUrl
  }

  const [icUrl, selfieUrl] = await Promise.all([
    uploadFile(ic, `${userId}/ic-front.jpg`, icFrontFile.type || 'image/jpeg'),
    uploadFile(selfie, `${userId}/selfie.jpg`, selfieFile.type || 'image/jpeg'),
  ])

  let referrerId: string | null = null
  if (referralCode) {
    const { data: referrer } = await supabaseAdmin
      .from('provider_profiles').select('user_id').eq('referral_code', referralCode).maybeSingle()
    referrerId = referrer?.user_id ?? null
  }

  const newReferralCode = await uniqueReferralCode()

  const { error: userError } = await supabaseAdmin.from('users').insert({
    id: userId, email, phone, full_name: fullName,
    role: 'companion', status: 'active',
    referred_by: referrerId ? referralCode : null,
    updated_at: now,
  })
  if (userError) throw Errors.serverError(userError.message)

  const profileId = crypto.randomUUID()
  const { error: profileError } = await supabaseAdmin.from('provider_profiles').insert({
    id: profileId, user_id: userId, full_name: fullName,
    location_state: locationState, location_city: locationCity,
    languages: ['bm'], ic_url: icUrl, ic_verified: true, selfie_url: selfieUrl,
    gemini_confidence: result.confidence ?? null,
    gemini_face_match: result.faceMatch,
    gemini_verified_at: now,
    companion_consent: true, companion_consent_at: now,
    referral_code: newReferralCode,
    is_active: true, is_available: true, updated_at: now,
  })
  if (profileError) throw Errors.serverError(profileError.message)

  await supabaseAdmin.from('provider_pricing').insert([
    { id: crypto.randomUUID(), profile_id: profileId, service_type: 'makan', pricing_type: 'per_session', price: 35, is_active: true, updated_at: now },
    { id: crypto.randomUUID(), profile_id: profileId, service_type: 'riadah', pricing_type: 'per_session', price: 30, is_active: true, updated_at: now },
    { id: crypto.randomUUID(), profile_id: profileId, service_type: 'ibadah', pricing_type: 'per_session', price: 30, is_active: true, updated_at: now },
  ])

  if (referrerId) {
    void supabaseAdmin.from('referral_rewards').insert({
      referrer_id: referrerId, referee_id: userId, status: 'pending',
    }).then(null, () => {})
  }
}
