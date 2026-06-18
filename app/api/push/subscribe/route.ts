import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

const deleteSchema = z.object({ endpoint: z.string().url() })

export const POST = withAuth(async ({ user, req }) => {
  const { endpoint, keys: { p256dh, auth } } = await parseBody(req, subscribeSchema)
  await supabaseAdmin.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint, p256dh, auth },
    { onConflict: 'endpoint' }
  )
  return NextResponse.json({ ok: true })
})

export const DELETE = withAuth(async ({ user, req }) => {
  const { endpoint } = await parseBody(req, deleteSchema)
  await supabaseAdmin.from('push_subscriptions')
    .delete().eq('endpoint', endpoint).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
})

export function GET(_req: NextRequest) {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? '' })
}
