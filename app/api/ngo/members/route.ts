import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
  if (!u || u.role !== 'ngo_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { profileId, ngoId, verifiedByNgo } = await req.json()

  // Verify this NGO belongs to this admin
  const { data: ngo } = await supabaseAdmin
    .from('ngos')
    .select('id')
    .eq('id', ngoId)
    .eq('admin_user_id', user.id)
    .single()

  if (!ngo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await supabaseAdmin.from('provider_profiles')
    .update({ ic_verified: verifiedByNgo, updated_at: new Date().toISOString() })
    .eq('id', profileId)

  return NextResponse.json({ ok: true })
}
