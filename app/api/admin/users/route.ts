import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAdmin } from '@/lib/api/handler'

export const PATCH = withAdmin(async ({ req }) => {
  const { userId, suspend } = await req.json()
  await supabaseAdmin.from('users')
    .update({ status: suspend ? 'suspended' : 'active', updated_at: new Date().toISOString() })
    .eq('id', userId)
  return NextResponse.json({ ok: true })
})
