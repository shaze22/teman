import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('single_mother_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ message: 'Profil tidak dijumpai' }, { status: 404 })

  const formData = await request.formData()
  const certType = formData.get('certType') as string | null
  const certFile = formData.get('file') as File | null

  if (!certType || !certFile) {
    return NextResponse.json({ message: 'Jenis sijil dan fail diperlukan' }, { status: 400 })
  }

  const ext = certFile.name.split('.').pop()
  const path = `${profile.id}/locum-cert.${ext}`
  const bytes = await certFile.arrayBuffer()
  const { error } = await supabaseAdmin.storage
    .from('ic-documents').upload(path, Buffer.from(bytes), { contentType: certFile.type, upsert: true })
  if (error) return NextResponse.json({ message: 'Gagal muat naik sijil' }, { status: 500 })

  const certUrl = supabaseAdmin.storage.from('ic-documents').getPublicUrl(path).data.publicUrl

  await supabaseAdmin.from('single_mother_profiles').update({
    is_locum: true,
    locum_cert_type: certType,
    locum_cert_url: certUrl,
    locum_verified: false,
    updated_at: new Date().toISOString(),
  }).eq('id', profile.id)

  return NextResponse.json({ success: true, certUrl })
}
