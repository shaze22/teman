import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Heart, Star, MapPin, Clock, CheckCircle, Phone, ArrowLeft } from 'lucide-react'
import BookingButton from './_booking-button'

const SKILL_LABELS: Record<string, string> = {
  cooking: 'Memasak', sewing: 'Menjahit', massage: 'Urut', elderly_care: 'Jaga Orang Tua',
  cleaning: 'Bersih Rumah', teaching: 'Mengajar', companionship: 'Teman Berbual',
  shopping: 'Teman Membeli-belah', other: 'Lain-lain',
}

const PRICING_LABELS: Record<string, string> = {
  per_hour: 'per jam', per_session: 'per sesi', per_day: 'per hari',
  per_task: 'per tugas', per_meal: 'per hidangan',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = await supabaseAdmin
    .from('single_mother_profiles')
    .select('location_city, users!inner(full_name)')
    .eq('id', id)
    .single()
  if (!data) return { title: 'Teman tidak dijumpai' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { title: `${(data.users as any).full_name} — Teman di ${data.location_city}` }
}

export default async function TemanProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: raw } = await supabaseAdmin
    .from('single_mother_profiles')
    .select(`
      id, user_id, bio, location_city, location_state, rating_avg, total_reviews, total_bookings,
      verified_by_ngo, verified_by_admin,
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
  const u = (raw as any).users as { full_name: string; avatar_url: string | null; created_at: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skills = ((raw as any).provider_skills ?? []) as Array<{ id: string; skill_category: string }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pricing = ((raw as any).provider_pricing ?? []).filter((p: any) => p.is_active) as Array<{ id: string; service_type: string; pricing_type: string; price: number }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const availabilities = ((raw as any).provider_availabilities ?? []) as Array<{ id: string; day_of_week: number; start_time: string; end_time: string; is_available: boolean }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portfolio = ((raw as any).provider_portfolios ?? []) as Array<{ id: string; image_url: string; title: string | null }>

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
  const dayNames = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/search" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-[#6366F1]" fill="currentColor" />
            <span className="font-bold text-[#6366F1]">Teman</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex gap-4">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.full_name} className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
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
                    {raw.verified_by_admin && (
                      <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        <CheckCircle className="w-3 h-3" /> Verified Admin
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
                        {parseFloat(String(raw.rating_avg)) > 0 ? parseFloat(String(raw.rating_avg)).toFixed(1) : 'Baru'}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">{raw.total_reviews} ulasan</span>
                    <span className="text-gray-400 text-sm">{raw.total_bookings} booking</span>
                  </div>
                </div>
              </div>
              {raw.bio && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-gray-700 leading-relaxed">{raw.bio}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-3">Kemahiran</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s.id} className="bg-[#EEF2FF] text-[#6366F1] border border-[#C7D2FE] px-3 py-1.5 rounded-full text-sm font-medium">
                    {SKILL_LABELS[s.skill_category] ?? s.skill_category}
                  </span>
                ))}
              </div>
            </div>

            {availabilities.filter((a) => a.is_available).length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-3">Masa Tersedia</h2>
                <div className="space-y-2">
                  {availabilities.filter((a) => a.is_available).map((a) => (
                    <div key={a.id} className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-[#6366F1] flex-shrink-0" />
                      <span className="font-medium text-gray-900 w-20">{dayNames[a.day_of_week]}</span>
                      <span className="text-gray-500">{a.start_time} – {a.end_time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {portfolio.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-3">Portfolio</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {portfolio.map((item) => (
                    <div key={item.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <img src={item.image_url} alt={item.title ?? ''} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-4">Ulasan ({raw.total_reviews})</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">Belum ada ulasan. Jadilah yang pertama!</p>
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
                        <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('ms-MY')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="space-y-3 mb-4">
                {pricing.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 capitalize">{SKILL_LABELS[p.service_type] ?? p.service_type}</span>
                    <span className="font-bold text-[#6366F1]">
                      RM{parseFloat(String(p.price)).toFixed(0)}<span className="text-xs text-gray-400 font-normal">/{PRICING_LABELS[p.pricing_type]}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 mb-4">
                Platform fee 15-20% akan dikenakan semasa checkout. Bayaran selamat melalui escrow.
              </div>
              <BookingButton providerId={id} providerName={u.full_name} />
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                <Phone className="w-4 h-4" />
                <span>Hubungi melalui chat selepas booking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
