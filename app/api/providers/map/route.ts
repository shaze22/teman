import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('single_mother_profiles')
    .select(`
      id, lat, lng, location_city, location_state, rating_avg, total_reviews,
      users!inner(full_name, avatar_url),
      provider_pricing(price, is_active, service_type)
    `)
    .eq('verified_by_admin', true)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
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
      lat: p.lat as number,
      lng: p.lng as number,
      fullName: p.users.full_name as string,
      avatarUrl: p.users.avatar_url as string | null,
      locationCity: p.location_city as string,
      locationState: p.location_state as string,
      ratingAvg: parseFloat(String(p.rating_avg)),
      totalReviews: p.total_reviews as number,
      minPrice,
    }
  })

  return NextResponse.json(formatted)
}
