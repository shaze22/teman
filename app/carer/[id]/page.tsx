import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Image from 'next/image'
import { Heart, Star, MapPin, Clock, CheckCircle, MessageCircle, ArrowLeft, ShieldCheck, Stethoscope, AlertTriangle } from 'lucide-react'
import BookingButton from './_booking-button'
import FavoriteButton from './_favorite-button'
import ShareButton from './_share-button'
import { SERVICE_SCOPE } from '@/lib/services'
import ServiceScopeModal from './_service-scope-modal'

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  locum_nurse:     { label: 'Jururawat Berlesen', color: 'bg-blue-100 text-blue-700' },
  locum_physio:    { label: 'Fisioterapi Berdaftar', color: 'bg-purple-100 text-purple-700' },
  locum_care_aide: { label: 'Pembantu Penjagaan', color: 'bg-orange-100 text-orange-700' },
  medical_escort:  { label: 'Pendamping Perubatan', color: 'bg-red-100 text-red-700' },
  companion:       { label: 'Companion', color: 'bg-teal-100 text-teal-700' },
}

const LOCUM_ROLES = ['locum_nurse', 'locum_physio', 'locum_care_aide']

const DAY_NAMES = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']

const PRICING_LABELS: Record<string, string> = {
  per_hour: 'jam',
  per_session: 'sesi',
  per_day: 'hari',
  per_task: 'tugas',
  per_meal: 'hidangan',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = await supabaseAdmin
    .from('provider_profiles')
    .select('full_name, location_city, users!user_id(role)')
    .eq('id', id)
    .maybeSingle()
  if (!data) return { title: 'Provider tidak dijumpai | SenioCare' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (data.users as any)?.role as string ?? 'companion'
  const badge = ROLE_BADGE[role]
  const name = data.full_name ?? 'Provider'
  return {
    title: `${name} | ${badge?.label ?? 'Provider'} in ${data.location_city} | SenioCare`,
    description: `Tempah ${name.split(' ')[0]}, ${badge?.label ?? 'provider'} disahkan di ${data.location_city}. Perkhidmatan penjagaan warga emas profesional.`,
  }
}

export default async function CarerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const { data: raw } = await supabaseAdmin
    .from('provider_profiles')
    .select(`
      id, user_id, full_name, bio, location_city, location_state, languages, has_transport,
      rating_avg, total_reviews, total_bookings,
      ic_verified, license_verified,
      is_available, is_active,
      users!user_id(full_name, avatar_url, role, created_at)
    `)
    .eq('id', id)
    .maybeSingle()

  if (!raw || !raw.is_active) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (raw as any).users as { full_name: string; avatar_url: string | null; role: string; created_at: string }
  const providerRole = u?.role ?? 'companion'
  const badge = ROLE_BADGE[providerRole]
  const isLocumPro = LOCUM_ROLES.includes(providerRole)
  const displayName = raw.full_name ?? u?.full_name ?? ''

  // Fetch ancillary data in parallel
  const [{ data: rawPricing }, { data: rawAvail }, { data: rawPortfolio }, { data: rawReviews }] = await Promise.all([
    supabaseAdmin.from('provider_pricing').select('id, service_type, pricing_type, price').eq('profile_id', id).eq('is_active', true),
    supabaseAdmin.from('provider_availabilities').select('id, day_of_week, start_time, end_time, is_available').eq('profile_id', id),
    supabaseAdmin.from('provider_portfolios').select('id, image_url, title').eq('profile_id', id),
    supabaseAdmin.from('reviews')
      .select('id, rating, comment, created_at, reviewer:users!reviews_reviewer_id_fkey(full_name, avatar_url)')
      .eq('reviewee_id', raw.user_id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const pricing = (rawPricing ?? []) as Array<{ id: string; service_type: string; pricing_type: string; price: number }>
  const availabilities = (rawAvail ?? []) as Array<{ id: string; day_of_week: number; start_time: string; end_time: string; is_available: boolean }>
  const portfolio = (rawPortfolio ?? []) as Array<{ id: string; image_url: string; title: string | null }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews = (rawReviews ?? []).map((r: any) => ({
    id: r.id as string,
    rating: r.rating as number,
    comment: r.comment as string | null,
    createdAt: r.created_at as string,
    reviewer: { fullName: r.reviewer?.full_name ?? '', avatarUrl: r.reviewer?.avatar_url ?? null },
  }))

  const SERVICE_LABELS: Record<string, string> = {
    nursing: 'Jururawat Berlesen',
    physiotherapy: 'Fisioterapi',
    home_care: 'Pembantu Penjagaan',
    medical_escort: 'Pendamping Perubatan',
    riadah: 'Riadah Bersama',
    ibadah: 'Ibadah Bersama',
    makan: 'Makan Bersama',
  }

  const scopeForModal = Object.fromEntries(
    Object.entries(SERVICE_SCOPE).map(([k, v]) => [k, { desc: v.desc, items: v.items }])
  )

  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const ratingVal = parseFloat(String(raw.rating_avg ?? 0))

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/search" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-teal-600" fill="currentColor" />
            <span className="font-bold text-teal-600">SenioCare</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Medical disclaimer for locum professionals */}
        {isLocumPro && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3 mb-6">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>SenioCare adalah platform penghubung sahaja dan tidak memberi nasihat perubatan. Semua provider adalah kontraktor bebas bertauliah. Dalam kecemasan, hubungi <strong>999</strong>.</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex gap-4">
                {u?.avatar_url ? (
                  <Image src={u.avatar_url} alt={displayName} width={80} height={80} className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-teal-600 text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                    {raw.license_verified && (
                      <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        <ShieldCheck className="w-3 h-3" /> Sijil Disahkan
                      </span>
                    )}
                    {raw.ic_verified && !raw.license_verified && (
                      <span className="flex items-center gap-1 text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-medium">
                        <CheckCircle className="w-3 h-3" /> IC Disahkan
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 mt-1 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{raw.location_city}, {raw.location_state}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                      <span className="font-semibold text-gray-900 text-sm">
                        {ratingVal > 0 ? ratingVal.toFixed(1) : 'Baru'}
                      </span>
                    </div>
                    {(raw.total_reviews ?? 0) > 0 && (
                      <span className="text-gray-400 text-sm">{raw.total_reviews} ulasan</span>
                    )}
                    {(raw.total_bookings ?? 0) > 0 && (
                      <span className="text-gray-400 text-sm">{raw.total_bookings} booking</span>
                    )}
                  </div>
                </div>
              </div>
              {raw.bio && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-gray-700 leading-relaxed text-sm">{raw.bio}</p>
                </div>
              )}
            </div>

            {/* Role & Verification */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-3">Perkhidmatan & Kelayakan</h2>
              <div className="flex flex-wrap gap-2">
                {badge && (
                  <span className={`flex items-center gap-1.5 text-sm ${badge.color} px-3 py-1.5 rounded-full font-medium`}>
                    <Stethoscope className="w-3.5 h-3.5" />
                    {badge.label}
                  </span>
                )}
                {raw.license_verified && (
                  <span className="text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Sijil Profesional Disahkan
                  </span>
                )}
                {raw.ic_verified && !raw.license_verified && (
                  <span className="text-sm bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> IC Disahkan
                  </span>
                )}
                {(raw.languages as string[] ?? []).map((lang: string) => (
                  <span key={lang} className="text-sm bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                    {lang === 'bm' ? 'BM' : lang === 'en' ? 'English' : lang === 'zh' ? 'Mandarin' : lang === 'ta' ? 'Tamil' : lang}
                  </span>
                ))}
                {raw.has_transport && raw.has_transport !== 'none' && (
                  <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                    🚗 {raw.has_transport === 'car' ? 'Ada Kereta' : 'Ada Motorsikal'}
                  </span>
                )}
              </div>
            </div>

            {/* Availability */}
            {availabilities.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <h2 className="font-semibold text-gray-900">Waktu Tersedia</h2>
                </div>
                {availabilities.filter((a) => a.is_available).length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {[0,1,2,3,4,5,6].map(day => {
                        const avail = availabilities.find(a => a.day_of_week === day && a.is_available)
                        return (
                          <span key={day} className={`text-xs px-3 py-1.5 rounded-full font-medium ${avail ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-300'}`}>
                            {DAY_NAMES[day]}
                          </span>
                        )
                      })}
                    </div>
                    <div className="space-y-1.5">
                      {availabilities.filter((a) => a.is_available).map((a) => (
                        <div key={a.id} className="flex items-center gap-3 text-sm">
                          <span className="font-medium text-gray-700 w-20">{DAY_NAMES[a.day_of_week]}</span>
                          <span className="text-gray-400">{a.start_time.slice(0,5)} – {a.end_time.slice(0,5)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Jadual fleksibel. Sahkan masa pilihan anda melalui chat selepas booking.</p>
                )}
              </div>
            )}

            {/* Portfolio */}
            {portfolio.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-3">Galeri</h2>
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
              <h2 className="font-semibold text-gray-900 mb-4">Ulasan ({raw.total_reviews ?? 0})</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">Belum ada ulasan. Jadilah yang pertama booking!</p>
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
                          {new Date(r.createdAt).toLocaleDateString('ms-MY')}
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Harga Perkhidmatan</p>
              {pricing.length > 0 ? (
                <ServiceScopeModal
                  pricing={pricing}
                  pricingLabels={PRICING_LABELS}
                  serviceLabels={SERVICE_LABELS}
                  serviceScope={scopeForModal}
                />
              ) : (
                <p className="text-sm text-gray-400 mb-4">Hubungi untuk harga.</p>
              )}
              <div className="text-xs text-gray-500 bg-teal-50 border border-teal-100 rounded-lg p-3 mb-4">
                Harga platform inklusif. Provider terima 80–85% daripada jumlah booking.
              </div>
              <BookingButton providerId={id} providerName={displayName} />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <FavoriteButton providerId={id} isLoggedIn={isLoggedIn} />
                <ShareButton providerName={displayName} providerId={id} />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                <span>Boleh hubungi provider melalui chat selepas booking.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
