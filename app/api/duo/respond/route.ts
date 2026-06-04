import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pairId, action } = await req.json() as { pairId: string; action: 'accept' | 'decline' }
  if (!pairId || !['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Must be the partner (receiver), not the requester
  const { data: pair } = await supabaseAdmin
    .from('companion_pairs')
    .select('id, requester_id, partner_id, status')
    .eq('id', pairId)
    .eq('partner_id', user.id)
    .eq('status', 'pending')
    .single()

  if (!pair) return NextResponse.json({ error: 'Jemputan tidak dijumpai' }, { status: 404 })

  const newStatus = action === 'accept' ? 'active' : 'dissolved'

  const { error } = await supabaseAdmin
    .from('companion_pairs')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', pairId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify requester
  const bodyMsg = action === 'accept'
    ? 'Tahniah! Pasangan Duo Companion anda telah diterima. Anda kini boleh menawarkan pakej duo kepada pelanggan.'
    : 'Maaf, jemputan Duo Companion anda telah ditolak.'

  await supabaseAdmin.from('notifications').insert({
    user_id: pair.requester_id,
    type: 'duo_response',
    title: action === 'accept' ? 'Duo Companion Diterima ✓' : 'Duo Companion Ditolak',
    body: bodyMsg,
    data: { pairId, action },
  })

  return NextResponse.json({ success: true, status: newStatus })
}
