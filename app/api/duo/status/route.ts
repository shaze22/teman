import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: pair } = await supabaseAdmin
    .from('companion_pairs')
    .select('id, requester_id, partner_id, status, created_at')
    .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)
    .in('status', ['pending', 'active'])
    .maybeSingle()

  if (!pair) return NextResponse.json({ pair: null })

  const partnerId = pair.requester_id === user.id ? pair.partner_id : pair.requester_id
  const isRequester = pair.requester_id === user.id

  const { data: partnerUser } = await supabaseAdmin
    .from('users')
    .select('id, full_name, avatar_url')
    .eq('id', partnerId)
    .single()

  const { data: partnerProfile } = await supabaseAdmin
    .from('single_mother_profiles')
    .select('location_city, location_state, rating_avg, ic_verified')
    .eq('user_id', partnerId)
    .maybeSingle()

  return NextResponse.json({
    pair: {
      id: pair.id,
      status: pair.status,
      isRequester,
      createdAt: pair.created_at,
      partner: {
        id: partnerUser?.id,
        fullName: partnerUser?.full_name,
        avatarUrl: partnerUser?.avatar_url,
        locationCity: partnerProfile?.location_city,
        locationState: partnerProfile?.location_state,
        ratingAvg: partnerProfile?.rating_avg,
        icVerified: partnerProfile?.ic_verified,
      },
    },
  })
}
