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
  if (booking.customer_id !== user.id) throw Errors.forbidden('Only the customer can open a dispute')
  if (!booking.funds_released) throw Errors.badRequest('Funds must be released before opening a dispute')

  const releasedAt = new Date(booking.funds_released_at as string)
  const hoursElapsed = (Date.now() - releasedAt.getTime()) / 3_600_000
  if (hoursElapsed > 48) throw Errors.badRequest('The 48-hour dispute window has closed')

  const { data: existing } = await supabaseAdmin.from('disputes').select('id').eq('booking_id', id).single()
  if (existing) throw Errors.conflict('A dispute already exists for this booking')

  const now = new Date().toISOString()
  const { error } = await supabaseAdmin.from('disputes').insert({
    id: crypto.randomUUID(), booking_id: id, raised_by: user.id,
    reason, status: 'open', created_at: now, updated_at: now,
  })
  if (error) throw Errors.serverError(error.message)

  return NextResponse.json({ success: true })
})

export const GET = withAuth(async ({ user, params }) => {
  const { id } = params

  // Verify the requesting user is a party to this booking
  const { data: booking } = await supabaseAdmin
    .from('bookings').select('customer_id, provider_id').eq('id', id).single()

  if (!booking) throw Errors.notFound('Booking')
  if (booking.customer_id !== user.id && booking.provider_id !== user.id)
    throw Errors.forbidden()

  const { data } = await supabaseAdmin
    .from('disputes').select('id, status, reason, resolution, created_at')
    .eq('booking_id', id).single()
  return NextResponse.json(data ?? null)
})
