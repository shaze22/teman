import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import ProvidersListClient from './_providers-list'

export default async function AdminProvidersPage() {
  await requireAdmin()

  const { data: rawProviders } = await supabaseAdmin
    .from('single_mother_profiles')
    .select(`
      id, verified_by_ngo, verified_by_admin, background_check_status,
      location_city, location_state, rating_avg, total_reviews, total_bookings,
      is_active, created_at, ngo_id,
      ic_number, ic_submitted_at, ic_verified, ic_front_url, ic_back_url, ic_rejected_reason,
      users!inner(id, full_name, email, status)
    `)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const providers = (rawProviders ?? []).map((p: any) => ({
    id: p.id as string,
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
    ngoId: p.ngo_id as string | null,
    icNumber: p.ic_number as string | null,
    icSubmittedAt: p.ic_submitted_at as string | null,
    icVerified: p.ic_verified as boolean,
    icFrontUrl: p.ic_front_url as string | null,
    icBackUrl: p.ic_back_url as string | null,
    icRejectedReason: p.ic_rejected_reason as string | null,
  }))

  const pending = providers.filter(p => !p.verifiedByAdmin)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengurusan Provider</h1>
        <p className="text-sm text-gray-500 mt-1">{providers.length} provider berdaftar · {pending.length} menunggu pengesahan admin</p>
      </div>
      <ProvidersListClient providers={providers} />
    </div>
  )
}
