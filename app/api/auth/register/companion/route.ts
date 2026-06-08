import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { compareFaceWithIC } from '@/lib/gemini'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function uniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode()
    const { data } = await supabaseAdmin.from('single_mother_profiles').select('id').eq('referral_code', code).maybeSingle()
    if (!data) return code
  }
  return generateReferralCode() + Date.now().toString(36).slice(-2).toUpperCase()
}

async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  const buf = Buffer.from(await file.arrayBuffer())
  return { base64: buf.toString('base64'), mimeType: file.type || 'image/jpeg' }
}

export async function POST(request: NextRequest) {
  let form: FormData
  try { form = await request.formData() } catch {
    return NextResponse.json({ message: 'Invalid form data' }, { status: 400 })
  }

  const userId    = form.get('userId') as string
  const fullName  = form.get('fullName') as string
  const email     = form.get('email') as string
  const phone     = form.get('phone') as string
  const locationState = form.get('locationState') as string
  const locationCity  = form.get('locationCity') as string
  const referralCodeFrom = (form.get('referralCode') as string | null)?.trim().toUpperCase() || null
  const icFrontFile   = form.get('icFront') as File | null
  const icBackFile    = form.get('icBack') as File | null
  const selfieFile    = form.get('selfie') as File | null

  if (!userId || !fullName || !email || !phone || !locationState || !locationCity) {
    return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 })
  }
  if (!icFrontFile || !selfieFile) {
    return NextResponse.json({ message: 'IC dan selfie diperlukan' }, { status: 400 })
  }

  // Server-side Gemini verification never trust client's geminiPassed claim
  let geminiPassed = false
  let geminiConfidence: string | null = null
  let geminiFaceMatch: boolean | null = null
  const geminiVerifiedAt = new Date().toISOString()
  try {
    const [ic, selfie] = await Promise.all([fileToBase64(icFrontFile), fileToBase64(selfieFile)])
    const result = await compareFaceWithIC(ic.base64, ic.mimeType, selfie.base64, selfie.mimeType)
    geminiPassed = !!(result.faceMatch && result.icAuthentic && result.isAdult)
    geminiConfidence = result.confidence ?? null
    geminiFaceMatch = result.faceMatch ?? null
    if (!geminiPassed) {
      return NextResponse.json({ message: 'Pengesahan identiti gagal. Sila cuba semula dengan gambar yang lebih jelas.' }, { status: 422 })
    }
  } catch {
    return NextResponse.json({ message: 'Pengesahan identiti gagal. Cuba lagi.' }, { status: 500 })
  }

  try {
    const now = new Date().toISOString()

    // Upload IC + selfie to storage
    async function uploadFile(file: File, path: string): Promise<string | null> {
      if (!file || file.size === 0) return null
      const buf = Buffer.from(await file.arrayBuffer())
      const { error } = await supabaseAdmin.storage.from('ic-documents').upload(path, buf, {
        contentType: file.type,
        upsert: true,
      })
      if (error) throw new Error(error.message)
      const { data } = supabaseAdmin.storage.from('ic-documents').getPublicUrl(path)
      return data.publicUrl
    }

    const icFrontUrl  = await uploadFile(icFrontFile,  `${userId}/ic-front.jpg`)
    const icBackUrl   = icBackFile ? await uploadFile(icBackFile, `${userId}/ic-back.jpg`) : null
    const selfieUrl   = await uploadFile(selfieFile,   `${userId}/selfie.jpg`)

    // Validate referral code if provided
    let referrerId: string | null = null
    if (referralCodeFrom) {
      const { data: referrer } = await supabaseAdmin
        .from('single_mother_profiles')
        .select('user_id')
        .eq('referral_code', referralCodeFrom)
        .maybeSingle()
      referrerId = referrer?.user_id ?? null
    }

    // Generate unique referral code for new companion
    const newReferralCode = await uniqueReferralCode()

    // Create user record
    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: userId,
      email,
      phone,
      full_name: fullName,
      role: 'companion',
      status: 'active',
      referred_by: referrerId ? referralCodeFrom : null,
      updated_at: now,
    })
    if (userError) throw new Error(userError.message)

    // Create profile
    const profileId = crypto.randomUUID()
    const { error: profileError } = await supabaseAdmin.from('single_mother_profiles').insert({
      id: profileId,
      user_id: userId,
      location_state: locationState,
      location_city: locationCity,
      languages: ['bm'],
      has_transport: 'none',
      is_active: true,
      ic_front_url: icFrontUrl,
      ic_back_url: icBackUrl,
      ic_submitted_at: icFrontUrl ? now : null,
      ic_verified: true,
      selfie_url: selfieUrl,
      selfie_verified_at: selfieUrl ? now : null,
      gemini_confidence: geminiConfidence,
      gemini_face_match: geminiFaceMatch,
      gemini_verified_at: geminiVerifiedAt,
      companion_consent: true,
      companion_consent_at: now,
      referral_code: newReferralCode,
      updated_at: now,
    })
    if (profileError) throw new Error(profileError.message)

    // Default pricing for food only
    await supabaseAdmin.from('provider_pricing').insert({
      id: crypto.randomUUID(),
      profile_id: profileId,
      service_type: 'food',
      pricing_type: 'per_hour',
      price: 30,
      is_active: true,
      updated_at: now,
    })

    // Create referral reward record if valid referral
    if (referrerId) {
      await supabaseAdmin.from('referral_rewards').insert({
        referrer_id: referrerId,
        referee_id: userId,
        status: 'pending',
      })
    }

  } catch (err) {
    console.error('[register/companion]', err)
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
