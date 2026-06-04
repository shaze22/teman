import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  locationState: z.string().min(2),
  locationCity: z.string().min(2),
  locationPostcode: z.string().optional(),
  skills: z.array(z.string()),
  languages: z.array(z.string()),
  hasTransport: z.enum(['none', 'motorcycle', 'car']),
  bio: z.string().optional(),
  pricePerHour: z.string(),
  childrenCount: z.string(),
  canBringChildren: z.boolean(),
  ngoReferralCode: z.string().optional(),
})

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

  try {
    let ngoId: string | null = null
    if (data.ngoReferralCode) {
      const { data: ngo } = await supabaseAdmin
        .from('ngos')
        .select('id')
        .eq('referral_code', data.ngoReferralCode)
        .single()
      if (ngo) ngoId = ngo.id
    }

    await supabaseAdmin.from('users').delete().eq('email', data.email).neq('id', data.userId)

    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: data.userId,
      email: data.email,
      phone: data.phone,
      full_name: data.fullName,
      role: 'single_mother',
      status: 'pending',
      updated_at: now,
    })
    if (userError) throw new Error(userError.message)

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('single_mother_profiles')
      .insert({
        id: crypto.randomUUID(),
        user_id: data.userId,
        ngo_id: ngoId,
        referral_code: data.ngoReferralCode ?? null,
        location_state: data.locationState,
        location_city: data.locationCity,
        location_postcode: data.locationPostcode ?? null,
        languages: data.languages,
        has_transport: data.hasTransport,
        bio: data.bio ?? null,
        children_count: parseInt(data.childrenCount),
        can_bring_children: data.canBringChildren,
        is_active: false,
        updated_at: now,
      })
      .select('id')
      .single()
    if (profileError) throw new Error(profileError.message)

    if (data.skills.length > 0) {
      const { error: skillsError } = await supabaseAdmin.from('provider_skills').insert(
        data.skills.map((s) => ({ id: crypto.randomUUID(), profile_id: profile.id, skill_name: s, skill_category: s }))
      )
      if (skillsError) throw new Error(skillsError.message)
    }

    const price = parseFloat(data.pricePerHour)
    const { error: pricingError } = await supabaseAdmin.from('provider_pricing').insert(
      ['job', 'food', 'learning', 'business', 'ibadah', 'repair', 'riadah', 'kombo'].map(type => ({
        id: crypto.randomUUID(),
        profile_id: profile.id,
        service_type: type,
        pricing_type: 'per_hour',
        price,
        is_active: true,
        updated_at: now,
      }))
    )
    if (pricingError) throw new Error(pricingError.message)
  } catch (err) {
    console.error('[register/provider]', err)
    const message = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
