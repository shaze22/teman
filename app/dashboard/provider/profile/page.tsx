import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Heart, ArrowLeft } from 'lucide-react'
import ProviderEditForm from './_edit-form'

export default async function ProviderProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: raw } = await supabaseAdmin
    .from('provider_profiles')
    .select(`
      id, bio, location_state, location_city, languages, has_transport,
      ic_verified, license_verified, license_rejection_reason,
      users!user_id(full_name, phone)
    `)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!raw) redirect('/register/locum')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (raw as any).users as { full_name: string; phone: string } | null

  const { data: rawPricing } = await supabaseAdmin
    .from('provider_pricing')
    .select('id, service_type, pricing_type, price')
    .eq('profile_id', raw.id)
    .eq('is_active', true)
    .order('service_type')

  const { data: rawGallery } = await supabaseAdmin
    .from('provider_portfolios')
    .select('id, image_url, title')
    .eq('profile_id', raw.id)

  const initial = {
    fullName: u?.full_name ?? '',
    phone: u?.phone ?? '',
    bio: raw.bio ?? '',
    locationState: raw.location_state ?? '',
    locationCity: raw.location_city ?? '',
    languages: (raw.languages as string[]) ?? ['bm'],
    hasTransport: (raw.has_transport as string) ?? 'none',
    icVerified: (raw.ic_verified as boolean) ?? false,
    licenseVerified: (raw.license_verified as boolean) ?? false,
    licenseRejectionReason: (raw.license_rejection_reason as string | null) ?? null,
    pricing: (rawPricing ?? []) as { id: string; service_type: string; pricing_type: string; price: number }[],
    gallery: (rawGallery ?? []) as { id: string; image_url: string; title: string | null }[],
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard/provider" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-teal-600" fill="currentColor" />
            <span className="font-bold text-teal-600">SenioCare</span>
          </Link>
          <span className="font-semibold text-gray-900 ml-2">Edit Profil</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProviderEditForm initial={initial} />
      </div>
    </div>
  )
}
