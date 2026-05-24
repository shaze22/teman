import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Star, ShoppingBag, MapPin } from 'lucide-react'
import MemberVerifyButton from './_member-verify-button'

export default async function NgoMembersPage() {
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

  const { data: rawMembers } = await supabaseAdmin
    .from('single_mother_profiles')
    .select(`
      id, verified_by_ngo, verified_by_admin, background_check_status,
      location_city, location_state, rating_avg, total_reviews, total_bookings,
      is_active, created_at,
      users!inner(id, full_name, email, status)
    `)
    .eq('ngo_id', ngo.id)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members = (rawMembers ?? []).map((m: any) => ({
    id: m.id as string,
    userId: m.users.id as string,
    fullName: m.users.full_name as string,
    email: m.users.email as string,
    verifiedByNgo: m.verified_by_ngo as boolean,
    verifiedByAdmin: m.verified_by_admin as boolean,
    bgCheck: m.background_check_status as string,
    locationCity: m.location_city as string,
    locationState: m.location_state as string,
    ratingAvg: parseFloat(String(m.rating_avg)),
    totalReviews: m.total_reviews as number,
    totalBookings: m.total_bookings as number,
    isActive: m.is_active as boolean,
    createdAt: new Date(m.created_at as string),
  }))

  const pending = members.filter(m => !m.verifiedByNgo)
  const verified = members.filter(m => m.verifiedByNgo)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ahli Provider</h1>
        <p className="text-sm text-gray-500 mt-1">
          {members.length} ahli terdaftar di bawah {ngo.name}
          {ngo.referral_code && (
            <span> · Kod: <span className="font-mono font-semibold text-[#6366F1]">{ngo.referral_code}</span></span>
          )}
        </p>
      </div>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-3">Menunggu Pengesahan NGO ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map(m => <MemberRow key={m.id} member={m} ngoId={ngo.id} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {verified.length > 0 ? `Disahkan (${verified.length})` : `Semua Ahli (${members.length})`}
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {(verified.length > 0 ? verified : members).map(m => <MemberRow key={m.id} member={m} ngoId={ngo.id} inline />)}
          {members.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-sm text-gray-500">Belum ada ahli. Kongsikan kod rujukan kepada ibu tunggal.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function MemberRow({ member: m, ngoId, inline }: {
  member: { id: string; fullName: string; email: string; verifiedByNgo: boolean; verifiedByAdmin: boolean; locationCity: string; ratingAvg: number; totalBookings: number; isActive: boolean }
  ngoId: string
  inline?: boolean
}) {
  const base = 'flex items-center gap-4'
  return (
    <div className={inline ? `p-4 ${base}` : `p-4 rounded-2xl bg-orange-50 border border-orange-100 ${base}`}>
      <div className="w-10 h-10 rounded-full bg-[#6366F1] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
        {m.fullName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">{m.fullName}</span>
          {m.verifiedByNgo && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">NGO ✓</span>}
          {m.verifiedByAdmin && <span className="text-xs bg-[#E0E7FF] text-[#6366F1] px-1.5 py-0.5 rounded-full">Admin ✓</span>}
          {!m.isActive && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Suspended</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
          <span>{m.email}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.locationCity}</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" fill="currentColor" />{m.ratingAvg > 0 ? m.ratingAvg.toFixed(1) : 'Baru'}</span>
          <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{m.totalBookings}</span>
        </div>
      </div>
      <MemberVerifyButton profileId={m.id} ngoId={ngoId} verifiedByNgo={m.verifiedByNgo} />
    </div>
  )
}
