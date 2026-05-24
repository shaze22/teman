import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
  if (!u || u.role !== 'ngo_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ngoId, name, regNumber, contactPerson, email, phone, address, city, state } = await req.json()

  // Verify ownership
  const { data: ngo } = await supabaseAdmin.from('ngos').select('id').eq('id', ngoId).eq('admin_user_id', user.id).single()
  if (!ngo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await supabaseAdmin.from('ngos').update({
    name, reg_number: regNumber || null,
    contact_person: contactPerson || null,
    email: email || null,
    phone: phone || null,
    address: address || null,
    city: city || null,
    state: state || null,
    updated_at: new Date().toISOString(),
  }).eq('id', ngoId)

  return NextResponse.json({ ok: true })
}
