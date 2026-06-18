import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  TrendingUp, Users, ShoppingBag, DollarSign, Star, CheckCircle,
  AlertTriangle, Heart, BarChart3, Calendar,
} from 'lucide-react'

export default async function AdminAnalyticsPage() {
  await requireAdmin()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()
  const startOf3Months = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString()

  const [
    { count: totalProviders },
    { count: totalCustomers },
    { count: totalBookings },
    { count: completedBookings },
    { count: cancelledBookings },
    { count: pendingBookings },
    { count: disputedBookings },
    { count: verifiedProviders },
    { count: icVerifiedProviders },
    { count: ngoVerifiedProviders },
    { count: newProvidersThisMonth },
    { count: newCustomersThisMonth },
    { count: bookingsThisMonth },
    { count: bookingsLastMonth },
    { data: revenueAllTime },
    { data: revenueThisMonth },
    { data: revenueLastMonth },
    { count: totalSOS },
    { count: activeSOS },
    { count: resolvedSOS },
    { data: topProviders },
    { data: skillDist },
    { data: stateDist },
  ] = await Promise.all([
    supabaseAdmin.from('provider_profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('customer_profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'disputed'),
    supabaseAdmin.from('provider_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('provider_profiles').select('*', { count: 'exact', head: true }).eq('ic_verified', true),
    supabaseAdmin.from('provider_profiles').select('*', { count: 'exact', head: true }).eq('license_verified', true),
    supabaseAdmin.from('provider_profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    supabaseAdmin.from('customer_profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth),
    supabaseAdmin.from('bookings').select('platform_fee').eq('status', 'completed'),
    supabaseAdmin.from('bookings').select('platform_fee').eq('status', 'completed').gte('created_at', startOfMonth),
    supabaseAdmin.from('bookings').select('platform_fee').eq('status', 'completed').gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth),
    supabaseAdmin.from('sos_events').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('sos_events').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('sos_events').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    supabaseAdmin
      .from('provider_profiles')
      .select('id, rating_avg, total_reviews, total_bookings, users!provider_profiles_user_id_fkey(full_name)')
      .eq('is_active', true)
      .order('total_bookings', { ascending: false })
      .limit(5),
    supabaseAdmin.from('provider_skills').select('skill_category'),
    supabaseAdmin.from('provider_profiles').select('location_state').eq('is_active', true),
  ])

  const totalRevenue = (revenueAllTime ?? []).reduce((s, b) => s + parseFloat(String(b.platform_fee ?? 0)), 0)
  const thisMonthRevenue = (revenueThisMonth ?? []).reduce((s, b) => s + parseFloat(String(b.platform_fee ?? 0)), 0)
  const lastMonthRevenue = (revenueLastMonth ?? []).reduce((s, b) => s + parseFloat(String(b.platform_fee ?? 0)), 0)
  const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : null
  const bookingGrowth = (bookingsLastMonth ?? 0) > 0 ? (((bookingsThisMonth ?? 0) - (bookingsLastMonth ?? 0)) / (bookingsLastMonth ?? 1)) * 100 : null

  const completionRate = (totalBookings ?? 0) > 0 ? (((completedBookings ?? 0) / (totalBookings ?? 1)) * 100).toFixed(1) : '0'

  // Skill distribution
  const skillCount: Record<string, number> = {}
  ;(skillDist ?? []).forEach((s: any) => {
    skillCount[s.skill_category] = (skillCount[s.skill_category] ?? 0) + 1
  })
  const topSkills = Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // State distribution
  const stateCount: Record<string, number> = {}
  ;(stateDist ?? []).forEach((s: any) => {
    if (s.location_state) stateCount[s.location_state] = (stateCount[s.location_state] ?? 0) + 1
  })
  const topStates = Object.entries(stateCount).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const SKILL_LABELS: Record<string, string> = {
    cooking: 'Memasak', sewing: 'Menjahit', massage: 'Urut', elderly_care: 'Jaga Orang Tua',
    cleaning: 'Bersih Rumah', teaching: 'Mengajar', companionship: 'Teman Berbual',
    shopping: 'Membeli-belah', other: 'Lain-lain',
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#6366F1]" />
            Analitik Platform
          </h1>
          <p className="text-sm text-gray-500 mt-1">Statistik dan laporan prestasi SenioCare</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Dikemas kini: {now.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Revenue overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-medium">Jumlah Hasil (Platform Fee)</span>
          </div>
          <div className="text-3xl font-bold">RM{totalRevenue.toFixed(0)}</div>
          <div className="text-xs opacity-70 mt-1">Sepanjang masa</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">Hasil Bulan Ini</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">RM{thisMonthRevenue.toFixed(0)}</div>
          {revenueGrowth !== null && (
            <div className={`text-xs mt-1 font-medium ${revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {revenueGrowth >= 0 ? '▲' : '▼'} {Math.abs(revenueGrowth).toFixed(1)}% vs bulan lepas
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Hasil Bulan Lepas</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">RM{lastMonthRevenue.toFixed(0)}</div>
          <div className="text-xs text-gray-400 mt-1">Bulan sebelumnya</div>
        </div>
      </div>

      {/* User stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Jumlah Provider" value={String(totalProviders ?? 0)} sub={`+${newProvidersThisMonth ?? 0} bulan ini`} color="bg-[#EEF2FF] text-[#6366F1]" />
        <StatCard icon={Users} label="Jumlah Pelanggan" value={String(totalCustomers ?? 0)} sub={`+${newCustomersThisMonth ?? 0} bulan ini`} color="bg-[#FFF1F2] text-[#F43F5E]" />
        <StatCard icon={CheckCircle} label="Provider Verified" value={String(verifiedProviders ?? 0)} sub={`IC: ${icVerifiedProviders ?? 0} · NGO: ${ngoVerifiedProviders ?? 0}`} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={ShoppingBag} label="Jumlah Booking" value={String(totalBookings ?? 0)} sub={`+${bookingsThisMonth ?? 0} bulan ini`} color="bg-blue-50 text-blue-600" />
      </div>

      {/* Booking breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MiniStat label="Selesai" value={String(completedBookings ?? 0)} sub={`${completionRate}% kadar`} color="text-emerald-600" bg="bg-emerald-50" />
        <MiniStat label="Dibatalkan" value={String(cancelledBookings ?? 0)} color="text-red-600" bg="bg-red-50" />
        <MiniStat label="Menunggu" value={String(pendingBookings ?? 0)} color="text-yellow-600" bg="bg-yellow-50" />
        <MiniStat label="Disputed" value={String(disputedBookings ?? 0)} color="text-orange-600" bg="bg-orange-50" urgent={(disputedBookings ?? 0) > 0} />
      </div>

      {/* Booking growth + SOS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3 text-gray-500">
            <TrendingUp className="w-4 h-4 text-[#6366F1]" />
            <span className="text-sm font-semibold text-gray-700">Pertumbuhan Booking</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{bookingsThisMonth ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Booking bulan ini</div>
          {bookingGrowth !== null && (
            <div className={`text-sm font-semibold mt-2 ${bookingGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {bookingGrowth >= 0 ? '▲' : '▼'} {Math.abs(bookingGrowth).toFixed(1)}% vs bulan lepas ({bookingsLastMonth ?? 0})
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-gray-700">Insiden SOS</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalSOS ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Jumlah keseluruhan</div>
          <div className="flex gap-4 mt-3">
            <div>
              <span className="text-lg font-bold text-red-600">{activeSOS ?? 0}</span>
              <span className="text-xs text-gray-400 ml-1">aktif</span>
            </div>
            <div>
              <span className="text-lg font-bold text-emerald-600">{resolvedSOS ?? 0}</span>
              <span className="text-xs text-gray-400 ml-1">selesai</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-700">Kadar Penyelesaian</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{completionRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Booking berjaya diselesaikan</div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#6366F1] rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top providers */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#6366F1]" />
            <h3 className="font-semibold text-gray-900">Top Provider (Paling Ramai Booking)</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {(topProviders ?? []).length === 0 ? (
              <div className="px-6 py-6 text-sm text-gray-400 text-center">Tiada data</div>
            ) : (
              (topProviders ?? []).map((p: any, i: number) => (
                <div key={p.id} className="px-6 py-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#6366F1] text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{p.users?.full_name}</div>
                    <div className="text-xs text-gray-400">
                      ⭐ {parseFloat(String(p.rating_avg)) > 0 ? parseFloat(String(p.rating_avg)).toFixed(1) : 'Baru'} · {p.total_reviews} ulasan
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#6366F1]">{p.total_bookings} booking</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Skill distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Taburan Kemahiran Provider</h3>
            {topSkills.length === 0 ? (
              <p className="text-sm text-gray-400">Tiada data</p>
            ) : (
              <div className="space-y-2.5">
                {topSkills.map(([skill, count]) => {
                  const total = (skillDist ?? []).length || 1
                  const pct = ((count / total) * 100).toFixed(0)
                  return (
                    <div key={skill}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">{SKILL_LABELS[skill] ?? skill}</span>
                        <span className="text-gray-400">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#6366F1] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* State distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Taburan Negeri (Provider)</h3>
            {topStates.length === 0 ? (
              <p className="text-sm text-gray-400">Tiada data</p>
            ) : (
              <div className="space-y-2.5">
                {topStates.map(([state, count]) => {
                  const total = (stateDist ?? []).length || 1
                  const pct = ((count / total) * 100).toFixed(0)
                  return (
                    <div key={state}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">{state}</span>
                        <span className="text-gray-400">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#F43F5E] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: typeof Users; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-[#6366F1] mt-1 font-medium">{sub}</div>}
    </div>
  )
}

function MiniStat({
  label, value, sub, color, bg, urgent,
}: {
  label: string; value: string; sub?: string; color: string; bg: string; urgent?: boolean
}) {
  return (
    <div className={`rounded-2xl border p-4 ${urgent ? 'border-orange-200 bg-orange-50' : `border-gray-100 ${bg}`}`}>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-600 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}
