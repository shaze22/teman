import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const PROVIDER_ROLES = ['companion', 'locum_nurse', 'locum_physio', 'locum_care_aide', 'medical_escort']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { partnerId } = await req.json()
  if (!partnerId || partnerId === user.id) {
    return NextResponse.json({ error: 'Invalid partner' }, { status: 400 })
  }

  const { data: partnerUser } = await supabaseAdmin
    .from('users')
    .select('id, role, status')
    .eq('id', partnerId)
    .in('role', PROVIDER_ROLES)
    .single()

  if (!partnerUser) {
    return NextResponse.json({ error: 'Partner is not a registered provider' }, { status: 400 })
  }
  if (partnerUser.status !== 'active') {
    return NextResponse.json({ error: 'Partner account is not active' }, { status: 400 })
  }

  const { data: existingPair } = await supabaseAdmin
    .from('companion_pairs')
    .select('id')
    .or(`requester_id.eq.${user.id},partner_id.eq.${user.id},requester_id.eq.${partnerId},partner_id.eq.${partnerId}`)
    .in('status', ['pending', 'active'])
    .maybeSingle()

  if (existingPair) {
    return NextResponse.json({ error: 'One of you already has an active or pending pairing' }, { status: 409 })
  }

  const { error } = await supabaseAdmin
    .from('companion_pairs')
    .insert({ requester_id: user.id, partner_id: partnerId, status: 'pending' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('notifications').insert({
    user_id: partnerId,
    type: 'duo_request',
    title: 'Duo Companion Invitation',
    body: 'A provider has invited you to become a duo companion. Check your dashboard to accept or decline.',
    data: { requesterId: user.id },
  })

  return NextResponse.json({ success: true })
}
