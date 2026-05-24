import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function getBookingAndVerifyAccess(bookingId: string, userId: string) {
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, customer_id, provider_id, status')
    .eq('id', bookingId)
    .single()

  if (!booking) return null
  if (booking.customer_id !== userId && booking.provider_id !== userId) return null
  return booking
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const booking = await getBookingAndVerifyAccess(id, user.id)
  if (!booking) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: messages } = await supabaseAdmin
    .from('booking_messages')
    .select('id, sender_id, content, is_read, created_at')
    .eq('booking_id', id)
    .order('created_at', { ascending: true })
    .limit(100)

  // Mark unread messages from the other party as read
  await supabaseAdmin
    .from('booking_messages')
    .update({ is_read: true })
    .eq('booking_id', id)
    .neq('sender_id', user.id)
    .eq('is_read', false)

  return NextResponse.json(messages ?? [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const booking = await getBookingAndVerifyAccess(id, user.id)
  if (!booking) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Only allow chat if booking is not cancelled/refunded
  if (['cancelled', 'refunded'].includes(booking.status)) {
    return NextResponse.json({ error: 'Booking telah ditamatkan' }, { status: 400 })
  }

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Mesej kosong' }, { status: 400 })
  if (content.length > 1000) return NextResponse.json({ error: 'Mesej terlalu panjang' }, { status: 400 })

  const { data: message, error } = await supabaseAdmin
    .from('booking_messages')
    .insert({
      id: crypto.randomUUID(),
      booking_id: id,
      sender_id: user.id,
      content: content.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    })
    .select('id, sender_id, content, is_read, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the other party
  const otherId = booking.customer_id === user.id ? booking.provider_id : booking.customer_id
  const { data: sender } = await supabaseAdmin.from('users').select('full_name').eq('id', user.id).single()
  const { createNotification } = await import('@/lib/notifications')
  createNotification({
    userId: otherId,
    type: 'new_message',
    title: `Mesej dari ${sender?.full_name ?? 'Pengguna'}`,
    message: content.length > 60 ? content.slice(0, 60) + '…' : content,
    actionUrl: `/booking/${id}/chat`,
    data: { bookingId: id },
  }).catch(() => {})

  return NextResponse.json(message)
}
