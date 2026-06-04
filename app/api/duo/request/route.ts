import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { partnerId } = await req.json()
  if (!partnerId || partnerId === user.id) {
    return NextResponse.json({ error: 'Invalid partner' }, { status: 400 })
  }

  // Check partner is a registered companion/provider
  const { data: partnerUser } = await supabaseAdmin
    .from('users')
    .select('id, role, status')
    .eq('id', partnerId)
    .in('role', ['companion', 'single_mother'])
    .single()

  if (!partnerUser) {
    return NextResponse.json({ error: 'Partner bukan Meal Companion berdaftar' }, { status: 400 })
  }
  if (partnerUser.status !== 'active') {
    return NextResponse.json({ error: 'Akaun partner belum aktif' }, { status: 400 })
  }

  // Check neither party already has an active/pending pair
  const { data: existingPair } = await supabaseAdmin
    .from('companion_pairs')
    .select('id')
    .or(`requester_id.eq.${user.id},partner_id.eq.${user.id},requester_id.eq.${partnerId},partner_id.eq.${partnerId}`)
    .in('status', ['pending', 'active'])
    .maybeSingle()

  if (existingPair) {
    return NextResponse.json({ error: 'Salah seorang sudah mempunyai pasangan aktif atau permintaan yang belum selesai' }, { status: 409 })
  }

  const { error } = await supabaseAdmin
    .from('companion_pairs')
    .insert({ requester_id: user.id, partner_id: partnerId, status: 'pending' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify partner
  await supabaseAdmin.from('notifications').insert({
    user_id: partnerId,
    type: 'duo_request',
    title: 'Jemputan Duo Companion',
    body: 'Seorang Meal Companion menjemput anda untuk jadi pasangan duo. Buka dashboard untuk terima atau tolak.',
    data: { requesterId: user.id },
  })

  return NextResponse.json({ success: true })
}
