import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { Errors } from '@/lib/errors'

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

export const PATCH = withAuth(async ({ user, req }) => {
  const data = await parseBody(req, schema)
  const now = new Date().toISOString()

  const { data: profile } = await supabaseAdmin
    .from('customer_profiles').select('id, emergency_contacts(id)').eq('user_id', user.id).single()
  if (!profile) throw Errors.notFound('Profil')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ecId = (profile as any).emergency_contacts?.[0]?.id as string | undefined

  const [userErr, profileErr] = await Promise.all([
    supabaseAdmin.from('users')
      .update({ full_name: data.fullName, phone: data.phone, updated_at: now })
      .eq('id', user.id).then(r => r.error),
    supabaseAdmin.from('customer_profiles').update({
      is_for_self: data.isForSelf,
      senior_full_name: data.seniorFullName ?? null,
      senior_age: data.seniorAge ?? null,
      senior_phone: data.seniorPhone ?? null,
      location_state: data.locationState, location_city: data.locationCity,
      location_postcode: data.locationPostcode ?? null,
      mobility_status: data.mobilityStatus, needs: data.needs, updated_at: now,
    }).eq('id', profile.id).then(r => r.error),
  ])
  if (userErr) throw Errors.serverError(userErr.message)
  if (profileErr) throw Errors.serverError(profileErr.message)

  if (ecId) {
    await supabaseAdmin.from('emergency_contacts').update({
      name: data.emergencyName, relationship: data.emergencyRelation ?? '', phone: data.emergencyPhone,
    }).eq('id', ecId)
  } else {
    await supabaseAdmin.from('emergency_contacts').insert({
      id: crypto.randomUUID(), customer_profile_id: profile.id,
      name: data.emergencyName, relationship: data.emergencyRelation ?? '',
      phone: data.emergencyPhone, is_primary: true,
    })
  }

  return NextResponse.json({ success: true })
})
