import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q          = searchParams.get('q')
  const type       = searchParams.get('type')       // service type filter
  const state      = searchParams.get('state')
  const minPrice   = searchParams.get('minPrice')
  const maxPrice   = searchParams.get('maxPrice')
  const language   = searchParams.get('language')
  const transport  = searchParams.get('transport')
  const tier       = searchParams.get('tier')       // 'locum' | 'companion'
  const sort       = searchParams.get('sort') ?? 'rating'

  const orderCol = sort === 'most_booked' ? 'total_bookings'
    : sort === 'newest' ? 'created_at'
    : 'rating_avg'

  // 1. Query provider_profiles joined with users (FK: provider_profiles.user_id → users.id)
  let query = supabaseAdmin
    .from('provider_profiles')
    .select(`
      id, user_id, full_name, location_city, location_state,
      rating_avg, total_reviews, total_bookings, bio,
      ic_verified, license_verified, is_available,
      languages, has_transport,
      users!user_id(id, full_name, avatar_url, role)
    `)
    .eq('is_active', true)
    .eq('is_available', true)
    .order(orderCol, { ascending: false })
    .limit(100)

  if (state) query = query.eq('location_state', state)

  const { data: raw, error } = await query

  if (error) {
    console.error('[providers GET]', error)
    return NextResponse.json([], { status: 200 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let providers: any[] = raw ?? []

  // 2. Query pricing for all returned profile IDs
  const profileIds = providers.map((p) => p.id)
  const { data: allPricing } = profileIds.length
    ? await supabaseAdmin
        .from('provider_pricing')
        .select('profile_id, service_type, price, pricing_type, is_active')
        .in('profile_id', profileIds)
        .eq('is_active', true)
    : { data: [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pricingByProfile: Record<string, any[]> = {}
  for (const pr of allPricing ?? []) {
    if (!pricingByProfile[pr.profile_id]) pricingByProfile[pr.profile_id] = []
    pricingByProfile[pr.profile_id].push(pr)
  }

  // 3. Attach pricing
  providers = providers.map((p) => ({ ...p, _pricing: pricingByProfile[p.id] ?? [] }))

  // 4. Apply filters
  if (q) {
    const qLow = q.toLowerCase()
    providers = providers.filter((p) =>
      (p.full_name ?? p.users?.full_name ?? '').toLowerCase().includes(qLow) ||
      p.location_city?.toLowerCase().includes(qLow) ||
      p.location_state?.toLowerCase().includes(qLow)
    )
  }

  if (type && type !== 'all') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providers = providers.filter((p) => (p._pricing as any[]).some((pr) => pr.service_type === type))
  }

  if (minPrice) {
    const min = parseFloat(minPrice)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providers = providers.filter((p) => (p._pricing as any[]).some((pr) => parseFloat(pr.price) >= min))
  }

  if (maxPrice) {
    const max = parseFloat(maxPrice)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providers = providers.filter((p) => (p._pricing as any[]).some((pr) => parseFloat(pr.price) <= max))
  }

  if (language) {
    providers = providers.filter((p) => Array.isArray(p.languages) && p.languages.includes(language))
  }

  if (transport && transport !== 'all') {
    providers = providers.filter((p) => p.has_transport === transport)
  }

  // Tier filter: locum = license_verified required; companion = ic_verified only
  if (tier === 'locum') {
    providers = providers.filter((p) => {
      const role = p.users?.role ?? ''
      return ['locum_nurse', 'locum_physio', 'locum_care_aide', 'medical_escort'].includes(role)
    })
  } else if (tier === 'companion') {
    providers = providers.filter((p) => p.users?.role === 'companion')
  }

  if (sort === 'price_asc') {
    providers.sort((a, b) => {
      const minA = Math.min(...a._pricing.map((pr: { price: string }) => parseFloat(pr.price)), Infinity)
      const minB = Math.min(...b._pricing.map((pr: { price: string }) => parseFloat(pr.price)), Infinity)
      return minA - minB
    })
  }

  const sliced = providers.slice(0, 50)

  const formatted = sliced.map((p) => {
    const user = p.users ?? {}
    const pricing = p._pricing ?? []
    const lowestPrice = pricing.length
      ? Math.min(...pricing.map((pr: { price: string }) => parseFloat(pr.price)))
      : null

    return {
      id: p.id,
      userId: user.id ?? p.user_id,
      fullName: p.full_name ?? user.full_name ?? '',
      avatarUrl: user.avatar_url ?? null,
      locationCity: p.location_city ?? '',
      locationState: p.location_state ?? '',
      ratingAvg: String(p.rating_avg ?? '0'),
      totalReviews: p.total_reviews ?? 0,
      bio: p.bio ?? null,
      icVerified: p.ic_verified ?? false,
      licenseVerified: p.license_verified ?? false,
      role: user.role ?? null,
      lowestPrice,
      pricing: pricing.map((pr: { price: string; pricing_type: string; service_type: string }) => ({
        price: String(pr.price),
        pricingType: pr.pricing_type,
        serviceType: pr.service_type,
      })),
    }
  })

  return NextResponse.json(formatted)
}
