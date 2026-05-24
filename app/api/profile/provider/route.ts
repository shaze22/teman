import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  bio: z.string().optional(),
  locationState: z.string().min(2),
  locationCity: z.string().min(2),
  locationPostcode: z.string().optional(),
  languages: z.array(z.string()).min(1),
  hasTransport: z.enum(['none', 'motorcycle', 'car']),
  childrenCount: z.number().int().min(0),
  canBringChildren: z.boolean(),
  skills: z.array(z.string()),
  pricePerHour: z.number().min(0),
})

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Data tidak sah', errors: parsed.error.flatten() }, { status: 400 })

  const data = parsed.data
  const now = new Date().toISOString()

  const { data: profile } = await supabaseAdmin
    .from('single_mother_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!profile) return NextResponse.json({ message: 'Profil tidak dijumpai' }, { status: 404 })

  const [userErr, profileErr] = await Promise.all([
    supabaseAdmin.from('users').update({ full_name: data.fullName, phone: data.phone, updated_at: now }).eq('id', user.id).then(r => r.error),
    supabaseAdmin.from('single_mother_profiles').update({
      bio: data.bio ?? null,
      location_state: data.locationState,
      location_city: data.locationCity,
      location_postcode: data.locationPostcode ?? null,
      languages: data.languages,
      has_transport: data.hasTransport,
      children_count: data.childrenCount,
      can_bring_children: data.canBringChildren,
      updated_at: now,
    }).eq('id', profile.id).then(r => r.error),
  ])
  if (userErr) return NextResponse.json({ message: userErr.message }, { status: 500 })
  if (profileErr) return NextResponse.json({ message: profileErr.message }, { status: 500 })

  // Replace skills
  await supabaseAdmin.from('provider_skills').delete().eq('profile_id', profile.id)
  if (data.skills.length > 0) {
    await supabaseAdmin.from('provider_skills').insert(
      data.skills.map(s => ({ id: crypto.randomUUID(), profile_id: profile.id, skill_name: s, skill_category: s }))
    )
  }

  // Upsert pricing
  const { data: existing } = await supabaseAdmin
    .from('provider_pricing')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('service_type', 'job')
    .single()

  if (existing) {
    await supabaseAdmin.from('provider_pricing').update({ price: data.pricePerHour, updated_at: now }).eq('id', existing.id)
  } else {
    await supabaseAdmin.from('provider_pricing').insert({
      id: crypto.randomUUID(), profile_id: profile.id,
      service_type: 'job', pricing_type: 'per_hour',
      price: data.pricePerHour, updated_at: now,
    })
  }

  return NextResponse.json({ success: true })
}
