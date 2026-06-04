import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  // Find companions by name, excluding self and those already paired
  const { data: pairedIds } = await supabaseAdmin
    .from('companion_pairs')
    .select('requester_id, partner_id')
    .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)
    .in('status', ['pending', 'active'])

  const excludeIds = new Set<string>([user.id])
  for (const p of pairedIds ?? []) {
    excludeIds.add(p.requester_id)
    excludeIds.add(p.partner_id)
  }

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, full_name, avatar_url')
    .in('role', ['companion', 'single_mother'])
    .eq('status', 'active')
    .ilike('full_name', `%${q}%`)
    .not('id', 'in', `(${[...excludeIds].join(',')})`)
    .limit(8)

  if (!users?.length) return NextResponse.json([])

  const profiles = await supabaseAdmin
    .from('single_mother_profiles')
    .select('user_id, location_city, location_state, ic_verified, rating_avg')
    .in('user_id', users.map((u) => u.id))

  const profileMap = Object.fromEntries((profiles.data ?? []).map((p) => [p.user_id, p]))

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      fullName: u.full_name,
      avatarUrl: u.avatar_url,
      locationCity: profileMap[u.id]?.location_city ?? '',
      locationState: profileMap[u.id]?.location_state ?? '',
      icVerified: profileMap[u.id]?.ic_verified ?? false,
      ratingAvg: profileMap[u.id]?.rating_avg ?? '0',
    }))
  )
}
