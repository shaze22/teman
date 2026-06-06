import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { sendRescheduleRequest, sendRescheduleResponse } from '@/lib/email'
import { z } from 'zod'

const createSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newTime: z.string().regex(/^\d{2}:\d{2}$/),
  note: z.string().max(300).optional(),
})

const respondSchema = z.object({
  requestId: z.string(),
  action: z.enum(['accept', 'reject']),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Data tidak sah' }, { status: 400 })
  const { newDate, newTime, note } = parsed.data

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, booking_code, status, customer_id, provider_id,
      customer:users!bookings_customer_id_fkey(full_name),
      provider:users!bookings_provider_id_fkey(full_name)
    `)
    .eq('id', id)
    .single()

  if (!booking) return NextResponse.json({ message: 'Booking tidak dijumpai' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = booking as any
  if (b.customer_id !== user.id && b.provider_id !== user.id)
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
  if (!['pending', 'confirmed'].includes(b.status))
    return NextResponse.json({ message: 'Tidak boleh reschedule pada status ini' }, { status: 400 })

  // Only 1 pending request allowed at a time
  const { data: existing } = await supabaseAdmin
    .from('reschedule_requests')
    .select('id')
    .eq('booking_id', id)
    .eq('status', 'pending')
    .single()
  if (existing) return NextResponse.json({ message: 'Masih ada permintaan belum dijawab' }, { status: 400 })

  const { data: req, error } = await supabaseAdmin
    .from('reschedule_requests')
    .insert({ booking_id: id, requested_by: user.id, new_date: newDate, new_time: newTime, note: note ?? null })
    .select()
    .single()
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  const isCustomer = b.customer_id === user.id
  const requesterName = isCustomer ? b.customer?.full_name : b.provider?.full_name
  const otherPartyId = isCustomer ? b.provider_id : b.customer_id
  const otherName = isCustomer ? b.provider?.full_name : b.customer?.full_name

  // Notify other party in-app
  createNotification({
    userId: otherPartyId,
    type: 'reschedule_request',
    title: '📅 Permintaan Tukar Jadual',
    message: `${requesterName} meminta tukar jadual booking #${b.booking_code} ke ${newDate} ${newTime}.`,
    actionUrl: `/booking/${id}`,
    data: { bookingId: id, requestId: req.id },
  }).catch(() => {})

  // Email
  const otherAuth = await supabaseAdmin.auth.admin.getUserById(otherPartyId)
  const otherEmail = otherAuth.data?.user?.email ?? ''
  if (otherEmail) {
    sendRescheduleRequest({
      to: otherEmail, requesterName, otherName,
      bookingCode: b.booking_code, bookingId: id,
      newDate, newTime,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, requestId: req.id })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  const body = await request.json()
  const parsed = respondSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Data tidak sah' }, { status: 400 })
  const { requestId, action } = parsed.data

  const { data: req } = await supabaseAdmin
    .from('reschedule_requests')
    .select('id, booking_id, requested_by, new_date, new_time, status')
    .eq('id', requestId)
    .eq('booking_id', id)
    .single()
  if (!req) return NextResponse.json({ message: 'Permintaan tidak dijumpai' }, { status: 404 })
  if (req.status !== 'pending') return NextResponse.json({ message: 'Permintaan sudah dijawab' }, { status: 400 })

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, booking_code, customer_id, provider_id,
      customer:users!bookings_customer_id_fkey(full_name),
      provider:users!bookings_provider_id_fkey(full_name)
    `)
    .eq('id', id)
    .single()
  if (!booking) return NextResponse.json({ message: 'Booking tidak dijumpai' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = booking as any

  // Only the OTHER party (not the requester) can respond
  if (user.id === req.requested_by)
    return NextResponse.json({ message: 'Tidak boleh jawab permintaan sendiri' }, { status: 403 })
  if (b.customer_id !== user.id && b.provider_id !== user.id)
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })

  const now = new Date().toISOString()
  const newStatus = action === 'accept' ? 'accepted' : 'rejected'

  await supabaseAdmin
    .from('reschedule_requests')
    .update({ status: newStatus, responded_at: now })
    .eq('id', requestId)

  if (action === 'accept') {
    await supabaseAdmin
      .from('bookings')
      .update({ scheduled_date: req.new_date, start_time: req.new_time, updated_at: now })
      .eq('id', id)
  }

  const responderName = b.customer_id === user.id ? b.customer?.full_name : b.provider?.full_name
  const requesterAuth = await supabaseAdmin.auth.admin.getUserById(req.requested_by)
  const requesterEmail = requesterAuth.data?.user?.email ?? ''

  // Notify requester in-app
  createNotification({
    userId: req.requested_by,
    type: action === 'accept' ? 'reschedule_accepted' : 'reschedule_rejected',
    title: action === 'accept' ? '✅ Tukar Jadual Diterima' : '❌ Tukar Jadual Ditolak',
    message: action === 'accept'
      ? `${responderName} telah menerima permintaan tukar jadual booking #${b.booking_code}.`
      : `${responderName} telah menolak permintaan tukar jadual booking #${b.booking_code}.`,
    actionUrl: `/booking/${id}`,
    data: { bookingId: id },
  }).catch(() => {})

  if (requesterEmail) {
    sendRescheduleResponse({
      to: requesterEmail, responderName,
      bookingCode: b.booking_code, bookingId: id,
      accepted: action === 'accept',
      newDate: req.new_date, newTime: (req.new_time as string).slice(0, 5),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
