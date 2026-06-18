import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) }

  const { type, profileId, ngoId } = await req.json()

  if (type === 'provider') {
    const { error } = await supabaseAdmin
      .from('provider_profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', profileId)
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  } else if (type === 'customer') {
    const { error } = await supabaseAdmin
      .from('customer_profiles')
      .update({ ngo_id: ngoId ?? null })
      .eq('id', profileId)
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  } else {
    return NextResponse.json({ message: 'Invalid type' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
