import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import LicenseVerifyActions from './_license-verify-actions'
import { LICENSE_TYPES } from '@/lib/services'

export const metadata = { title: 'Verify Licenses' }

export default async function VerifyLicensePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: admin } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (admin?.role !== 'super_admin') redirect('/dashboard')

  // Fetch pending license verifications
  const { data: pending } = await supabaseAdmin
    .from('professional_licenses')
    .select(`
      *,
      provider:provider_id (
        id, full_name, email, role,
        provider_profiles (
          location_city, location_state, rating_avg, total_bookings,
          ic_url, selfie_url, ic_verified, license_verified
        )
      )
    `)
    .eq('verified', false)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(50)

  // Fetch recently verified
  const { data: verified } = await supabaseAdmin
    .from('professional_licenses')
    .select(`
      id, license_type, license_number, verified, verified_at, rejection_reason,
      provider:provider_id (id, full_name, email, role)
    `)
    .eq('verified', true)
    .order('verified_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Semakan Sijil Profesional</h1>
        <p className="text-sm text-slate-500 mt-1">
          {pending?.length ?? 0} permohonan menunggu pengesahan
        </p>
      </div>

      {/* Pending */}
      {pending && pending.length > 0 ? (
        <div className="space-y-4 mb-12">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Menunggu Semakan</h2>
          {pending.map((lic: any) => {
            const provider = lic.provider
            const profile = provider?.provider_profiles?.[0]
            const licInfo = LICENSE_TYPES[lic.license_type as keyof typeof LICENSE_TYPES]
            return (
              <div key={lic.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900">{provider?.full_name}</div>
                      <div className="text-sm text-slate-500">{provider?.email}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{profile?.location_city}, {profile?.location_state}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 inline-block">
                        {provider?.role?.replace('locum_', '').replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(lic.created_at).toLocaleDateString('ms-MY')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">Jenis Sijil</div>
                      <div className="font-medium text-slate-900">{licInfo?.label ?? lic.license_type}</div>
                      <div className="text-xs text-slate-500">{licInfo?.issuedBy}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">Nombor Pendaftaran</div>
                      <div className="font-mono font-medium text-slate-900">{lic.license_number}</div>
                      {lic.expiry_date && (
                        <div className="text-xs text-slate-500">Tamat: {new Date(lic.expiry_date).toLocaleDateString('ms-MY')}</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {licInfo?.checkUrl && (
                      <a href={licInfo.checkUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-teal-600 hover:underline border border-teal-200 rounded px-2 py-1">
                        Semak di {licInfo.issuedBy}
                      </a>
                    )}
                    {lic.license_url && (
                      <a href={lic.license_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline border border-blue-200 rounded px-2 py-1">
                        Lihat Sijil
                      </a>
                    )}
                    {profile?.ic_url && (
                      <a href={profile.ic_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-slate-600 hover:underline border border-slate-200 rounded px-2 py-1">
                        Lihat IC
                      </a>
                    )}
                    {profile?.selfie_url && (
                      <a href={profile.selfie_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-slate-600 hover:underline border border-slate-200 rounded px-2 py-1">
                        Lihat Selfie
                      </a>
                    )}
                  </div>
                </div>

                <LicenseVerifyActions licenseId={lic.id} providerId={provider?.id} providerName={provider?.full_name} providerEmail={provider?.email} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 mb-12">
          Tiada permohonan sijil menunggu pengesahan.
        </div>
      )}

      {/* Recently verified */}
      {verified && verified.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-4">Baru Disahkan</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Nama</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Sijil</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Nombor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Tarikh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {verified.map((lic: any) => (
                  <tr key={lic.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{lic.provider?.full_name}</div>
                      <div className="text-xs text-slate-500">{lic.provider?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{LICENSE_TYPES[lic.license_type as keyof typeof LICENSE_TYPES]?.label ?? lic.license_type}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{lic.license_number}</td>
                    <td className="px-4 py-3">
                      {lic.verified ? (
                        <span className="text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">Lulus</span>
                      ) : (
                        <span className="text-xs font-medium bg-red-100 text-red-700 rounded-full px-2 py-0.5">Tolak</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {lic.verified_at ? new Date(lic.verified_at).toLocaleDateString('ms-MY') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
