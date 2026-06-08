import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Image from 'next/image'
import { Heart, Star, MapPin, Clock, CheckCircle, MessageCircle, ArrowLeft, Building2, Users } from 'lucide-react'
import BookingButton from './_booking-button'
import FavoriteButton from './_favorite-button'
import ShareButton from './_share-button'
import { SERVICE_SCOPE } from '@/lib/services'
import ServiceScopeModal from './_service-scope-modal'
import { translations, type Lang } from '@/lib/i18n'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = await supabaseAdmin
    .from('single_mother_profiles')
    .select('location_city, users!inner(full_name)')
    .eq('id', id)
    .single()
  if (!data) return { title: 'Penjaga tidak dijumpai' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { title: `${(data.users as any).full_name} — SenioCare di ${data.location_city}` }
}

export default async function TemanProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'en') as Lang
  const t = translations[lang]

  const bd = t.bookingDetail
  const SERVICE_LABELS: Record<string, string> = {
    job: bd.serviceJob, food: bd.serviceFood, learning: bd.serviceLearning,
    business: bd.serviceBusiness, ibadah: bd.serviceIbadah, repair: bd.serviceRepair,
    riadah: bd.serviceRiadah, kombo: bd.serviceKombo,
    medical_care: lang === 'en' ? 'Medical Care' : 'Penjagaan Perubatan',
  }

  const PRICING_LABELS: Record<string, string> = lang === 'en'
    ? { per_hour: 'hr', per_session: 'session', per_day: 'day', per_task: 'task', per_meal: 'meal' }
    : { per_hour: 'jam', per_session: 'sesi', per_day: 'hari', per_task: 'tugas', per_meal: 'hidangan' }

  const dayNames = lang === 'en'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']

  const { data: raw } = await supabaseAdmin
    .from('single_mother_profiles')
    .select(`
      id, user_id, bio, location_city, location_state, rating_avg, total_reviews, total_bookings,
      verified_by_ngo, verified_by_admin, ic_verified, ngo_id,
      is_locum, locum_verified, locum_cert_type,
      users!inner(full_name, avatar_url, created_at),
      provider_skills(*),
      provider_pricing(*),
      provider_availabilities(*),
      provider_portfolios(*)
    `)
    .eq('id', id)
    .single()

  if (!raw) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ngoId = (raw as any).ngo_id as string | null
  let ngoName: string | null = null
  if (ngoId) {
    const { data: ngoData } = await supabaseAdmin
      .from('ngos')
      .select('name')
      .eq('id', ngoId)
      .eq('status', 'active')
      .single()
    ngoName = ngoData?.name ?? null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (raw as any).users as { full_name: string; avatar_url: string | null; created_at: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skills = ((raw as any).provider_skills ?? []) as Array<{ id: string; skill_category: string }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pricing = ((raw as any).provider_pricing ?? []).filter((p: any) => p.is_active && p.service_type === 'food') as Array<{ id: string; service_type: string; pricing_type: string; price: number }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const availabilities = ((raw as any).provider_availabilities ?? []) as Array<{ id: string; day_of_week: number; start_time: string; end_time: string; is_available: boolean }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portfolio = ((raw as any).provider_portfolios ?? []) as Array<{ id: string; image_url: string; title: string | null }>

  // Duo pair info
  const { data: duoPair } = await supabaseAdmin
    .from('companion_pairs')
    .select('requester_id, partner_id')
    .or(`requester_id.eq.${raw.user_id},partner_id.eq.${raw.user_id}`)
    .eq('status', 'active')
    .maybeSingle()

  let duoPartner: { fullName: string; avatarUrl: string | null; locationCity: string; price: number | null } | null = null
  if (duoPair) {
    const partnerId = duoPair.requester_id === raw.user_id ? duoPair.partner_id : duoPair.requester_id
    const [pu, pp] = await Promise.all([
      supabaseAdmin.from('users').select('full_name, avatar_url').eq('id', partnerId).single(),
      supabaseAdmin.from('single_mother_profiles').select('location_city, provider_pricing(price, is_active, service_type)').eq('user_id', partnerId).single(),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partnerFoodPrice = (pp.data?.provider_pricing as any[])?.find((pr) => pr.service_type === 'food' && pr.is_active)
    duoPartner = {
      fullName: pu.data?.full_name ?? '',
      avatarUrl: pu.data?.avatar_url ?? null,
      locationCity: pp.data?.location_city ?? '',
      price: partnerFoodPrice ? parseFloat(partnerFoodPrice.price) : null,
    }
  }

  const { data: rawReviews } = await supabaseAdmin
    .from('reviews')
    .select('id, rating, comment, created_at, reviewer:users!reviews_reviewer_id_fkey(full_name, avatar_url)')
    .eq('reviewee_id', raw.user_id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(10)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews = (rawReviews ?? []).map((r: any) => ({
    id: r.id,
    rating: r.rating as number,
    comment: r.comment as string | null,
    createdAt: r.created_at as string,
    reviewer: { fullName: r.reviewer?.full_name ?? '', avatarUrl: r.reviewer?.avatar_url ?? null },
  }))

  const initials = u.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/search" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-[#6366F1]" fill="currentColor" />
            <span className="font-bold text-[#6366F1]">SenioCare</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex gap-4">
                {u.avatar_url ? (
                  <Image src={u.avatar_url} alt={u.full_name} width={80} height={80} className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#6366F1] text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
                    {initials}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900">{u.full_name}</h1>
                    {raw.verified_by_ngo && (
                      <span className="flex items-center gap-1 text-xs bg-[#E0E7FF] text-[#6366F1] px-2 py-1 rounded-full font-medium">
                        <CheckCircle className="w-3 h-3" /> Verified NGO
                      </span>
                    )}
                    {raw.verified_by_admin && !(raw as any).ic_verified && (
                      <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        <CheckCircle className="w-3 h-3" /> {lang === 'en' ? 'Verified' : 'Disahkan'}
                      </span>
                    )}
                    {(raw as any).ic_verified && (
                      <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                        <CheckCircle className="w-3 h-3" /> IC Verified
                      </span>
                    )}
                    {(raw as any).is_locum && (raw as any).locum_verified && (
                      <span className="flex items-center gap-1 text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-medium">
                        🩺 Locum Profesional
                      </span>
                    )}
                    {duoPartner && (
                      <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                        <Users className="w-3 h-3" /> {lang === 'en' ? 'Duo Available' : 'Duo Tersedia'}
                      </span>
                    )}
                    {ngoName && (
                      <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                        <Building2 className="w-3 h-3" /> {ngoName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{raw.location_city}, {raw.location_state}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                      <span className="font-semibold text-gray-900">
                        {parseFloat(String(raw.rating_avg)) > 0 ? parseFloat(String(raw.rating_avg)).toFixed(1) : t.profilePage.newLabel}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">{raw.total_reviews} {t.search.reviews}</span>
                    <span className="text-gray-400 text-sm">{raw.total_bookings} {t.profilePage.bookings}</span>
                  </div>
                </div>
              </div>
              {raw.bio && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-gray-700 leading-relaxed">{raw.bio}</p>
                </div>
              )}
            </div>

            {/* Duo Companion section */}
            {duoPartner && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-purple-600" />
                  <h2 className="font-semibold text-gray-900">
                    {lang === 'en' ? 'Duo Companion Available — Dine as a Trio!' : 'Duo Companion Tersedia — Makan Bertiga!'}
                  </h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {lang === 'en'
                    ? 'Book this companion with their duo partner for a more lively and social dining experience for your senior.'
                    : 'Tempah companion ini bersama pasangan duo mereka untuk pengalaman makan yang lebih meriah dan sosial untuk warga emas anda.'}
                </p>
                <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-purple-100">
                  {duoPartner.avatarUrl ? (
                    <Image src={duoPartner.avatarUrl} alt={duoPartner.fullName} width={40} height={40} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {duoPartner.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{duoPartner.fullName}</p>
                    <p className="text-xs text-gray-500">{duoPartner.locationCity}</p>
                  </div>
                  {duoPartner.price && (
                    <span className="text-sm font-bold text-purple-700">RM{duoPartner.price}/jam</span>
                  )}
                </div>
                <p className="text-xs text-purple-600 mt-3 font-medium">
                  {lang === 'en'
                    ? '✓ Pilih "Duo" semasa booking untuk book mereka berdua.'
                    : '✓ Select "Duo" during booking to book both of them.'}
                </p>
              </div>
            )}

            {/* Role Badges */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-3">{t.profilePage.skills}</h2>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#EEF2FF] text-[#6366F1] border border-[#C7D2FE] px-3 py-1.5 rounded-full text-sm font-medium">
                  🍽️ Meal Companion
                </span>
                {(raw as any).ic_verified && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-sm font-medium">
                    ✓ {lang === 'en' ? 'IC Verified' : 'IC Disahkan'}
                  </span>
                )}
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[#6366F1]" />
                <h2 className="font-semibold text-gray-900">{t.profilePage.availability}</h2>
              </div>
              {availabilities.filter((a) => a.is_available).length > 0 ? (
                <div className="space-y-3">
                  {/* Day chips */}
                  <div className="flex flex-wrap gap-2">
                    {[0,1,2,3,4,5,6].map(day => {
                      const avail = availabilities.find(a => a.day_of_week === day && a.is_available)
                      return (
                        <span key={day} className={`text-xs px-3 py-1.5 rounded-full font-medium ${avail ? 'bg-[#EEF2FF] text-[#6366F1]' : 'bg-gray-100 text-gray-300'}`}>
                          {dayNames[day]}
                        </span>
                      )
                    })}
                  </div>
                  {/* Time details */}
                  <div className="space-y-1.5">
                    {availabilities.filter((a) => a.is_available).map((a) => (
                      <div key={a.id} className="flex items-center gap-3 text-sm">
                        <span className="font-medium text-gray-700 w-20">{dayNames[a.day_of_week]}</span>
                        <span className="text-gray-400">{a.start_time.slice(0,5)} – {a.end_time.slice(0,5)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">{lang === 'en' ? 'Flexible schedule — confirm your preferred time via chat after booking.' : 'Jadual fleksibel — sahkan masa pilihan anda melalui chat selepas booking.'}</p>
              )}
            </div>

            {/* Portfolio */}
            {portfolio.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-3">{t.profilePage.portfolio}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {portfolio.map((item) => (
                    <div key={item.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <img src={item.image_url} alt={item.title ?? ''} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-4">{t.profilePage.reviews} ({raw.total_reviews})</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">{t.profilePage.noReviews}</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                        {r.reviewer.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{r.reviewer.fullName}</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: r.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-yellow-400" fill="currentColor" />
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-sm text-gray-600 mt-0.5">{r.comment}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(r.createdAt).toLocaleDateString(lang === 'en' ? 'en-MY' : 'ms-MY')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t.profilePage.pricing}</p>
              <ServiceScopeModal pricing={pricing} pricingLabels={PRICING_LABELS} serviceLabels={SERVICE_LABELS} serviceScope={SERVICE_SCOPE} />
              <div className="text-xs text-gray-500 bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-4">
                {t.profilePage.feeNote}
              </div>
              <BookingButton providerId={id} providerName={u.full_name} />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <FavoriteButton providerId={id} />
                <ShareButton providerName={u.full_name} providerId={id} />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                <MessageCircle className="w-4 h-4" />
                <span>{t.profilePage.contactNote}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
