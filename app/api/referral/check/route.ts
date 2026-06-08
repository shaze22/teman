import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase()
  if (!code) return NextResponse.json({ valid: false }, { status: 400 })

  const { data } = await supabaseAdmin
    .from('single_mother_profiles')
    .select('user_id')
    .eq('referral_code', code)
    .maybeSingle()

  if (!data) return NextResponse.json({ valid: false }, { status: 404 })
  return NextResponse.json({ valid: true })
}
