import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Users, CheckCircle, Clock, Star, Copy } from 'lucide-react'
import Link from 'next/link'

export default async function NgoDashboard() {
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

  const { data: members } = await supabaseAdmin
    .from('single_mother_profiles')
    .select('id, verified_by_ngo, verified_by_admin, rating_avg, total_bookings, is_active, created_at, users!inner(full_name, email)')
    .eq('ngo_id', ngo.id)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberList = (members ?? []).map((m: any) => ({
    id: m.id as string,
    fullName: m.users.full_name as string,
    verifiedByNgo: m.verified_by_ngo as boolean,
    verifiedByAdmin: m.verified_by_admin as boolean,
    ratingAvg: parseFloat(String(m.rating_avg)),
    totalBookings: m.total_bookings as number,
    isActive: m.is_active as boolean,
  }))

  const verifiedCount = memberList.filter(m => m.verifiedByNgo).length
  const pendingCount = memberList.filter(m => !m.verifiedByNgo).length
  const avgRating = memberList.length > 0
    ? (memberList.reduce((s, m) => s + m.ratingAvg, 0) / memberList.length).toFixed(1)
    : '—'

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ngo.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${ngo.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {ngo.status === 'active' ? 'Aktif' : 'Menunggu Kelulusan'}
              </span>
              {ngo.city && <span className="text-sm text-gray-500">{ngo.city}, {ngo.state}</span>}
            </div>
          </div>
          {ngo.referral_code && (
            <div className="bg-[#EEF2FF] rounded-2xl px-4 py-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Kod Rujukan NGO</div>
              <div className="font-mono font-bold text-[#6366F1] text-lg tracking-wider">{ngo.referral_code}</div>
              <div className="text-xs text-gray-400 mt-1">Kongsi kepada provider</div>
            </div>
          )}
        </div>
      </div>

      {ngo.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-yellow-800">NGO anda sedang dalam semakan</div>
            <div className="text-sm text-yellow-700 mt-0.5">Admin Teman akan mengesahkan NGO anda. Sementara itu, anda boleh urus ahli sedia ada.</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Jumlah Ahli" value={String(memberList.length)} color="bg-[#EEF2FF] text-[#6366F1]" />
        <StatCard icon={CheckCircle} label="Sudah Disahkan" value={String(verifiedCount)} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Clock} label="Menunggu Verify" value={String(pendingCount)} color="bg-yellow-50 text-yellow-600" />
        <StatCard icon={Star} label="Rating Purata" value={avgRating} color="bg-yellow-50 text-yellow-500" />
      </div>

      {/* Recent members */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Ahli Terkini</h2>
          <Link href="/dashboard/ngo/members" className="text-xs text-[#6366F1] font-medium hover:underline">Lihat semua</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {memberList.slice(0, 6).map(m => (
            <div key={m.id} className="px-6 py-3 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-[#6366F1] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {m.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{m.fullName}</div>
                <div className="text-xs text-gray-500">{m.totalBookings} booking · Rating {m.ratingAvg > 0 ? m.ratingAvg.toFixed(1) : 'Baru'}</div>
              </div>
              <div className="flex items-center gap-2">
                {m.verifiedByNgo
                  ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Verified NGO</span>
                  : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Belum Verify</span>}
                {m.verifiedByAdmin && <span className="text-xs bg-[#E0E7FF] text-[#6366F1] px-2 py-0.5 rounded-full">Admin ✓</span>}
              </div>
            </div>
          ))}
          {memberList.length === 0 && (
            <div className="px-6 py-8 text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-sm font-medium text-gray-900 mb-1">Belum ada ahli</div>
              <div className="text-xs text-gray-500">Kongsikan kod rujukan <span className="font-mono font-bold text-[#6366F1]">{ngo.referral_code}</span> kepada ibu tunggal untuk mendaftar sebagai provider di bawah NGO anda.</div>
            </div>
          )}
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
