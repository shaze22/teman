import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth, type AuthContext } from '@/lib/api/handler'
import { Errors } from '@/lib/errors'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 20 * 1024 * 1024

export const POST = withAuth(async ({ user, req }: AuthContext) => {
  const { data: profile } = await supabaseAdmin
    .from('provider_profiles').select('user_id').eq('user_id', user.id).single()
  if (!profile) throw Errors.notFound('Provider profile')

  const formData = await req.formData()
  const licenseType = formData.get('certType') as string | null
  const certFile = formData.get('file') as File | null

  if (!licenseType || !certFile) throw Errors.badRequest('License type and file are required')
  if (certFile.size > MAX_SIZE) throw Errors.badRequest('File size exceeds 20MB limit')
  if (!ALLOWED_MIME.includes(certFile.type)) throw Errors.badRequest('Invalid file type. Use JPG, PNG or PDF')

  const ext = certFile.type === 'application/pdf' ? 'pdf' : 'jpg'
  const path = `${user.id}/license.${ext}`
  const bytes = await certFile.arrayBuffer()

  const { error } = await supabaseAdmin.storage
    .from('license-certs').upload(path, Buffer.from(bytes), { contentType: certFile.type, upsert: true })
  if (error) throw Errors.serverError('Failed to upload certificate')

  const licenseUrl = supabaseAdmin.storage.from('license-certs').getPublicUrl(path).data.publicUrl

  await supabaseAdmin.from('provider_profiles').update({
    license_type: licenseType, license_url: licenseUrl,
    license_verified: false, updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  return NextResponse.json({ success: true, certUrl: licenseUrl })
})
