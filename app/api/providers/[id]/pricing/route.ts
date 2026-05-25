import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const type = new URL(request.url).searchParams.get('type') ?? 'job'

  const { data } = await supabaseAdmin
    .from('provider_pricing')
    .select('price, pricing_type')
    .eq('profile_id', id)
    .eq('service_type', type)
    .eq('is_active', true)
    .single()

  if (!data) {
    // Fallback: any active pricing for this provider
    const { data: fallback } = await supabaseAdmin
      .from('provider_pricing')
      .select('price, pricing_type')
      .eq('profile_id', id)
      .eq('is_active', true)
      .limit(1)
      .single()
    return NextResponse.json(fallback ?? { price: 35, pricing_type: 'per_hour' })
  }

  return NextResponse.json(data)
}
