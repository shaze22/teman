import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Heart, ArrowLeft } from 'lucide-react'
import AvailabilityForm from './_availability-form'

export default async function ProviderAvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabaseAdmin
    .from('single_mother_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/register/provider')

  const { data: rawSlots } = await supabaseAdmin
    .from('provider_availabilities')
    .select('id, day_of_week, start_time, end_time')
    .eq('profile_id', profile.id)
    .eq('is_recurring', true)
    .order('day_of_week')
    .order('start_time')

  const initial = (rawSlots ?? []).map(s => ({
    id: s.id,
    dayOfWeek: s.day_of_week as number,
    startTime: s.start_time as string,
    endTime: s.end_time as string,
  }))

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
          <span className="font-semibold text-gray-900 ml-2">Set Ketersediaan</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-500 mb-5">
          Tetapkan hari dan masa anda tersedia untuk menerima booking. Pelanggan hanya boleh tempah dalam tempoh ini.
        </p>
        <AvailabilityForm profileId={profile.id} initial={initial} />
      </div>
    </div>
  )
}
