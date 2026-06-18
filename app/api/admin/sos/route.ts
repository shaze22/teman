import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAdmin } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'

const patchSchema = z.object({
  sosId: z.string().uuid(),
  status: z.enum(['resolved', 'false_alarm']),
})

export const PATCH = withAdmin(async ({ user, req }) => {
  const { sosId, status } = await parseBody(req, patchSchema)
  const { error } = await supabaseAdmin.from('sos_events').update({
    status,
    resolved_at: new Date().toISOString(),
    resolved_by: user.id,
  }).eq('id', sosId)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
})
