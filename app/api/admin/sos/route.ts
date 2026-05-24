import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function isAdmin(userId: string) {
  const { data } = await supabaseAdmin.from('users').select('role').eq('id', userId).single()
  return data?.role === 'super_admin' || data?.role === 'ngo_admin'
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sosId, status } = await req.json()
  const now = new Date().toISOString()

  await supabaseAdmin.from('sos_events').update({
    status,
    resolved_at: now,
    resolved_by: user.id,
  }).eq('id', sosId)

  return NextResponse.json({ ok: true })
}
