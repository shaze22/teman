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
  languages: z.array(z.string()).min(1),
  hasTransport: z.enum(['none', 'motorcycle', 'car']),
  pricingUpdates: z.array(z.object({
    id: z.string(),
    price: z.number().min(5),
  })).optional(),
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
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) return NextResponse.json({ message: 'Profil tidak dijumpai' }, { status: 404 })

  const [userErr, profileErr] = await Promise.all([
    supabaseAdmin.from('users').update({ full_name: data.fullName, phone: data.phone, updated_at: now }).eq('id', user.id).then(r => r.error),
    supabaseAdmin.from('provider_profiles').update({
      full_name: data.fullName,
      bio: data.bio ?? null,
      location_state: data.locationState,
      location_city: data.locationCity,
      languages: data.languages,
      has_transport: data.hasTransport,
      updated_at: now,
    }).eq('id', profile.id).then(r => r.error),
  ])
  if (userErr) return NextResponse.json({ message: userErr.message }, { status: 500 })
  if (profileErr) return NextResponse.json({ message: profileErr.message }, { status: 500 })

  // Update pricing per service if provided
  if (data.pricingUpdates?.length) {
    for (const { id, price } of data.pricingUpdates) {
      await supabaseAdmin.from('provider_pricing').update({ price, updated_at: now }).eq('id', id).eq('profile_id', profile.id)
    }
  }

  return NextResponse.json({ success: true })
}
