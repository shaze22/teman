import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
  if (admin?.role !== 'super_admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const { centerId, userId } = await request.json()
  if (!centerId || !userId) return NextResponse.json({ message: 'Missing fields' }, { status: 400 })

  await supabaseAdmin.from('care_center_profiles').update({ is_verified: true }).eq('id', centerId)
  await supabaseAdmin.from('users').update({ status: 'active' }).eq('id', userId)

  return NextResponse.json({ success: true })
}
