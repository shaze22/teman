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
  const file = formData.get('file') as File | null
  const caption = formData.get('caption') as string | null

  if (!file) return NextResponse.json({ message: 'Fail tidak ditemui' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ message: 'Fail terlalu besar (max 5MB)' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const path = `${profile.id}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabaseAdmin.storage
    .from('portfolio').upload(path, Buffer.from(bytes), { contentType: file.type, upsert: false })
  if (uploadError) return NextResponse.json({ message: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabaseAdmin.storage.from('portfolio').getPublicUrl(path)

  const { data: inserted } = await supabaseAdmin.from('provider_portfolios').insert({
    id: crypto.randomUUID(),
    profile_id: profile.id,
    image_url: publicUrl,
    title: caption ?? null,
  }).select('id, image_url, title').single()

  return NextResponse.json(inserted)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  const { id } = await request.json()

  const { data: profile } = await supabaseAdmin
    .from('single_mother_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ message: 'Profil tidak dijumpai' }, { status: 404 })

  const { data: photo } = await supabaseAdmin
    .from('provider_portfolios').select('id, image_url').eq('id', id).eq('profile_id', profile.id).single()
  if (!photo) return NextResponse.json({ message: 'Foto tidak dijumpai' }, { status: 404 })

  // Delete from storage
  const path = photo.image_url.split('/portfolio/')[1]
  if (path) await supabaseAdmin.storage.from('portfolio').remove([path])

  await supabaseAdmin.from('provider_portfolios').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
