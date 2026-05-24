import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  isForSelf: z.boolean(),
  seniorFullName: z.string().optional(),
  seniorAge: z.number().int().optional(),
  seniorPhone: z.string().optional(),
  locationState: z.string().min(2),
  locationCity: z.string().min(2),
  locationPostcode: z.string().optional(),
  mobilityStatus: z.enum(['independent', 'walking_stick', 'wheelchair', 'bedridden']),
  needs: z.array(z.string()),
  emergencyName: z.string().min(2),
  emergencyRelation: z.string().optional(),
  emergencyPhone: z.string().min(8),
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
    .from('customer_profiles')
    .select('id, emergency_contacts(id)')
    .eq('user_id', user.id)
    .single()
  if (!profile) return NextResponse.json({ message: 'Profil tidak dijumpai' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ecId = (profile as any).emergency_contacts?.[0]?.id as string | undefined

  const [userErr, profileErr] = await Promise.all([
    supabaseAdmin.from('users').update({ full_name: data.fullName, phone: data.phone, updated_at: now }).eq('id', user.id).then(r => r.error),
    supabaseAdmin.from('customer_profiles').update({
      is_for_self: data.isForSelf,
      senior_full_name: data.seniorFullName ?? null,
      senior_age: data.seniorAge ?? null,
      senior_phone: data.seniorPhone ?? null,
      location_state: data.locationState,
      location_city: data.locationCity,
      location_postcode: data.locationPostcode ?? null,
      mobility_status: data.mobilityStatus,
      needs: data.needs,
      updated_at: now,
    }).eq('id', profile.id).then(r => r.error),
  ])
  if (userErr) return NextResponse.json({ message: userErr.message }, { status: 500 })
  if (profileErr) return NextResponse.json({ message: profileErr.message }, { status: 500 })

  // Upsert emergency contact
  if (ecId) {
    await supabaseAdmin.from('emergency_contacts').update({
      name: data.emergencyName,
      relationship: data.emergencyRelation ?? '',
      phone: data.emergencyPhone,
    }).eq('id', ecId)
  } else {
    await supabaseAdmin.from('emergency_contacts').insert({
      id: crypto.randomUUID(),
      customer_profile_id: profile.id,
      name: data.emergencyName,
      relationship: data.emergencyRelation ?? '',
      phone: data.emergencyPhone,
      is_primary: true,
    })
  }

  return NextResponse.json({ success: true })
}
