import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { Errors } from '@/lib/errors'

export const GET = withAuth(async ({ user }) => {
  const { data, error } = await supabaseAdmin
    .from('customer_favorites').select('provider_id').eq('customer_id', user.id)
  if (error) throw Errors.serverError(error.message)
  return NextResponse.json({ favorites: (data ?? []).map((r) => r.provider_id) })
})

export const POST = withAuth(async ({ user, req }) => {
  const body = await req.json()
  const providerId = body?.providerId as string | undefined
  if (!providerId) throw Errors.badRequest('providerId required')

  const { error } = await supabaseAdmin
    .from('customer_favorites').insert({ customer_id: user.id, provider_id: providerId })
  if (error && error.code !== '23505') throw Errors.serverError(error.message)
  return NextResponse.json({ success: true })
})

export const DELETE = withAuth(async ({ user, req }) => {
  const body = await req.json()
  const providerId = body?.providerId as string | undefined
  if (!providerId) throw Errors.badRequest('providerId required')

  await supabaseAdmin.from('customer_favorites')
    .delete().eq('customer_id', user.id).eq('provider_id', providerId)
  return NextResponse.json({ success: true })
})
