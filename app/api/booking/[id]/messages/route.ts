import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { createNotification } from '@/lib/notifications'
import { Errors } from '@/lib/errors'

async function getBookingAndVerifyAccess(bookingId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('bookings').select('id, customer_id, provider_id, status').eq('id', bookingId).single()
  if (!data) return null
  if (data.customer_id !== userId && data.provider_id !== userId) return null
  return data
}

export const GET = withAuth(async ({ user, params }) => {
  const { id } = params
  const booking = await getBookingAndVerifyAccess(id, user.id)
  if (!booking) throw Errors.forbidden()

  const { data: messages } = await supabaseAdmin
    .from('booking_messages').select('id, sender_id, content, is_read, created_at')
    .eq('booking_id', id).order('created_at', { ascending: true }).limit(100)

  await supabaseAdmin.from('booking_messages')
    .update({ is_read: true })
    .eq('booking_id', id).neq('sender_id', user.id).eq('is_read', false)

  return NextResponse.json(messages ?? [])
})

export const POST = withAuth(async ({ user, req, params }) => {
  const { id } = params
  const booking = await getBookingAndVerifyAccess(id, user.id)
  if (!booking) throw Errors.forbidden()

  if (['cancelled', 'refunded'].includes(booking.status))
    throw Errors.badRequest('Booking telah ditamatkan')

  const { content } = await req.json()
  if (!content?.trim()) throw Errors.badRequest('Mesej kosong')
  if (content.length > 1000) throw Errors.badRequest('Mesej terlalu panjang')

  const { data: message, error } = await supabaseAdmin.from('booking_messages').insert({
    id: crypto.randomUUID(), booking_id: id, sender_id: user.id,
    content: content.trim(), is_read: false, created_at: new Date().toISOString(),
  }).select('id, sender_id, content, is_read, created_at').single()

  if (error) throw Errors.serverError(error.message)

  const otherId = booking.customer_id === user.id ? booking.provider_id : booking.customer_id
  const { data: sender } = await supabaseAdmin.from('users').select('full_name').eq('id', user.id).single()
  createNotification({
    userId: otherId, type: 'new_message',
    title: `Mesej dari ${sender?.full_name ?? 'Pengguna'}`,
    message: content.length > 60 ? content.slice(0, 60) + '…' : content,
    actionUrl: `/booking/${id}/chat`, data: { bookingId: id },
  }).catch(() => {})

  return NextResponse.json(message)
})
