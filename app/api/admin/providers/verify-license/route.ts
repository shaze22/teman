import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendLicenseApproved, sendLicenseRejected } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (admin?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { licenseId, providerId, action, rejectionReason } = await req.json()

  if (!licenseId || !providerId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Input tidak sah.' }, { status: 400 })
  }
  if (action === 'reject' && !rejectionReason?.trim()) {
    return NextResponse.json({ error: 'Sebab penolakan diperlukan.' }, { status: 400 })
  }

  // Fetch license + provider info
  const { data: lic } = await supabaseAdmin
    .from('professional_licenses')
    .select('*, provider:provider_id(full_name, email, role)')
    .eq('id', licenseId)
    .eq('provider_id', providerId)
    .maybeSingle()

  if (!lic) return NextResponse.json({ error: 'Rekod sijil tidak dijumpai.' }, { status: 404 })

  if (action === 'approve') {
    // Update professional_licenses
    const { error: licError } = await supabaseAdmin
      .from('professional_licenses')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
        rejection_reason: null,
      })
      .eq('id', licenseId)

    if (licError) return NextResponse.json({ error: 'Gagal kemaskini rekod sijil.' }, { status: 500 })

    // Update provider_profiles
    await supabaseAdmin
      .from('provider_profiles')
      .update({
        license_verified: true,
        license_verified_at: new Date().toISOString(),
        license_verified_by: user.id,
        license_rejection_reason: null,
        is_available: true,
      })
      .eq('user_id', providerId)

    // Update user status to active
    await supabaseAdmin
      .from('users')
      .update({ status: 'verified' })
      .eq('id', providerId)

    // Notify provider in-app
    await supabaseAdmin.from('notifications').insert({
      user_id: providerId,
      type: 'license_approved',
      title: 'Sijil Diluluskan',
      message: 'Tahniah! Sijil profesional anda telah disahkan. Anda kini boleh menerima tempahan.',
      action_url: '/dashboard/provider',
      sent_via: ['in_app'],
    })

    // Send email
    try {
      await sendLicenseApproved({ to: lic.provider.email, providerName: lic.provider.full_name, licenseNumber: lic.license_number })
    } catch (emailErr) {
      console.error('Approval email failed (non-fatal):', emailErr)
    }

    return NextResponse.json({ success: true, action: 'approved' })

  } else {
    // REJECT
    await supabaseAdmin
      .from('professional_licenses')
      .update({
        verified: false,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
        rejection_reason: rejectionReason,
      })
      .eq('id', licenseId)

    await supabaseAdmin
      .from('provider_profiles')
      .update({
        license_verified: false,
        license_rejection_reason: rejectionReason,
        is_available: false,
      })
      .eq('user_id', providerId)

    // Notify provider
    await supabaseAdmin.from('notifications').insert({
      user_id: providerId,
      type: 'license_rejected',
      title: 'Sijil Tidak Diluluskan',
      message: `Maaf, sijil anda tidak diluluskan. Sebab: ${rejectionReason}. Sila kemaskini maklumat dan cuba semula.`,
      action_url: '/dashboard/provider/profile',
      sent_via: ['in_app'],
    })

    try {
      await sendLicenseRejected({ to: lic.provider.email, providerName: lic.provider.full_name, reason: rejectionReason })
    } catch (emailErr) {
      console.error('Rejection email failed (non-fatal):', emailErr)
    }

    return NextResponse.json({ success: true, action: 'rejected' })
  }
}
