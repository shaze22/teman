import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, ShieldCheck, Stethoscope } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  locum_nurse:    { label: 'Jururawat Berlesen', color: 'bg-blue-50 text-blue-700' },
  locum_physio:   { label: 'Fisioterapi', color: 'bg-purple-50 text-purple-700' },
  locum_care_aide:{ label: 'Pembantu Penjagaan', color: 'bg-orange-50 text-orange-700' },
  medical_escort: { label: 'Pendamping Perubatan', color: 'bg-red-50 text-red-700' },
  companion:      { label: 'Companion', color: 'bg-teal-50 text-teal-700' },
}

export default async function FeaturedProviders({ lang: _ }: { lang: string }) {
  // Fetch top-rated providers from provider_profiles
  const { data: profiles } = await supabaseAdmin
    .from('provider_profiles')
    .select('id, full_name, location_city, location_state, rating_avg, total_reviews, ic_verified, license_verified, users!user_id(full_name, avatar_url, role)')
    .eq('is_active', true)
    .eq('is_available', true)
    .order('rating_avg', { ascending: false })
    .limit(6)

  if (!profiles || profiles.length === 0) return null

  // Fetch pricing for displayed profiles
  const profileIds = profiles.map((p) => p.id)
  const { data: allPricing } = await supabaseAdmin
    .from('provider_pricing')
    .select('profile_id, price')
    .in('profile_id', profileIds)
    .eq('is_active', true)

  const lowestPriceMap: Record<string, number> = {}
  for (const pr of allPricing ?? []) {
    const price = parseFloat(pr.price)
    if (!(pr.profile_id in lowestPriceMap) || price < lowestPriceMap[pr.profile_id]) {
      lowestPriceMap[pr.profile_id] = price
    }
  }

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold tracking-widest text-teal-600 uppercase">Provider Pilihan</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-3">Profesional Berdedikasi</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Dipilih berdasarkan penilaian pelanggan, kelayakan profesional, dan rekod perkhidmatan.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {profiles.map((p) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const u = (p as any).users as { full_name: string; avatar_url: string | null; role: string } | null
            const displayName = p.full_name ?? u?.full_name ?? ''
            const role = u?.role ?? ''
            const badge = ROLE_BADGE[role]
            const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            const lowestPrice = lowestPriceMap[p.id] ?? null

            return (
              <Link
                key={p.id}
                href={`/carer/${p.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    {u?.avatar_url ? (
                      <Image
                        src={u.avatar_url}
                        alt={displayName}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-teal-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="font-semibold text-gray-900 truncate">{displayName}</span>
                        {p.license_verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        )}
                        {p.ic_verified && !p.license_verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{p.location_city}, {p.location_state}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                      <span className="text-sm font-bold text-gray-900">
                        {parseFloat(String(p.rating_avg ?? 0)) > 0 ? parseFloat(String(p.rating_avg)).toFixed(1) : 'Baru'}
                      </span>
                    </div>
                    {(p.total_reviews ?? 0) > 0 && (
                      <span className="text-xs text-gray-400">({p.total_reviews} ulasan)</span>
                    )}
                    {lowestPrice !== null && (
                      <span className="ml-auto font-bold text-teal-600 text-base">
                        Dari RM{lowestPrice.toFixed(0)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {badge && (
                      <span className={`text-xs ${badge.color} px-2 py-1 rounded-full font-medium flex items-center gap-1`}>
                        <Stethoscope className="w-3 h-3" />
                        {badge.label}
                      </span>
                    )}
                    {p.license_verified && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                        ✓ Sijil Disahkan
                      </span>
                    )}
                    {p.ic_verified && !p.license_verified && (
                      <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full font-medium">
                        ✓ IC Disahkan
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <div className="w-full text-center py-2.5 bg-teal-50 text-teal-700 text-sm font-semibold rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    Lihat Profil
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            Lihat Semua Provider →
          </Link>
        </div>
      </div>
    </section>
  )
}
