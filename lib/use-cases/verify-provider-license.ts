import { supabaseAdmin } from '@/lib/supabase/admin'
import { Errors } from '@/lib/errors'
import { sendLicenseApproved, sendLicenseRejected } from '@/lib/email'

export async function verifyProviderLicense(input: {
  licenseId: string
  providerId: string
  action: 'approve' | 'reject'
  adminId: string
  rejectionReason?: string
}): Promise<void> {
  const { licenseId, providerId, action, adminId, rejectionReason } = input

  if (action === 'reject' && !rejectionReason?.trim())
    throw Errors.badRequest('Rejection reason is required')

  const { data: lic } = await supabaseAdmin
    .from('professional_licenses')
    .select('*, provider:provider_id(full_name, email)')
    .eq('id', licenseId)
    .eq('provider_id', providerId)
    .maybeSingle()

  if (!lic) throw Errors.notFound('License record')

  const now = new Date().toISOString()

  if (action === 'approve') {
    await supabaseAdmin.from('professional_licenses').update({
      verified: true, verified_at: now, verified_by: adminId, rejection_reason: null,
    }).eq('id', licenseId)

    await supabaseAdmin.from('provider_profiles').update({
      license_verified: true, license_verified_at: now,
      license_verified_by: adminId, license_rejection_reason: null, is_available: true,
    }).eq('user_id', providerId)

    await supabaseAdmin.from('users').update({ status: 'verified' }).eq('id', providerId)

    await supabaseAdmin.from('notifications').insert({
      user_id: providerId, type: 'license_approved',
      title: 'Sijil Diluluskan',
      message: 'Tahniah! Sijil profesional anda telah disahkan. Anda kini boleh menerima tempahan.',
      action_url: '/dashboard/provider', sent_via: ['in_app'],
    })

    try {
      await sendLicenseApproved({
        to: lic.provider.email,
        providerName: lic.provider.full_name,
        licenseNumber: lic.license_number,
      })
    } catch (err) {
      console.error('[verifyProviderLicense] Approval email failed (non-fatal):', err)
    }
  } else {
    await supabaseAdmin.from('professional_licenses').update({
      verified: false, verified_at: now, verified_by: adminId, rejection_reason: rejectionReason,
    }).eq('id', licenseId)

    await supabaseAdmin.from('provider_profiles').update({
      license_verified: false, license_rejection_reason: rejectionReason, is_available: false,
    }).eq('user_id', providerId)

    await supabaseAdmin.from('notifications').insert({
      user_id: providerId, type: 'license_rejected',
      title: 'Sijil Tidak Diluluskan',
      message: `Maaf, sijil anda tidak diluluskan. Sebab: ${rejectionReason}. Sila kemaskini maklumat dan cuba semula.`,
      action_url: '/dashboard/provider/profile', sent_via: ['in_app'],
    })

    try {
      await sendLicenseRejected({
        to: lic.provider.email,
        providerName: lic.provider.full_name,
        reason: rejectionReason!,
      })
    } catch (err) {
      console.error('[verifyProviderLicense] Rejection email failed (non-fatal):', err)
    }
  }
}
