import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Users, ShoppingBag, DollarSign, AlertTriangle, CheckCircle, Clock, TrendingUp, Activity } from 'lucide-react'

export default async function AdminDashboard() {
  await requireAdmin()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalProviders },
    { count: totalCustomers },
    { count: totalBookings },
    { count: pendingVerifications },
    { count: activeBookings },
    { count: activeSOS },
    { data: revenueData },
    { data: recentBookings },
  ] = await Promise.all([
    supabaseAdmin.from('single_mother_profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('customer_profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('single_mother_profiles').select('*', { count: 'exact', head: true }).eq('verified_by_admin', false).eq('verified_by_ngo', false),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'in_progress']),
    supabaseAdmin.from('sos_events').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('bookings').select('platform_fee').eq('status', 'completed').gte('created_at', startOfMonth),
    supabaseAdmin.from('bookings')
      .select('id, booking_code, status, scheduled_date, total_amount, customer:users!bookings_customer_id_fkey(full_name), provider:users!bookings_provider_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const monthlyRevenue = (revenueData ?? []).reduce((s, b) => s + parseFloat(String(b.platform_fee)), 0)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Gambaran keseluruhan platform Teman</p>
      </div>

      {/* Alert: Active SOS */}
      {(activeSOS ?? 0) > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-red-700">{activeSOS} SOS Aktif memerlukan perhatian</div>
            <div className="text-sm text-red-600">Ada pengguna yang memerlukan bantuan segera</div>
          </div>
          <a href="/admin/sos" className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors flex-shrink-0">
            Lihat SOS
          </a>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Jumlah Provider" value={String(totalProviders ?? 0)} color="bg-[#EEF2FF] text-[#6366F1]" href="/admin/providers" />
        <StatCard icon={Users} label="Jumlah Pelanggan" value={String(totalCustomers ?? 0)} color="bg-[#FFF1F2] text-[#F43F5E]" href="/admin/customers" />
        <StatCard icon={ShoppingBag} label="Jumlah Booking" value={String(totalBookings ?? 0)} color="bg-blue-50 text-blue-600" href="/admin/bookings" />
        <StatCard icon={DollarSign} label="Hasil Bulan Ini" value={`RM${monthlyRevenue.toFixed(0)}`} color="bg-emerald-50 text-emerald-600" href="/admin/bookings" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MiniStat icon={Clock} label="Booking Aktif" value={String(activeBookings ?? 0)} color="text-yellow-600" href="/admin/bookings" />
        <MiniStat icon={AlertTriangle} label="SOS Aktif" value={String(activeSOS ?? 0)} color="text-red-600" urgent={!!activeSOS} href="/admin/sos" />
        <MiniStat icon={CheckCircle} label="Perlu Verify" value={String(pendingVerifications ?? 0)} color="text-orange-600" href="/admin/providers" />
        <MiniStat icon={TrendingUp} label="Kadar Platform" value="15%" color="text-[#6366F1]" />
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#6366F1]" />
            Booking Terkini
          </h2>
          <a href="/admin/bookings" className="text-xs text-[#6366F1] font-medium hover:underline">Lihat semua</a>
        </div>
        <div className="divide-y divide-gray-50">
          {(recentBookings ?? []).map((b: any) => (
            <div key={b.id} className="px-6 py-3 flex items-center gap-4">
              <div className="text-xs font-mono text-gray-400 w-24 flex-shrink-0">{b.booking_code}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{b.customer?.full_name} → {b.provider?.full_name}</div>
                <div className="text-xs text-gray-500">{new Date(b.scheduled_date).toLocaleDateString('ms-MY')}</div>
              </div>
              <StatusBadge status={b.status} />
              <div className="text-sm font-bold text-gray-900 w-20 text-right">RM{parseFloat(String(b.total_amount)).toFixed(0)}</div>
            </div>
          ))}
          {(recentBookings ?? []).length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-gray-400">Tiada booking lagi</div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, href }: { icon: typeof Users; label: string; value: string; color: string; href?: string }) {
  const inner = (
    <>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {href && <div className="text-xs text-[#6366F1] mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Lihat semua →</div>}
    </>
  )
  if (href) return (
    <a href={href} className="group bg-white rounded-2xl border border-gray-100 p-5 block hover:border-[#6366F1]/30 hover:shadow-md transition-all">
      {inner}
    </a>
  )
  return <div className="bg-white rounded-2xl border border-gray-100 p-5">{inner}</div>
}

function MiniStat({ icon: Icon, label, value, color, urgent, href }: { icon: typeof Users; label: string; value: string; color: string; urgent?: boolean; href?: string }) {
  const inner = (
    <>
      <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
      <div>
        <div className={`text-lg font-bold ${color}`}>{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </>
  )
  const base = `bg-white rounded-2xl border p-4 flex items-center gap-3 ${urgent ? 'border-red-200 bg-red-50' : 'border-gray-100'}`
  if (href) return (
    <a href={href} className={`${base} hover:border-[#6366F1]/30 hover:shadow-md transition-all`}>
      {inner}
    </a>
  )
  return <div className={base}>{inner}</div>
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-[#FFE4E6] text-[#BE123C]',
  completed: 'bg-[#E0E7FF] text-[#3730A3]',
  cancelled: 'bg-red-100 text-red-700',
  disputed: 'bg-orange-100 text-orange-700',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu', confirmed: 'Disahkan', in_progress: 'Berjalan',
  completed: 'Selesai', cancelled: 'Dibatalkan', disputed: 'Dispute',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
