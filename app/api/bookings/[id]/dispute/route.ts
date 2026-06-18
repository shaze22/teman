import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { Errors } from '@/lib/errors'

const schema = z.object({ reason: z.string().min(10).max(1000) })

export const POST = withAuth(async ({ user, req, params }) => {
  const { id } = params
  const { reason } = await parseBody(req, schema)

  const { data: booking } = await supabaseAdmin
    .from('bookings').select('id, customer_id, status, funds_released, funds_released_at')
    .eq('id', id).single()

  if (!booking) throw Errors.notFound('Booking')
  if (booking.customer_id !== user.id) throw Errors.forbidden('Hanya pelanggan boleh buka aduan')
  if (!booking.funds_released) throw Errors.badRequest('Dana belum dilepaskan')

  const releasedAt = new Date(booking.funds_released_at as string)
  const hoursElapsed = (Date.now() - releasedAt.getTime()) / 3_600_000
  if (hoursElapsed > 48) throw Errors.badRequest('Tempoh aduan 48 jam telah tamat')

  const { data: existing } = await supabaseAdmin.from('disputes').select('id').eq('booking_id', id).single()
  if (existing) throw Errors.conflict('Aduan sudah wujud untuk booking ini')

  const now = new Date().toISOString()
  await supabaseAdmin.from('disputes').insert({
    id: crypto.randomUUID(), booking_id: id, raised_by: user.id,
    reason, status: 'open', created_at: now, updated_at: now,
  })

  return NextResponse.json({ success: true })
})

export const GET = withAuth(async ({ user: _user, params }) => {
  const { id } = params
  const { data } = await supabaseAdmin
    .from('disputes').select('id, status, reason, resolution, created_at')
    .eq('booking_id', id).single()
  return NextResponse.json(data ?? null)
})
