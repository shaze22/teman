import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, CheckCircle, ArrowRight } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { translations, type Lang } from '@/lib/i18n'

export default async function FeaturedProviders({ lang }: { lang: Lang }) {
  const t = translations[lang]

  const { data: raw } = await supabaseAdmin
    .from('single_mother_profiles')
    .select(`
      id, location_city, location_state, rating_avg, total_reviews,
      verified_by_ngo, ic_verified,
      users!inner(full_name, avatar_url),
      provider_skills(skill_category),
      provider_pricing(price, pricing_type, is_active)
    `)
    .eq('verified_by_admin', true)
    .order('rating_avg', { ascending: false })
    .limit(6)

  if (!raw || raw.length === 0) return null

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold tracking-widest text-[#6366F1] uppercase">{t.featured.eyebrow}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F0E17] mt-2 mb-3">{t.featured.heading}</h2>
          <p className="text-gray-500 max-w-lg mx-auto">{t.featured.trusted}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {raw.map((p) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const u = (p as any).users as { full_name: string; avatar_url: string | null }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const skills = ((p as any).provider_skills ?? []) as Array<{ skill_category: string }>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pricing = ((p as any).provider_pricing ?? []).filter((pr: any) => pr.is_active) as Array<{ price: string; pricing_type: string }>
            const lowestPrice = pricing.length
              ? Math.min(...pricing.map((pr) => parseFloat(pr.price)))
              : null
            const initials = u.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

            return (
              <Link
                key={p.id}
                href={`/carer/${p.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    {u.avatar_url ? (
                      <Image
                        src={u.avatar_url}
                        alt={u.full_name}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#6366F1] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="font-semibold text-gray-900 truncate">{u.full_name}</span>
                        {p.verified_by_ngo && (
                          <CheckCircle className="w-3.5 h-3.5 text-[#6366F1] flex-shrink-0" />
                        )}
                        {p.ic_verified && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
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
                        {parseFloat(String(p.rating_avg)) > 0 ? parseFloat(String(p.rating_avg)).toFixed(1) : t.profilePage.newLabel}
                      </span>
                    </div>
                    {p.total_reviews > 0 && (
                      <span className="text-xs text-gray-400">({p.total_reviews} {t.search.reviews})</span>
                    )}
                    {lowestPrice !== null && (
                      <span className="ml-auto font-bold text-[#6366F1] text-base">
                        {t.featured.from} RM{lowestPrice.toFixed(0)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs bg-[#EEF2FF] text-[#6366F1] px-2 py-1 rounded-full font-medium">
                      🍽️ Meal Companion
                    </span>
                    {p.ic_verified && (
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-medium">
                        ✓ IC Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <div className="w-full text-center py-2.5 bg-[#EEF2FF] text-[#6366F1] text-sm font-semibold rounded-xl group-hover:bg-[#6366F1] group-hover:text-white transition-colors">
                    {t.featured.viewProfile}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6366F1] hover:text-[#4F46E5] transition-colors"
          >
            {t.featured.viewAll} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
