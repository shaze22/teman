import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function isAdmin(userId: string) {
  const { data } = await supabaseAdmin.from('users').select('role').eq('id', userId).single()
  return data?.role === 'super_admin'
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profileId, userId, verifiedByAdmin, bgCheck, suspend } = await req.json()
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
  if (verifiedByAdmin !== undefined) {
    update.is_active = verifiedByAdmin
  }

  await supabaseAdmin.from('provider_profiles').update(update).eq('id', profileId)
  return NextResponse.json({ ok: true })
}
