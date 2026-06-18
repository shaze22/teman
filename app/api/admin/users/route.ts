import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAdmin } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'

const patchSchema = z.object({
  userId: z.string().uuid(),
  suspend: z.boolean(),
})

export const PATCH = withAdmin(async ({ req }) => {
  const { userId, suspend } = await parseBody(req, patchSchema)
  const { error } = await supabaseAdmin.from('users')
    .update({ status: suspend ? 'suspended' : 'active', updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
})
