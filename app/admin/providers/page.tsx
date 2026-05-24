import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { CheckCircle, XCircle, Star, MapPin, Clock } from 'lucide-react'
import ProviderActions from './_provider-actions'

export default async function AdminProvidersPage() {
  await requireAdmin()

  const { data: rawProviders } = await supabaseAdmin
    .from('single_mother_profiles')
    .select(`
      id, verified_by_ngo, verified_by_admin, background_check_status,
      location_city, location_state, rating_avg, total_reviews, total_bookings,
      is_active, created_at,
      users!inner(id, full_name, email, status)
    `)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const providers = (rawProviders ?? []).map((p: any) => ({
    id: p.id,
    userId: p.users.id as string,
    fullName: p.users.full_name as string,
    email: p.users.email as string,
    userStatus: p.users.status as string,
    verifiedByNgo: p.verified_by_ngo as boolean,
    verifiedByAdmin: p.verified_by_admin as boolean,
    bgCheck: p.background_check_status as string,
    locationCity: p.location_city as string,
    locationState: p.location_state as string,
    ratingAvg: parseFloat(String(p.rating_avg)),
    totalReviews: p.total_reviews as number,
    totalBookings: p.total_bookings as number,
    isActive: p.is_active as boolean,
    createdAt: new Date(p.created_at as string),
  }))

  const pending = providers.filter(p => !p.verifiedByAdmin)
  const verified = providers.filter(p => p.verifiedByAdmin)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengurusan Provider</h1>
        <p className="text-sm text-gray-500 mt-1">{providers.length} provider berdaftar · {pending.length} menunggu pengesahan admin</p>
      </div>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-3">Menunggu Pengesahan Admin ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map(p => (
              <ProviderRow key={p.id} provider={p} highlight />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Semua Provider ({providers.length})</h2>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {providers.map(p => (
            <ProviderRow key={p.id} provider={p} />
          ))}
          {providers.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">Tiada provider lagi</div>
          )}
        </div>
      </section>
    </div>
  )
}

function ProviderRow({ provider: p, highlight }: { provider: ReturnType<typeof mapProvider>; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl flex items-center gap-4 ${highlight ? 'bg-orange-50 border border-orange-100' : 'bg-white border border-gray-100'}`}>
      <div className="w-10 h-10 rounded-full bg-[#6366F1] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
        {p.fullName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">{p.fullName}</span>
          {p.verifiedByNgo && <span className="text-xs bg-[#E0E7FF] text-[#6366F1] px-1.5 py-0.5 rounded-full">NGO ✓</span>}
          {p.verifiedByAdmin && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Admin ✓</span>}
          {!p.isActive && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Suspended</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
          <span>{p.email}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.locationCity}</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" fill="currentColor" />{p.ratingAvg > 0 ? p.ratingAvg.toFixed(1) : 'Baru'}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.totalBookings} booking</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.bgCheck === 'approved' ? 'bg-emerald-100 text-emerald-700' : p.bgCheck === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
          BG: {p.bgCheck}
        </span>
        <ProviderActions profileId={p.id} userId={p.userId} verifiedByAdmin={p.verifiedByAdmin} isActive={p.isActive} bgCheck={p.bgCheck} />
      </div>
    </div>
  )
}

function mapProvider(p: any) { return p }
