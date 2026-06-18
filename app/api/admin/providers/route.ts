import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAdmin } from '@/lib/api/handler'

export const PATCH = withAdmin(async ({ req }) => {
  const { profileId, userId, verifiedByAdmin, suspend } = await req.json()
  const now = new Date().toISOString()

  if (suspend !== undefined) {
    await supabaseAdmin.from('users')
      .update({ status: suspend ? 'suspended' : 'active', updated_at: now })
      .eq('id', userId)
    await supabaseAdmin.from('provider_profiles')
      .update({ is_active: !suspend, updated_at: now })
      .eq('id', profileId)
    return NextResponse.json({ ok: true })
  }

  const update: Record<string, unknown> = { updated_at: now }
  if (verifiedByAdmin !== undefined) update.is_active = verifiedByAdmin

  await supabaseAdmin.from('provider_profiles').update(update).eq('id', profileId)
  return NextResponse.json({ ok: true })
})
