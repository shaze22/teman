import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { Errors } from '@/lib/errors'

const schema = z.object({
  slots: z.array(z.object({
    id: z.string(),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
  })),
})

export const PUT = withAuth(async ({ user, req }) => {
  const { slots } = await parseBody(req, schema)

  const { data: profile } = await supabaseAdmin
    .from('provider_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) throw Errors.notFound('Provider profile')

  await supabaseAdmin.from('provider_availabilities')
    .delete().eq('profile_id', profile.id).eq('is_recurring', true)

  if (slots.length > 0) {
    const { error } = await supabaseAdmin.from('provider_availabilities').insert(
      slots.map(s => ({
        id: crypto.randomUUID(), profile_id: profile.id,
        day_of_week: s.dayOfWeek, start_time: s.startTime, end_time: s.endTime,
        is_recurring: true, is_available: true,
      }))
    )
    if (error) throw Errors.serverError(error.message)
  }

  return NextResponse.json({ success: true })
})
