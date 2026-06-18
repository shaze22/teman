import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'

export const POST = withAuth(async ({ user, req }) => {
  const sub = await req.json()
  const { endpoint, keys: { p256dh, auth } } = sub
  await supabaseAdmin.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint, p256dh, auth },
    { onConflict: 'endpoint' }
  )
  return NextResponse.json({ ok: true })
})

export const DELETE = withAuth(async ({ user, req }) => {
  const { endpoint } = await req.json()
  await supabaseAdmin.from('push_subscriptions')
    .delete().eq('endpoint', endpoint).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
})

export function GET(_req: NextRequest) {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? '' })
}
