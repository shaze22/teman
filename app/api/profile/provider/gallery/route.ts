import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth, type AuthContext } from '@/lib/api/handler'
import { Errors } from '@/lib/errors'

export const POST = withAuth(async ({ user, req }: AuthContext) => {
  const { data: profile } = await supabaseAdmin
    .from('provider_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!profile) throw Errors.notFound('Profil')

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const caption = formData.get('caption') as string | null

  if (!file) throw Errors.badRequest('Fail tidak ditemui')
  if (file.size > 5 * 1024 * 1024) throw Errors.badRequest('Fail terlalu besar (max 5MB)')

  const ext = file.name.split('.').pop()
  const path = `${profile.id}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabaseAdmin.storage
    .from('portfolio').upload(path, Buffer.from(bytes), { contentType: file.type, upsert: false })
  if (uploadError) throw Errors.serverError(uploadError.message)

  const { data: { publicUrl } } = supabaseAdmin.storage.from('portfolio').getPublicUrl(path)

  const { data: inserted } = await supabaseAdmin.from('provider_portfolios').insert({
    id: crypto.randomUUID(), profile_id: profile.id, image_url: publicUrl, title: caption ?? null,
  }).select('id, image_url, title').single()

  return NextResponse.json(inserted)
})

export const DELETE = withAuth(async ({ user, req }: AuthContext) => {
  const { id } = await req.json()

  const { data: profile } = await supabaseAdmin
    .from('provider_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!profile) throw Errors.notFound('Profil')

  const { data: photo } = await supabaseAdmin
    .from('provider_portfolios').select('id, image_url').eq('id', id).eq('profile_id', profile.id).single()
  if (!photo) throw Errors.notFound('Foto')

  const path = photo.image_url.split('/portfolio/')[1]
  if (path) await supabaseAdmin.storage.from('portfolio').remove([path])

  await supabaseAdmin.from('provider_portfolios').delete().eq('id', id)
  return NextResponse.json({ success: true })
})
