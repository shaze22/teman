import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest) {
  await requireAdmin()
  const { profileIds } = await req.json() as { profileIds: string[] }
  if (!Array.isArray(profileIds) || profileIds.length === 0)
    return NextResponse.json({ error: 'No profileIds provided' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('single_mother_profiles')
    .update({ verified_by_admin: true, background_check_status: 'approved', is_active: true })
    .in('id', profileIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, updated: profileIds.length })
}
