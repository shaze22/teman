import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const type = searchParams.get('type')
  const state = searchParams.get('state')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const language = searchParams.get('language')
  const transport = searchParams.get('transport')
  const skill = searchParams.get('skill')
  const bangsa = searchParams.get('bangsa')
  const ageRange = searchParams.get('ageRange')
  const verified = searchParams.get('verified') === '1'
  const locumOnly = searchParams.get('locum') === '1'
  const duoOnly = searchParams.get('duo') === '1'
  const sort = searchParams.get('sort') ?? 'rating'

  const orderCol = sort === 'most_booked' ? 'total_bookings' : sort === 'newest' ? 'created_at' : 'rating_avg'

  let query = supabaseAdmin
    .from('single_mother_profiles')
    .select(`
      id, location_city, location_state, rating_avg, total_reviews, bio,
      verified_by_ngo, ic_verified, languages, has_transport, bangsa, age_range,
      is_locum, locum_verified, locum_cert_type,
      users!inner(id, full_name, avatar_url),
      provider_skills(skill_category),
      provider_pricing(price, pricing_type, service_type, is_active)
    `)
    .eq('verified_by_admin', true)
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

  if (q) {
    const qLow = q.toLowerCase()
    providers = providers.filter((p) =>
      p.users.full_name.toLowerCase().includes(qLow) ||
      p.location_city?.toLowerCase().includes(qLow) ||
      p.location_state?.toLowerCase().includes(qLow)
    )
  }

  if (type && type !== 'all') {
    providers = providers.filter((p) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p.provider_pricing as any[]).some((pr) => pr.service_type === type && pr.is_active)
    )
  }

  if (minPrice) {
    const min = parseFloat(minPrice)
    providers = providers.filter((p) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p.provider_pricing as any[]).some((pr) => pr.is_active && parseFloat(pr.price) >= min)
    )
  }

  if (maxPrice) {
    const max = parseFloat(maxPrice)
    providers = providers.filter((p) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p.provider_pricing as any[]).some((pr) => pr.is_active && parseFloat(pr.price) <= max)
    )
  }

  if (language) {
    providers = providers.filter((p) =>
      Array.isArray(p.languages) && p.languages.includes(language)
    )
  }

  if (transport && transport !== 'all') {
    providers = providers.filter((p) => p.has_transport === transport)
  }

  if (skill) {
    providers = providers.filter((p) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p.provider_skills as any[]).some((s) => s.skill_category === skill)
    )
  }

  if (bangsa) {
    providers = providers.filter((p) => p.bangsa === bangsa)
  }

  if (ageRange) {
    providers = providers.filter((p) => p.age_range === ageRange)
  }

  if (verified) {
    providers = providers.filter((p) => p.verified_by_ngo || p.ic_verified)
  }

  if (locumOnly) {
    providers = providers.filter((p) => p.is_locum && p.locum_verified)
  }

  // Duo filter applied after duo pair lookup below

  if (sort === 'price_asc') {
    providers.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const minA = Math.min(...(a.provider_pricing as any[]).filter((p: any) => p.is_active).map((p: any) => parseFloat(p.price)))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const minB = Math.min(...(b.provider_pricing as any[]).filter((p: any) => p.is_active).map((p: any) => parseFloat(p.price)))
      return minA - minB
    })
  }

  // Fetch duo pairs for all provider user IDs in one batch
  const allUserIds = providers.map((p) => p.users.id as string)
  const { data: allDuoPairs } = allUserIds.length
    ? await supabaseAdmin
        .from('companion_pairs')
        .select('requester_id, partner_id')
        .or(allUserIds.map((id) => `requester_id.eq.${id},partner_id.eq.${id}`).join(','))
        .eq('status', 'active')
    : { data: [] }

  const hasDuoSet = new Set<string>()
  for (const pair of allDuoPairs ?? []) {
    hasDuoSet.add(pair.requester_id)
    hasDuoSet.add(pair.partner_id)
  }

  if (duoOnly) {
    providers = providers.filter((p) => hasDuoSet.has(p.users.id as string))
  }

  const sliced = providers.slice(0, 50)

  // Build duo partner ID map from the already-fetched pairs
  const duoPartnerIdMap: Record<string, string> = {}
  for (const pair of allDuoPairs ?? []) {
    duoPartnerIdMap[pair.requester_id] = pair.partner_id
    duoPartnerIdMap[pair.partner_id] = pair.requester_id
  }

  const partnerUserIds = [...new Set(Object.values(duoPartnerIdMap))]
  const { data: partnerUsers } = partnerUserIds.length
    ? await supabaseAdmin.from('users').select('id, full_name, avatar_url').in('id', partnerUserIds)
    : { data: [] }
  const partnerUserMap = Object.fromEntries((partnerUsers ?? []).map((u) => [u.id, u]))

  const formatted = sliced.map((p) => {
    const userId = p.users.id as string
    const duoPartnerId = duoPartnerIdMap[userId] ?? null
    const duoPartnerUser = duoPartnerId ? partnerUserMap[duoPartnerId] : null
    return {
      id: p.id,
      userId,
      fullName: p.users.full_name as string,
      avatarUrl: p.users.avatar_url as string | null,
      locationCity: p.location_city as string,
      locationState: p.location_state as string,
      ratingAvg: String(p.rating_avg),
      totalReviews: p.total_reviews as number,
      bio: p.bio as string | null,
      verifiedByNgo: p.verified_by_ngo as boolean,
      icVerified: p.ic_verified as boolean,
      isLocum: p.is_locum as boolean ?? false,
      locumVerified: p.locum_verified as boolean ?? false,
      locumCertType: p.locum_cert_type as string | null,
      bangsa: p.bangsa as string | null,
      ageRange: p.age_range as string | null,
      hasDuo: !!duoPartnerId,
      duoPartner: duoPartnerUser ? {
        id: duoPartnerId,
        fullName: duoPartnerUser.full_name,
        avatarUrl: duoPartnerUser.avatar_url,
      } : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      skills: (p.provider_skills as any[]).map((s) => ({ skillCategory: s.skill_category })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pricing: (p.provider_pricing as any[])
        .filter((pr) => pr.is_active)
        .map((pr) => ({ price: String(pr.price), pricingType: pr.pricing_type, serviceType: pr.service_type })),
    }
  })

  return NextResponse.json(formatted)
}
