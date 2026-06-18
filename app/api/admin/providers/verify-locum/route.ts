import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAdmin } from '@/lib/api/handler'
import { Errors } from '@/lib/errors'

export const POST = withAdmin(async ({ req }) => {
  const { profileId, action } = await req.json()
  if (!profileId || !action) throw Errors.badRequest('Missing fields')

  if (action === 'approve') {
    await supabaseAdmin.from('provider_profiles').update({
      license_verified: true,
      license_verified_at: new Date().toISOString(),
    }).eq('id', profileId)
  } else if (action === 'reject') {
    await supabaseAdmin.from('provider_profiles').update({
      license_verified: false,
      license_url: null,
      license_type: null,
    }).eq('id', profileId)
  }

  return NextResponse.json({ success: true })
})
