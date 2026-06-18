import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { LOCUM_TYPES } from '@/lib/services'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [profileRes, pricingRes] = await Promise.all([
    supabaseAdmin
      .from('provider_profiles')
      .select('id, user_id, ic_verified, license_verified, is_available')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('provider_pricing')
      .select('service_type, price')
      .eq('profile_id', id)
      .eq('is_active', true),
  ])

  const profile = profileRes.data
  const allPricedTypes = (pricingRes.data ?? []).map((p) => p.service_type as string)
  const activeServiceTypes = allPricedTypes.filter((st) => {
    if (LOCUM_TYPES.includes(st)) return profile?.license_verified === true
    return profile?.ic_verified === true
  })

  return NextResponse.json({
    ...(profile ?? {}),
    activeServiceTypes,
  })
}
