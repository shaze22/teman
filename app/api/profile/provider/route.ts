import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { Errors } from '@/lib/errors'

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  bio: z.string().optional(),
  locationState: z.string().min(2),
  locationCity: z.string().min(2),
  languages: z.array(z.string()).min(1),
  hasTransport: z.enum(['none', 'motorcycle', 'car']),
  pricingUpdates: z.array(z.object({ id: z.string(), price: z.number().min(5) })).optional(),
})

export const PATCH = withAuth(async ({ user, req }) => {
  const data = await parseBody(req, schema)
  const now = new Date().toISOString()

  const { data: profile } = await supabaseAdmin
    .from('provider_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!profile) throw Errors.notFound('Profil')

  const [userErr, profileErr] = await Promise.all([
    supabaseAdmin.from('users')
      .update({ full_name: data.fullName, phone: data.phone, updated_at: now })
      .eq('id', user.id).then(r => r.error),
    supabaseAdmin.from('provider_profiles').update({
      full_name: data.fullName, bio: data.bio ?? null,
      location_state: data.locationState, location_city: data.locationCity,
      languages: data.languages, has_transport: data.hasTransport, updated_at: now,
    }).eq('id', profile.id).then(r => r.error),
  ])
  if (userErr) throw Errors.serverError(userErr.message)
  if (profileErr) throw Errors.serverError(profileErr.message)

  if (data.pricingUpdates?.length) {
    for (const { id, price } of data.pricingUpdates) {
      await supabaseAdmin.from('provider_pricing')
        .update({ price, updated_at: now }).eq('id', id).eq('profile_id', profile.id)
    }
  }

  return NextResponse.json({ success: true })
})
