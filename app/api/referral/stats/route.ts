import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { Errors } from '@/lib/errors'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export const GET = withAuth(async ({ user }) => {
  let { data: profile } = await supabaseAdmin
    .from('provider_profiles').select('id, referral_code').eq('user_id', user.id).single()
  if (!profile) throw Errors.notFound('Profile')

  if (!profile.referral_code) {
    let code = generateReferralCode()
    for (let i = 0; i < 10; i++) {
      const { data: existing } = await supabaseAdmin
        .from('provider_profiles').select('id').eq('referral_code', code).maybeSingle()
      if (!existing) break
      code = generateReferralCode()
    }
    await supabaseAdmin.from('provider_profiles').update({ referral_code: code }).eq('id', profile.id)
    profile = { ...profile, referral_code: code }
  }

  const { data: rewards } = await supabaseAdmin
    .from('referral_rewards')
    .select('id, status, referee_id, referrer_amount, credited_at')
    .eq('referrer_id', user.id)

  const total = rewards?.length ?? 0
  const credited = rewards?.filter(r => r.status === 'credited').length ?? 0
  const totalEarned = rewards
    ?.filter(r => r.status === 'credited')
    .reduce((sum, r) => sum + parseFloat(String(r.referrer_amount)), 0) ?? 0

  return NextResponse.json({
    referralCode: profile.referral_code,
    total, pending: total - credited, credited, totalEarned,
  })
})
