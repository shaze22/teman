import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'

export const GET = withAuth(async ({ user }) => {
  const { data } = await supabaseAdmin
    .from('users').select('credit_balance, referral_code').eq('id', user.id).single()
  return NextResponse.json({
    balance: parseFloat(String(data?.credit_balance ?? 0)),
    referralCode: data?.referral_code ?? null,
  })
})
