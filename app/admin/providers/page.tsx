import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import ProvidersListClient from './_providers-list'

export default async function AdminProvidersPage() {
  await requireAdmin()

  const { data: rawProviders } = await supabaseAdmin
    .from('provider_profiles')
    .select(`
      id, is_active, ic_number, ic_url, ic_verified, gemini_verified_at,
      license_type, license_url, license_verified, license_rejection_reason,
      location_city, location_state, rating_avg, total_reviews, total_bookings, created_at,
      users!provider_profiles_user_id_fkey(id, full_name, email, status, role)
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const providers = (rawProviders ?? []).map((p: any) => ({
    id: p.id as string,
    userId: p.users.id as string,
    fullName: p.users.full_name as string,
    email: p.users.email as string,
    userStatus: p.users.status as string,
    verifiedByAdmin: p.is_active as boolean,
    locationCity: p.location_city as string,
    locationState: p.location_state as string,
    ratingAvg: parseFloat(String(p.rating_avg)),
    totalReviews: p.total_reviews as number,
    totalBookings: p.total_bookings as number,
    isActive: p.is_active as boolean,
    icNumber: p.ic_number as string | null,
    icSubmittedAt: p.gemini_verified_at as string | null,
    icVerified: p.ic_verified as boolean,
    icFrontUrl: p.ic_url as string | null,
    icBackUrl: null,
    icRejectedReason: null,
    isLocum: ['locum_nurse', 'locum_physio', 'locum_care_aide'].includes(p.users.role as string),
    locumCertType: p.license_type as string | null,
    locumCertUrl: p.license_url as string | null,
    locumVerified: (p.license_verified as boolean) ?? false,
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
