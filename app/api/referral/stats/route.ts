import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let { data: profile } = await supabaseAdmin
    .from('provider_profiles')
    .select('id, referral_code')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ message: 'Profile not found' }, { status: 404 })

  // Generate code lazily for existing providers without one
  if (!profile.referral_code) {
    let code = generateReferralCode()
    for (let i = 0; i < 10; i++) {
      const { data: existing } = await supabaseAdmin
        .from('provider_profiles').select('id').eq('referral_code', code).maybeSingle()
      if (!existing) break
      code = generateReferralCode()
    }
    await supabaseAdmin.from('provider_profiles')
      .update({ referral_code: code }).eq('id', profile.id)
    profile = { ...profile, referral_code: code }
  }

  const { data: rewards } = await supabaseAdmin
    .from('referral_rewards')
    .select('id, status, referee_id, referrer_amount, credited_at')
    .eq('referrer_id', user.id)

  const total = rewards?.length ?? 0
  const credited = rewards?.filter(r => r.status === 'credited').length ?? 0
  const pending = total - credited
  const totalEarned = rewards
    ?.filter(r => r.status === 'credited')
    .reduce((sum, r) => sum + parseFloat(String(r.referrer_amount)), 0) ?? 0

  return NextResponse.json({
    referralCode: profile.referral_code,
    total,
    pending,
    credited,
    totalEarned,
  })
}
