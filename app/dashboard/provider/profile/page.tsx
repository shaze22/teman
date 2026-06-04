import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Heart, ArrowLeft } from 'lucide-react'
import ProviderEditForm from './_edit-form'
import { translations, type Lang } from '@/lib/i18n'

export default async function ProviderProfilePage() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'bm') as Lang
  const t = translations[lang]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: raw } = await supabaseAdmin
    .from('single_mother_profiles')
    .select(`
      id, bio, location_state, location_city, location_postcode, lat, lng,
      languages, has_transport, children_count, can_bring_children,
      bangsa, age_range,
      ic_number, ic_submitted_at, ic_verified, ic_rejected_reason,
      users!inner(full_name, phone),
      provider_skills(skill_name),
      provider_pricing(price, service_type),
      provider_portfolios(id, image_url, title)
    `)
    .eq('user_id', user.id)
    .single()

  if (!raw) redirect('/register/provider')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (raw as any).users as { full_name: string; phone: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skills = ((raw as any).provider_skills as { skill_name: string }[]).map(s => s.skill_name)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobPricing = ((raw as any).provider_pricing as { price: number; service_type: string }[]).find(p => p.service_type === 'job')

  const initial = {
    fullName: u.full_name,
    phone: u.phone,
    bio: raw.bio ?? '',
    locationState: raw.location_state,
    locationCity: raw.location_city,
    locationPostcode: (raw.location_postcode as string | null) ?? '',
    languages: (raw.languages as string[]) ?? ['bm'],
    hasTransport: (raw.has_transport as string) ?? 'none',
    childrenCount: raw.children_count ?? 0,
    canBringChildren: raw.can_bring_children ?? false,
    skills,
    pricePerHour: jobPricing?.price ?? 20,
    lat: (raw.lat as number | null) ?? null,
    lng: (raw.lng as number | null) ?? null,
    bangsa: (raw.bangsa as string | null) ?? null,
    ageRange: (raw.age_range as string | null) ?? null,
    icNumber: (raw.ic_number as string | null) ?? null,
    icSubmittedAt: (raw.ic_submitted_at as string | null) ?? null,
    icVerified: (raw.ic_verified as boolean) ?? false,
    icRejectedReason: (raw.ic_rejected_reason as string | null) ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gallery: ((raw as any).provider_portfolios ?? []) as { id: string; image_url: string; title: string | null }[],
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard/provider" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-[#6366F1]" fill="currentColor" />
            <span className="font-bold text-[#6366F1]">SenioCare</span>
          </Link>
          <span className="font-semibold text-gray-900 ml-2">{t.dashCommon.editProfile}</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProviderEditForm initial={initial} />
      </div>
    </div>
  )
}
