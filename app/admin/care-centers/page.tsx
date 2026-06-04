import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Building2, CheckCircle2, Clock } from 'lucide-react'
import AdminVerifyCareCenterButton from './_verify-button'

export default async function AdminCareCentersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbUser } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
  if (dbUser?.role !== 'super_admin') redirect('/dashboard')

  const { data: centers } = await supabaseAdmin
    .from('care_center_profiles')
    .select(`
      id, center_name, center_type, city, state, pic_name, resident_capacity, is_verified, created_at,
      users!inner(id, email, status, full_name)
    `)
    .order('created_at', { ascending: false })

  const pending = centers?.filter(c => !(c as any).is_verified) ?? []
  const verified = centers?.filter(c => (c as any).is_verified) ?? []

  const typeLabel: Record<string, string> = {
    nursing_home: 'Nursing Home',
    day_care: 'Day Care',
    welfare_center: 'Pusat Kebajikan',
    rehabilitation: 'Pemulihan',
    hospital: 'Hospital/Klinik',
  }

  const CenterCard = ({ c }: { c: any }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900">{c.center_name}</div>
            <div className="text-xs text-gray-500">{typeLabel[c.center_type] ?? c.center_type} · {c.city}, {c.state}</div>
            <div className="text-xs text-gray-400">PIC: {c.pic_name} · {c.users?.email}</div>
            {c.resident_capacity && <div className="text-xs text-gray-400">Kapasiti: {c.resident_capacity} penghuni</div>}
          </div>
        </div>
        {!c.is_verified && (
          <AdminVerifyCareCenterButton centerId={c.id} userId={c.users?.id} />
        )}
        {c.is_verified && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disahkan
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Pusat Penjagaan</h1>
      <p className="text-sm text-gray-500 mb-8">Urus & sahkan pendaftaran pusat penjagaan warga emas</p>

      {pending.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-700">Menunggu Pengesahan ({pending.length})</h2>
          </div>
          <div className="space-y-3">
            {pending.map(c => <CenterCard key={c.id} c={c} />)}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-semibold text-gray-700">Aktif ({verified.length})</h2>
        </div>
        {verified.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            Tiada pusat penjagaan aktif lagi.
          </div>
        ) : (
          <div className="space-y-3">
            {verified.map(c => <CenterCard key={c.id} c={c} />)}
          </div>
        )}
      </section>
    </div>
  )
}
