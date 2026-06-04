import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
  if (admin?.role !== 'super_admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const { profileId, action } = await request.json()
  if (!profileId || !action) return NextResponse.json({ message: 'Missing fields' }, { status: 400 })

  if (action === 'approve') {
    await supabaseAdmin.from('single_mother_profiles').update({
      locum_verified: true,
      locum_verified_at: new Date().toISOString(),
    }).eq('id', profileId)
  } else if (action === 'reject') {
    await supabaseAdmin.from('single_mother_profiles').update({
      is_locum: false,
      locum_verified: false,
      locum_cert_url: null,
      locum_cert_type: null,
    }).eq('id', profileId)
  }

  return NextResponse.json({ success: true })
}
