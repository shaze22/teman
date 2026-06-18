import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('provider_profiles')
    .select(`
      id, lat, lng, location_city, location_state, rating_avg, total_reviews,
      users!provider_profiles_user_id_fkey(full_name, avatar_url),
      provider_pricing(price, is_active, service_type)
    `)
    .eq('is_active', true)
    .eq('ic_verified', true)
    .not('location_lat', 'is', null)
    .not('location_lng', 'is', null)
    .limit(200)

  if (error) {
    console.error('[providers/map]', error)
    return NextResponse.json([])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatted = (data ?? []).map((p: any) => {
    const activePricing = (p.provider_pricing as any[]).filter((pr: any) => pr.is_active)
    const minPrice = activePricing.length > 0
      ? Math.min(...activePricing.map((pr: any) => parseFloat(pr.price)))
      : null

    return {
      id: p.id as string,
      lat: p.location_lat as number,
      lng: p.location_lng as number,
      fullName: p.users?.full_name as string,
      avatarUrl: p.users?.avatar_url as string | null,
      locationCity: p.location_city as string,
      locationState: p.location_state as string,
      ratingAvg: parseFloat(String(p.rating_avg ?? 0)),
      totalReviews: p.total_reviews as number,
      minPrice,
    }
  })

  return NextResponse.json(formatted)
}
