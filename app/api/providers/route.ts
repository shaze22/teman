import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const type = searchParams.get('type')
  const maxPrice = searchParams.get('maxPrice')
  const sort = searchParams.get('sort') ?? 'rating'

  const orderCol = sort === 'most_booked' ? 'total_bookings' : sort === 'newest' ? 'created_at' : 'rating_avg'

  const { data: raw, error } = await supabaseAdmin
    .from('single_mother_profiles')
    .select(`
      id, location_city, location_state, rating_avg, total_reviews, bio, verified_by_ngo,
      users!inner(full_name, avatar_url),
      provider_skills(skill_category),
      provider_pricing(price, pricing_type, service_type, is_active)
    `)
    .eq('is_active', true)
    .order(orderCol, { ascending: false })
    .limit(100)

  if (error) {
    console.error('[providers GET]', error)
    return NextResponse.json([], { status: 200 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let providers: any[] = raw ?? []

  if (q) {
    const qLow = q.toLowerCase()
    providers = providers.filter(
      (p) =>
        (p.users as { full_name: string }).full_name.toLowerCase().includes(qLow) ||
        p.location_city.toLowerCase().includes(qLow) ||
        p.location_state.toLowerCase().includes(qLow)
    )
  }

  if (maxPrice) {
    const max = parseFloat(maxPrice)
    providers = providers.filter((p) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p.provider_pricing as any[]).some((pr) => pr.is_active && parseFloat(pr.price) <= max)
    )
  }

  if (type && type !== 'all') {
    providers = providers.filter((p) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p.provider_pricing as any[]).some((pr) => pr.service_type === type && pr.is_active)
    )
  }

  if (sort === 'price_asc') {
    providers.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const minA = Math.min(...(a.provider_pricing as any[]).filter((p: any) => p.is_active).map((p: any) => parseFloat(p.price)))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const minB = Math.min(...(b.provider_pricing as any[]).filter((p: any) => p.is_active).map((p: any) => parseFloat(p.price)))
      return minA - minB
    })
  }

  const formatted = providers.slice(0, 50).map((p) => ({
    id: p.id,
    fullName: (p.users as { full_name: string; avatar_url: string | null }).full_name,
    avatarUrl: (p.users as { full_name: string; avatar_url: string | null }).avatar_url,
    locationCity: p.location_city,
    locationState: p.location_state,
    ratingAvg: String(p.rating_avg),
    totalReviews: p.total_reviews,
    bio: p.bio,
    verifiedByNgo: p.verified_by_ngo,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    skills: (p.provider_skills as any[]).map((s) => ({ skillCategory: s.skill_category })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pricing: (p.provider_pricing as any[])
      .filter((pr) => pr.is_active)
      .map((pr) => ({ price: String(pr.price), pricingType: pr.pricing_type, serviceType: pr.service_type })),
  }))

  return NextResponse.json(formatted)
}
