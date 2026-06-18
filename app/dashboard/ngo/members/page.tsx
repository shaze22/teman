import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Star, ShoppingBag, MapPin, Users, Heart } from 'lucide-react'
import Link from 'next/link'
import MemberVerifyButton from './_member-verify-button'
import { translations, type Lang } from '@/lib/i18n'

export default async function NgoMembersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
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
    .select('id, name, referral_code')
    .eq('admin_user_id', user.id)
    .single()
  if (!ngo) redirect('/register/ngo')

  const { tab } = await searchParams
  const activeTab = tab === 'customers' ? 'customers' : 'providers'

  const [{ data: rawProviders }, { data: rawCustomers }] = await Promise.all([
    supabaseAdmin
      .from('provider_profiles')
      .select(`
        id, ic_verified, is_active,
        location_city, location_state, rating_avg, total_reviews, total_bookings,
        created_at,
        users!provider_profiles_user_id_fkey(id, full_name, email, status)
      `)
      .order('created_at', { ascending: false })
      .limit(100),
    supabaseAdmin
      .from('customer_profiles')
      .select(`
        id, is_for_self, mobility_status, location_city, location_state, created_at,
        users!inner(id, full_name, email, status)
      `)
      .eq('ngo_id', ngo.id)
      .order('created_at', { ascending: false }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const providers = (rawProviders ?? []).map((m: any) => ({
    id: m.id as string,
    userId: m.users.id as string,
    fullName: m.users.full_name as string,
    email: m.users.email as string,
    verifiedByNgo: m.ic_verified as boolean,
    verifiedByAdmin: m.is_active as boolean,
    bgCheck: m.is_active ? 'approved' : 'pending',
    locationCity: m.location_city as string,
    ratingAvg: parseFloat(String(m.rating_avg)),
    totalBookings: m.total_bookings as number,
    isActive: m.is_active as boolean,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customers = (rawCustomers ?? []).map((c: any) => ({
    id: c.id as string,
    userId: c.users.id as string,
    fullName: c.users.full_name as string,
    email: c.users.email as string,
    isForSelf: c.is_for_self as boolean,
    mobilityStatus: c.mobility_status as string,
    locationCity: c.location_city as string,
    locationState: c.location_state as string,
    status: c.users.status as string,
  }))

  const pendingProviders = providers.filter(m => !m.verifiedByNgo)
  const verifiedProviders = providers.filter(m => m.verifiedByNgo)

  const mobilityLabel = (status: string) => {
    const map: Record<string, string> = {
      independent: ng.mobilityIndependent,
      walking_stick: ng.mobilityStick,
      wheelchair: ng.mobilityWheelchair,
      bedridden: ng.mobilityImmobile,
    }
    return map[status] ?? status
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{ng.membersTitle}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {ngo.name}
          {ngo.referral_code && (
            <span> · {ng.codeLabel}: <span className="font-mono font-semibold text-[#0D9488]">{ngo.referral_code}</span></span>
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Link
          href="/dashboard/ngo/members"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'providers' ? 'bg-[#0D9488] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <Users className="w-4 h-4" /> {ng.providerMembers} ({providers.length})
        </Link>
        <Link
          href="/dashboard/ngo/members?tab=customers"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'customers' ? 'bg-[#F43F5E] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <Heart className="w-4 h-4" /> {ng.customersTab} ({customers.length})
        </Link>
      </div>

      {/* Providers tab */}
      {activeTab === 'providers' && (
        <>
          {pendingProviders.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-3">{ng.pendingNgoVerification} ({pendingProviders.length})</h2>
              <div className="space-y-3">
                {pendingProviders.map(m => <ProviderRow key={m.id} member={m} ngoId={ngo.id} newLabel={ng.new} bookingsLabel={ng.bookings} />)}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {verifiedProviders.length > 0 ? `${ng.verified} (${verifiedProviders.length})` : `${ng.allProviders} (${providers.length})`}
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {(verifiedProviders.length > 0 ? verifiedProviders : providers).map(m => (
                <ProviderRow key={m.id} member={m} ngoId={ngo.id} inline newLabel={ng.new} bookingsLabel={ng.bookings} />
              ))}
              {providers.length === 0 && (
                <div className="p-8 text-center">
                  <div className="text-3xl mb-2">👥</div>
                  <p className="text-sm text-gray-500">{ng.emptyProviderMembers}</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Customers tab */}
      {activeTab === 'customers' && (
        <section>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {customers.map(c => (
              <div key={c.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#F43F5E] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {c.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{c.fullName}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.isForSelf ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      {c.isForSelf ? ng.selfLabel : ng.guardianLabel}
                    </span>
                    {c.status === 'suspended' && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Suspended</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    <span>{c.email}</span>
                    {c.locationCity && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.locationCity}</span>}
                    <span>{mobilityLabel(c.mobilityStatus)}</span>
                  </div>
                </div>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-3xl mb-2">🧓</div>
                <p className="text-sm text-gray-500">{ng.emptyCustomerMembers} <span className="font-mono font-bold text-[#0D9488]">{ngo.referral_code}</span> {ng.emptyCustomerMembersSuffix}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function ProviderRow({ member: m, ngoId, inline, newLabel, bookingsLabel }: {
  member: { id: string; fullName: string; email: string; verifiedByNgo: boolean; verifiedByAdmin: boolean; locationCity: string; ratingAvg: number; totalBookings: number; isActive: boolean }
  ngoId: string
  inline?: boolean
  newLabel: string
  bookingsLabel: string
}) {
  return (
    <div className={`flex items-center gap-4 ${inline ? 'p-4' : 'p-4 rounded-2xl bg-orange-50 border border-orange-100'}`}>
      <div className="w-10 h-10 rounded-full bg-[#0D9488] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
        {m.fullName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">{m.fullName}</span>
          {m.verifiedByNgo && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">NGO ✓</span>}
          {m.verifiedByAdmin && <span className="text-xs bg-[#CCFBF1] text-[#0D9488] px-1.5 py-0.5 rounded-full">Admin ✓</span>}
          {!m.isActive && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Suspended</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
          <span>{m.email}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.locationCity}</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" fill="currentColor" />{m.ratingAvg > 0 ? m.ratingAvg.toFixed(1) : newLabel}</span>
          <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{m.totalBookings} {bookingsLabel}</span>
        </div>
      </div>
      <MemberVerifyButton profileId={m.id} ngoId={ngoId} verifiedByNgo={m.verifiedByNgo} />
    </div>
  )
}
