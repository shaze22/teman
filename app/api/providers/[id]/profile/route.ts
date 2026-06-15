import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

  const activeServiceTypes = (pricingRes.data ?? []).map((p) => p.service_type as string)

  return NextResponse.json({
    ...(profileRes.data ?? {}),
    activeServiceTypes,
  })
}
