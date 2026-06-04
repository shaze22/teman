import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [profileRes, pricingRes] = await Promise.all([
    supabaseAdmin
      .from('single_mother_profiles')
      .select('id, is_locum, locum_verified, locum_cert_type')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('provider_pricing')
      .select('service_type')
      .eq('profile_id', id)
      .eq('is_active', true),
  ])

  const activeServiceTypes = (pricingRes.data ?? []).map((p) => p.service_type as string)

  return NextResponse.json({
    ...(profileRes.data ?? {}),
    activeServiceTypes,
  })
}
