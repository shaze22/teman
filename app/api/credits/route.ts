import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ balance: 0, referralCode: null })

  const { data } = await supabaseAdmin
    .from('users')
    .select('credit_balance, referral_code')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    balance: parseFloat(String(data?.credit_balance ?? 0)),
    referralCode: data?.referral_code ?? null,
  })
}
