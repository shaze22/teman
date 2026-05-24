import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function generateReferralCode(name: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}${suffix}`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
  if (!u || u.role !== 'ngo_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, regNumber, contactPerson, email, phone, address, city, state } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nama NGO diperlukan' }, { status: 400 })

  // Check already registered
  const { data: existing } = await supabaseAdmin.from('ngos').select('id').eq('admin_user_id', user.id).single()
  if (existing) return NextResponse.json({ error: 'NGO sudah didaftarkan' }, { status: 400 })

  const now = new Date().toISOString()
  const referralCode = generateReferralCode(name)

  const { error } = await supabaseAdmin.from('ngos').insert({
    id: crypto.randomUUID(),
    name,
    reg_number: regNumber || null,
    contact_person: contactPerson || null,
    email: email || null,
    phone: phone || null,
    address: address || null,
    city: city || null,
    state: state || null,
    admin_user_id: user.id,
    status: 'pending',
    referral_code: referralCode,
    created_at: now,
    updated_at: now,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
