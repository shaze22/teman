import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 20 * 1024 * 1024  // 20MB

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('provider_profiles').select('user_id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ message: 'Provider profile not found' }, { status: 404 })

  const formData = await request.formData()
  const licenseType = formData.get('certType') as string | null
  const certFile = formData.get('file') as File | null

  if (!licenseType || !certFile) {
    return NextResponse.json({ message: 'License type and file are required' }, { status: 400 })
  }
  if (certFile.size > MAX_SIZE) {
    return NextResponse.json({ message: 'File size exceeds 20MB limit' }, { status: 400 })
  }
  if (!ALLOWED_MIME.includes(certFile.type)) {
    return NextResponse.json({ message: 'Invalid file type. Use JPG, PNG or PDF' }, { status: 400 })
  }

  const ext = certFile.type === 'application/pdf' ? 'pdf' : 'jpg'
  const path = `${user.id}/license.${ext}`
  const bytes = await certFile.arrayBuffer()
  const { error } = await supabaseAdmin.storage
    .from('license-certs').upload(path, Buffer.from(bytes), { contentType: certFile.type, upsert: true })
  if (error) return NextResponse.json({ message: 'Failed to upload certificate' }, { status: 500 })

  const licenseUrl = supabaseAdmin.storage.from('license-certs').getPublicUrl(path).data.publicUrl

  await supabaseAdmin.from('provider_profiles').update({
    license_type: licenseType,
    license_url: licenseUrl,
    license_verified: false,
    updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  return NextResponse.json({ success: true, certUrl: licenseUrl })
}
