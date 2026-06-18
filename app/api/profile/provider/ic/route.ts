import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth, type AuthContext } from '@/lib/api/handler'
import { Errors } from '@/lib/errors'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024

export const POST = withAuth(async ({ user, req }: AuthContext) => {
  const { data: profile } = await supabaseAdmin
    .from('provider_profiles').select('user_id').eq('user_id', user.id).single()
  if (!profile) throw Errors.notFound('Provider profile')

  const formData = await req.formData()
  const frontFile = formData.get('front') as File | null
  const backFile = formData.get('back') as File | null

  if (!frontFile || !backFile) throw Errors.badRequest('Front and back IC images are required')
  if (frontFile.size > MAX_SIZE || backFile.size > MAX_SIZE) throw Errors.badRequest('File size exceeds 10MB limit')
  if (!ALLOWED_MIME.includes(frontFile.type) || !ALLOWED_MIME.includes(backFile.type))
    throw Errors.badRequest('Invalid file type. Use JPG or PNG')

  async function uploadFile(file: File, name: string): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${name}.${ext}`
    const bytes = await file.arrayBuffer()
    const { error } = await supabaseAdmin.storage
      .from('ic-documents').upload(path, Buffer.from(bytes), { contentType: file.type, upsert: true })
    if (error) throw error
    return supabaseAdmin.storage.from('ic-documents').getPublicUrl(path).data.publicUrl
  }

  const [frontUrl] = await Promise.all([
    uploadFile(frontFile, 'ic-front'),
    uploadFile(backFile, 'ic-back'),
  ])

  await supabaseAdmin.from('provider_profiles').update({
    ic_url: frontUrl, ic_verified: false, updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  return NextResponse.json({ success: true })
})
