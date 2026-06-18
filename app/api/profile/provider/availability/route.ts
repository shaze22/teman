import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  slots: z.array(z.object({
    id: z.string(),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
  })),
})

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Invalid data' }, { status: 400 })

  const { slots } = parsed.data

  // Get provider profile id (used as FK in provider_availabilities)
  const { data: profile } = await supabaseAdmin
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!profile) return NextResponse.json({ message: 'Provider profile not found' }, { status: 404 })

  // Replace all recurring slots
  await supabaseAdmin.from('provider_availabilities').delete().eq('profile_id', profile.id).eq('is_recurring', true)

  if (slots.length > 0) {
    const { error } = await supabaseAdmin.from('provider_availabilities').insert(
      slots.map(s => ({
        id: crypto.randomUUID(),
        profile_id: profile.id,
        day_of_week: s.dayOfWeek,
        start_time: s.startTime,
        end_time: s.endTime,
        is_recurring: true,
        is_available: true,
      }))
    )
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
