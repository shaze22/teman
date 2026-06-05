import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [profileRes, pricingRes] = await Promise.all([
    supabaseAdmin
      .from('single_mother_profiles')
      .select('id, user_id, is_locum, locum_verified, locum_cert_type')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('provider_pricing')
      .select('service_type, price')
      .eq('profile_id', id)
      .eq('is_active', true),
  ])

  const activeServiceTypes = (pricingRes.data ?? []).map((p) => p.service_type as string)
  const userId = profileRes.data?.user_id

  // Fetch active duo pair for this companion
  let duoInfo: {
    hasDuo: boolean
    duoPartnerId: string | null
    duoPartnerProfileId: string | null
    duoPartnerName: string | null
    duoPartnerAvatarUrl: string | null
    duoPartnerPrice: number | null
  } = { hasDuo: false, duoPartnerId: null, duoPartnerProfileId: null, duoPartnerName: null, duoPartnerAvatarUrl: null, duoPartnerPrice: null }

  if (userId) {
    const { data: pair } = await supabaseAdmin
      .from('companion_pairs')
      .select('requester_id, partner_id')
      .or(`requester_id.eq.${userId},partner_id.eq.${userId}`)
      .eq('status', 'active')
      .maybeSingle()

    if (pair) {
      const partnerId = pair.requester_id === userId ? pair.partner_id : pair.requester_id

      const [partnerUserRes, partnerProfileRes] = await Promise.all([
        supabaseAdmin.from('users').select('id, full_name, avatar_url').eq('id', partnerId).single(),
        supabaseAdmin.from('single_mother_profiles').select('id, provider_pricing(price, is_active, service_type)').eq('user_id', partnerId).single(),
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const partnerFoodPricing = (partnerProfileRes.data?.provider_pricing as any[])
        ?.find((pr) => pr.service_type === 'food' && pr.is_active)

      duoInfo = {
        hasDuo: true,
        duoPartnerId: partnerId,
        duoPartnerProfileId: partnerProfileRes.data?.id ?? null,
        duoPartnerName: partnerUserRes.data?.full_name ?? null,
        duoPartnerAvatarUrl: partnerUserRes.data?.avatar_url ?? null,
        duoPartnerPrice: partnerFoodPricing ? parseFloat(partnerFoodPricing.price) : null,
      }
    }
  }

  return NextResponse.json({
    ...(profileRes.data ?? {}),
    activeServiceTypes,
    ...duoInfo,
  })
}
