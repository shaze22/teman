import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Heart, ArrowLeft } from 'lucide-react'
import CustomerEditForm from './_edit-form'
import { translations, type Lang } from '@/lib/i18n'

export default async function CustomerProfilePage() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'en') as Lang
  const t = translations[lang]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: raw } = await supabaseAdmin
    .from('customer_profiles')
    .select(`
      id, is_for_self, senior_full_name, senior_age, senior_phone,
      location_state, location_city, location_postcode, mobility_status, needs,
      users!inner(full_name, phone),
      emergency_contacts(id, name, relationship, phone)
    `)
    .eq('user_id', user.id)
    .single()

  if (!raw) redirect('/register/customer')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (raw as any).users as { full_name: string; phone: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ec = ((raw as any).emergency_contacts as { name: string; relationship: string; phone: string }[])?.[0]

  const initial = {
    fullName: u.full_name,
    phone: u.phone,
    isForSelf: raw.is_for_self ?? false,
    seniorFullName: (raw.senior_full_name as string | null) ?? '',
    seniorAge: raw.senior_age ? String(raw.senior_age) : '',
    seniorPhone: (raw.senior_phone as string | null) ?? '',
    locationState: raw.location_state,
    locationCity: raw.location_city,
    locationPostcode: (raw.location_postcode as string | null) ?? '',
    mobilityStatus: (raw.mobility_status as string) ?? 'independent',
    needs: (raw.needs as string[]) ?? [],
    emergencyName: ec?.name ?? '',
    emergencyRelation: ec?.relationship ?? '',
    emergencyPhone: ec?.phone ?? '',
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard/customer" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-[#F43F5E]" fill="currentColor" />
            <span className="font-bold text-[#F43F5E]">SenioCare</span>
          </Link>
          <span className="font-semibold text-gray-900 ml-2">{t.dashCommon.editProfile}</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <CustomerEditForm initial={initial} />
      </div>
    </div>
  )
}
