import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { analyzeICPhoto } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('single_mother_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ message: 'Profil tidak dijumpai' }, { status: 404 })

  const formData = await request.formData()
  const icNumber = formData.get('icNumber') as string | null
  const frontFile = formData.get('front') as File | null
  const backFile = formData.get('back') as File | null

  if (!icNumber || !frontFile || !backFile) {
    return NextResponse.json({ message: 'No. IC, gambar hadapan dan belakang diperlukan' }, { status: 400 })
  }
  if (!/^\d{6}-\d{2}-\d{4}$/.test(icNumber)) {
    return NextResponse.json({ message: 'Format No. IC tidak sah (contoh: 901231-14-5678)' }, { status: 400 })
  }

  async function uploadFile(file: File, name: string) {
    const ext = file.name.split('.').pop()
    const path = `${profile!.id}/${name}.${ext}`
    const bytes = await file.arrayBuffer()
    const { error } = await supabaseAdmin.storage
      .from('ic-documents').upload(path, Buffer.from(bytes), { contentType: file.type, upsert: true })
    if (error) throw error
    return supabaseAdmin.storage.from('ic-documents').getPublicUrl(path).data.publicUrl
  }

  const [frontUrl, backUrl] = await Promise.all([
    uploadFile(frontFile, 'ic-front'),
    uploadFile(backFile, 'ic-back'),
  ])

  // Gemini AI pre-screen detect blur/fake IC before admin review
  let aiAnalysis = null
  try {
    aiAnalysis = await analyzeICPhoto(frontUrl)
  } catch {
    // AI failure is non-blocking proceed with manual review
  }

  const now = new Date().toISOString()
  await supabaseAdmin.from('single_mother_profiles').update({
    ic_number: icNumber,
    ic_front_url: frontUrl,
    ic_back_url: backUrl,
    ic_submitted_at: now,
    ic_verified: false,
    ic_rejected_reason: null,
    updated_at: now,
  }).eq('id', profile.id)

  return NextResponse.json({
    success: true,
    aiPreScreen: aiAnalysis ? {
      isValid: aiAnalysis.isValid,
      confidence: aiAnalysis.confidence,
      issues: aiAnalysis.issues,
      warning: !aiAnalysis.isValid ? 'Gambar IC mungkin tidak jelas. Sila semak semula.' : null,
    } : null,
  })
}
