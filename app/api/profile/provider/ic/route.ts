import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024  // 10MB

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('provider_profiles').select('user_id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ message: 'Provider profile not found' }, { status: 404 })

  const formData = await request.formData()
  const frontFile = formData.get('front') as File | null
  const backFile = formData.get('back') as File | null

  if (!frontFile || !backFile) {
    return NextResponse.json({ message: 'Front and back IC images are required' }, { status: 400 })
  }
  if (frontFile.size > MAX_SIZE || backFile.size > MAX_SIZE) {
    return NextResponse.json({ message: 'File size exceeds 10MB limit' }, { status: 400 })
  }
  if (!ALLOWED_MIME.includes(frontFile.type) || !ALLOWED_MIME.includes(backFile.type)) {
    return NextResponse.json({ message: 'Invalid file type. Use JPG or PNG' }, { status: 400 })
  }

  async function uploadFile(file: File, name: string) {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user!.id}/${name}.${ext}`
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

  const now = new Date().toISOString()
  await supabaseAdmin.from('provider_profiles').update({
    ic_url: frontUrl,
    ic_verified: false,
    updated_at: now,
  }).eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
