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
    .from('single_mother_profiles')
    .select(`
      id, bio, location_state, location_city, location_postcode,
      languages, has_transport, children_count, can_bring_children,
      users!inner(full_name, phone),
      provider_skills(skill_name),
      provider_pricing(price, service_type)
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
            <span className="font-bold text-[#6366F1]">Teman</span>
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
