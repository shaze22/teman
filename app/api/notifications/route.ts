import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'

export const GET = withAuth(async ({ user }) => {
  const { data } = await supabaseAdmin
    .from('notifications')
    .select('id, type, title, message, action_url, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)
  return NextResponse.json(data ?? [])
})

const patchSchema = z.object({ id: z.string().uuid() })

export const PATCH = withAuth(async ({ user, req }) => {
  const { id } = await parseBody(req, patchSchema)
  await supabaseAdmin.from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
  return NextResponse.json({ ok: true })
})
