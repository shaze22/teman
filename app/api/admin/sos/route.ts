import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAdmin } from '@/lib/api/handler'

export const PATCH = withAdmin(async ({ user, req }) => {
  const { sosId, status } = await req.json()
  await supabaseAdmin.from('sos_events').update({
    status,
    resolved_at: new Date().toISOString(),
    resolved_by: user.id,
  }).eq('id', sosId)
  return NextResponse.json({ ok: true })
})
