import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Users, CheckCircle, Clock, Star, Heart } from 'lucide-react'
import Link from 'next/link'
import { translations, type Lang } from '@/lib/i18n'

export default async function NgoDashboard() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'en') as Lang
  const t = translations[lang]
  const ng = t.ngo

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: u } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
  if (!u || u.role !== 'ngo_admin') redirect('/')

  const { data: ngo } = await supabaseAdmin
    .from('ngos')
    .select('id, name, status, referral_code, total_members, city, state')
    .eq('admin_user_id', user.id)
    .single()

  if (!ngo) redirect('/register/ngo')

  const [{ data: rawProviders }, { data: rawCustomers }] = await Promise.all([
    supabaseAdmin
      .from('single_mother_profiles')
      .select('id, verified_by_ngo, verified_by_admin, rating_avg, total_bookings, is_active, created_at, users!inner(full_name)')
      .eq('ngo_id', ngo.id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('customer_profiles')
      .select('id, is_for_self, mobility_status, created_at, users!inner(full_name)')
      .eq('ngo_id', ngo.id)
      .order('created_at', { ascending: false }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const providers = (rawProviders ?? []).map((m: any) => ({
    id: m.id as string,
    fullName: m.users.full_name as string,
    verifiedByNgo: m.verified_by_ngo as boolean,
    verifiedByAdmin: m.verified_by_admin as boolean,
    ratingAvg: parseFloat(String(m.rating_avg)),
    totalBookings: m.total_bookings as number,
    isActive: m.is_active as boolean,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customers = (rawCustomers ?? []).map((c: any) => ({
    id: c.id as string,
    fullName: c.users.full_name as string,
    isForSelf: c.is_for_self as boolean,
    mobilityStatus: c.mobility_status as string,
  }))

  const verifiedCount = providers.filter(m => m.verifiedByNgo).length
  const pendingCount = providers.filter(m => !m.verifiedByNgo).length
  const avgRating = providers.length > 0
    ? (providers.reduce((s, m) => s + m.ratingAvg, 0) / providers.length).toFixed(1)
    : ' '

  const mobilityLabel = (status: string) => {
    const map: Record<string, string> = {
      independent: ng.mobilityIndependent,
      walking_stick: ng.mobilityStick,
      wheelchair: ng.mobilityWheelchair,
      immobile: ng.mobilityImmobile,
    }
    return map[status] ?? status
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ngo.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${ngo.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {ngo.status === 'active' ? ng.active : ng.pending}
              </span>
              {ngo.city && <span className="text-sm text-gray-500">{ngo.city}, {ngo.state}</span>}
            </div>
          </div>
          {ngo.referral_code && (
            <div className="bg-[#F0FDFA] rounded-2xl px-4 py-3 text-center">
              <div className="text-xs text-gray-500 mb-1">{ng.referralCode}</div>
              <div className="font-mono font-bold text-[#0D9488] text-lg tracking-wider">{ngo.referral_code}</div>
              <div className="text-xs text-gray-400 mt-1">{ng.referralShare}</div>
            </div>
          )}
        </div>
      </div>

      {ngo.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-yellow-800">{ng.pendingAlert}</div>
            <div className="text-sm text-yellow-700 mt-0.5">{ng.pendingAlertDesc}</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label={ng.providerMembers} value={String(providers.length)} color="bg-[#F0FDFA] text-[#0D9488]" />
        <StatCard icon={Heart} label={ng.customerMembers.split(' (')[0]} value={String(customers.length)} color="bg-[#FFF1F2] text-[#F43F5E]" />
        <StatCard icon={CheckCircle} label={ng.verifiedProviders} value={String(verifiedCount)} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Star} label={ng.avgRating} value={avgRating} color="bg-yellow-50 text-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Providers */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">{ng.providerMembers}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{pendingCount} {ng.awaitingVerification}</p>
            </div>
            <Link href="/dashboard/ngo/members" className="text-xs text-[#0D9488] font-medium hover:underline">{ng.viewAll}</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {providers.slice(0, 5).map(m => (
              <div key={m.id} className="px-6 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0D9488] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {m.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{m.fullName}</div>
                  <div className="text-xs text-gray-500">{m.totalBookings} {ng.bookings} · {m.ratingAvg > 0 ? m.ratingAvg.toFixed(1) : ng.new}</div>
                </div>
                {m.verifiedByNgo
                  ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">Verified</span>
                  : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex-shrink-0">Pending</span>}
              </div>
            ))}
            {providers.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                {ng.emptyProvider} <span className="font-mono font-bold text-[#0D9488]">{ngo.referral_code}</span> {ng.emptyProviderSuffix}
              </div>
            )}
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">{ng.customerMembers}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{customers.length} {ng.seniorsRegistered}</p>
            </div>
            <Link href="/dashboard/ngo/members?tab=customers" className="text-xs text-[#F43F5E] font-medium hover:underline">{ng.viewAll}</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {customers.slice(0, 5).map(c => (
              <div key={c.id} className="px-6 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F43F5E] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {c.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{c.fullName}</div>
                  <div className="text-xs text-gray-500">{c.isForSelf ? ng.selfLabel : ng.guardianLabel} · {mobilityLabel(c.mobilityStatus)}</div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex-shrink-0">{ng.customerLabel}</span>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                {ng.emptyCustomer} <span className="font-mono font-bold text-[#0D9488]">{ngo.referral_code}</span> {ng.emptyCustomerSuffix}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
