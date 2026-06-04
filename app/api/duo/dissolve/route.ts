import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pairId } = await req.json()

  const { data: pair } = await supabaseAdmin
    .from('companion_pairs')
    .select('id, requester_id, partner_id, status')
    .eq('id', pairId)
    .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)
    .in('status', ['pending', 'active'])
    .single()

  if (!pair) return NextResponse.json({ error: 'Pasangan tidak dijumpai' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('companion_pairs')
    .update({ status: 'dissolved', updated_at: new Date().toISOString() })
    .eq('id', pairId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the other party
  const otherId = pair.requester_id === user.id ? pair.partner_id : pair.requester_id
  await supabaseAdmin.from('notifications').insert({
    user_id: otherId,
    type: 'duo_dissolved',
    title: 'Pasangan Duo Dibubarkan',
    body: 'Pasangan Duo Companion anda telah dibubarkan. Anda boleh mencari pasangan baru bila-bila masa.',
    data: { pairId },
  })

  return NextResponse.json({ success: true })
}
