import { requireSuperAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Building2, Users, MapPin } from 'lucide-react'
import NgoActions from './_ngo-actions'

export default async function AdminNgosPage() {
  await requireSuperAdmin()

  const { data: rawNgos } = await supabaseAdmin
    .from('ngos')
    .select('id, name, reg_number, contact_person, email, phone, city, state, status, total_members, referral_code, created_at')
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ngos = (rawNgos ?? []).map((n: any) => ({
    id: n.id as string,
    name: n.name as string,
    regNumber: n.reg_number as string | null,
    contactPerson: n.contact_person as string | null,
    email: n.email as string | null,
    phone: n.phone as string | null,
    city: n.city as string | null,
    state: n.state as string | null,
    status: n.status as string,
    totalMembers: n.total_members as number,
    referralCode: n.referral_code as string | null,
    createdAt: new Date(n.created_at as string),
  }))

  const pending = ngos.filter(n => n.status === 'pending')
  const active = ngos.filter(n => n.status === 'active')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengurusan NGO</h1>
        <p className="text-sm text-gray-500 mt-1">{ngos.length} NGO berdaftar · {pending.length} menunggu kelulusan</p>
      </div>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-3">Permohonan Baru ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map(n => <NgoCard key={n.id} ngo={n} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Semua NGO ({ngos.length})</h2>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {ngos.map(n => (
            <div key={n.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-[#6366F1]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{n.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${n.status === 'active' ? 'bg-emerald-100 text-emerald-700' : n.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                    {n.status === 'active' ? 'Aktif' : n.status === 'pending' ? 'Menunggu' : 'Digantung'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                  {n.regNumber && <span>Reg: {n.regNumber}</span>}
                  {n.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{n.city}</span>}
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{n.totalMembers} ahli</span>
                  {n.referralCode && <span className="font-mono text-[#6366F1]">#{n.referralCode}</span>}
                </div>
              </div>
              <NgoActions ngoId={n.id} status={n.status} />
            </div>
          ))}
          {ngos.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">Tiada NGO berdaftar</div>
          )}
        </div>
      </section>
    </div>
  )
}

function NgoCard({ ngo: n }: { ngo: { id: string; name: string; regNumber: string | null; contactPerson: string | null; email: string | null; phone: string | null; city: string | null; state: string | null; status: string; totalMembers: number } }) {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-bold text-gray-900 mb-1">{n.name}</div>
          <div className="text-sm text-gray-600 space-y-0.5">
            {n.regNumber && <div>No. Pendaftaran: <span className="font-medium">{n.regNumber}</span></div>}
            {n.contactPerson && <div>Wakil: <span className="font-medium">{n.contactPerson}</span></div>}
            {n.email && <div>E-mel: <span className="font-medium">{n.email}</span></div>}
            {n.phone && <div>Tel: <span className="font-medium">{n.phone}</span></div>}
            {n.city && <div>Lokasi: <span className="font-medium">{n.city}, {n.state}</span></div>}
          </div>
        </div>
        <NgoActions ngoId={n.id} status={n.status} />
      </div>
    </div>
  )
}
