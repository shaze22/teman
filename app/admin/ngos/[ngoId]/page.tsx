import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ArrowLeft, Building2, MapPin, Phone, Mail, Users, Star, CheckCircle, Clock } from 'lucide-react'
import NgoActions from '../_ngo-actions'

export default async function AdminNgoDetailPage({ params }: { params: Promise<{ ngoId: string }> }) {
  await requireSuperAdmin()
  const { ngoId } = await params

  const [{ data: ngo }, { data: rawMembers }, { data: rawCustomers }] = await Promise.all([
    supabaseAdmin
      .from('ngos')
      .select('id, name, reg_number, contact_person, email, phone, address, city, state, status, referral_code, total_members, created_at, admin_user_id')
      .eq('id', ngoId)
      .single(),
    supabaseAdmin
      .from('single_mother_profiles')
      .select('id, verified_by_ngo, verified_by_admin, rating_avg, total_bookings, is_active, created_at, users!inner(full_name, email)')
      .eq('ngo_id', ngoId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('customer_profiles')
      .select('id, is_for_self, mobility_status, location_city, created_at, users!inner(full_name, email)')
      .eq('ngo_id', ngoId)
      .order('created_at', { ascending: false }),
  ])

  if (!ngo) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customers = (rawCustomers ?? []).map((c: any) => ({
    id: c.id as string,
    fullName: c.users.full_name as string,
    email: c.users.email as string,
    isForSelf: c.is_for_self as boolean,
    mobilityStatus: c.mobility_status as string,
    locationCity: c.location_city as string,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members = (rawMembers ?? []).map((m: any) => ({
    id: m.id as string,
    fullName: m.users.full_name as string,
    email: m.users.email as string,
    verifiedByNgo: m.verified_by_ngo as boolean,
    verifiedByAdmin: m.verified_by_admin as boolean,
    ratingAvg: parseFloat(String(m.rating_avg)),
    totalBookings: m.total_bookings as number,
    isActive: m.is_active as boolean,
    createdAt: new Date(m.created_at as string),
  }))

  const verifiedCount = members.filter(m => m.verifiedByNgo).length
  const activeCount = members.filter(m => m.isActive).length

  const MOBILITY_LABELS: Record<string, string> = {
    independent: 'Berjalan sendiri', walking_stick: 'Tongkat',
    wheelchair: 'Kerusi roda', bedridden: 'Tidak bergerak',
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/ngos" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{ngo.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{ngo.reg_number}</p>
        </div>
        <NgoActions ngoId={ngo.id} status={ngo.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* NGO info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Maklumat NGO
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${ngo.status === 'active' ? 'bg-emerald-100 text-emerald-700' : ngo.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                {ngo.status === 'active' ? 'Aktif' : ngo.status === 'pending' ? 'Menunggu' : 'Digantung'}
              </span>
              {ngo.referral_code && (
                <span className="font-mono text-xs bg-[#EEF2FF] text-[#6366F1] px-2 py-1 rounded-full">#{ngo.referral_code}</span>
              )}
            </div>
            {ngo.contact_person && (
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4 flex-shrink-0" /> {ngo.contact_person}
              </div>
            )}
            {ngo.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 flex-shrink-0" /> {ngo.email}
              </div>
            )}
            {ngo.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 flex-shrink-0" /> {ngo.phone}
              </div>
            )}
            {ngo.city && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 flex-shrink-0" /> {ngo.address && `${ngo.address}, `}{ngo.city}, {ngo.state}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <Clock className="w-3 h-3" /> Daftar: {new Date(ngo.created_at).toLocaleDateString('ms-MY')}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Statistik Ahli</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Ahli provider</span>
              <span className="font-semibold">{members.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ahli pelanggan</span>
              <span className="font-semibold text-[#F43F5E]">{customers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Provider disahkan</span>
              <span className="font-semibold text-emerald-600">{verifiedCount}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <span className="text-gray-500">Provider aktif</span>
              <span className="font-semibold">{activeCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Providers list */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Ahli Provider ({members.length})
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {members.map(m => (
            <Link key={m.id} href={`/carer/${m.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-[#EEF2FF] transition-colors">
              <div className="w-9 h-9 rounded-full bg-[#6366F1] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {m.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{m.fullName}</span>
                  {m.verifiedByNgo && <span className="text-xs bg-[#E0E7FF] text-[#6366F1] px-1.5 py-0.5 rounded-full">NGO ✓</span>}
                  {m.verifiedByAdmin && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Admin ✓</span>}
                  {!m.isActive && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Suspended</span>}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{m.email}</div>
              </div>
              <div className="text-right text-xs text-gray-500 flex-shrink-0 space-y-0.5">
                <div className="flex items-center gap-1 justify-end">
                  <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                  {m.ratingAvg > 0 ? m.ratingAvg.toFixed(1) : 'Baru'}
                </div>
                <div>{m.totalBookings} booking</div>
              </div>
            </Link>
          ))}
          {members.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">Tiada ahli provider lagi</div>
          )}
        </div>
      </section>

      {/* Customers list */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Ahli Pelanggan ({customers.length})
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {customers.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-[#F43F5E] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {c.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{c.fullName}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.isForSelf ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                    {c.isForSelf ? 'Diri Sendiri' : 'Waris'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                  <span>{c.email}</span>
                  {c.locationCity && <span>{c.locationCity}</span>}
                  <span>{MOBILITY_LABELS[c.mobilityStatus] ?? c.mobilityStatus}</span>
                </div>
              </div>
            </div>
          ))}
          {customers.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">Tiada ahli pelanggan lagi</div>
          )}
        </div>
      </section>
    </div>
  )
}
