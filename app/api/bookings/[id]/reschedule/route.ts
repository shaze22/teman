import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { createNotification } from '@/lib/notifications'
import { sendRescheduleRequest, sendRescheduleResponse } from '@/lib/email'
import { Errors } from '@/lib/errors'

const createSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newTime: z.string().regex(/^\d{2}:\d{2}$/),
  note: z.string().max(300).optional(),
})

const respondSchema = z.object({
  requestId: z.string(),
  action: z.enum(['accept', 'reject']),
})

export const POST = withAuth(async ({ user, req, params }) => {
  const { id } = params
  const { newDate, newTime, note } = await parseBody(req, createSchema)

  const { data: booking } = await supabaseAdmin.from('bookings')
    .select(`id, booking_code, status, customer_id, provider_id,
      customer:users!bookings_customer_id_fkey(full_name),
      provider:users!bookings_provider_id_fkey(full_name)`)
    .eq('id', id).single()

  if (!booking) throw Errors.notFound('Booking')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = booking as any
  if (b.customer_id !== user.id && b.provider_id !== user.id) throw Errors.forbidden()
  if (!['pending', 'confirmed'].includes(b.status))
    throw Errors.badRequest('Tidak boleh reschedule pada status ini')

  const { data: existing } = await supabaseAdmin.from('reschedule_requests')
    .select('id').eq('booking_id', id).eq('status', 'pending').single()
  if (existing) throw Errors.conflict('Masih ada permintaan belum dijawab')

  const { data: req2, error } = await supabaseAdmin.from('reschedule_requests')
    .insert({ booking_id: id, requested_by: user.id, new_date: newDate, new_time: newTime, note: note ?? null })
    .select().single()
  if (error) throw Errors.serverError(error.message)

  const isCustomer = b.customer_id === user.id
  const requesterName = isCustomer ? b.customer?.full_name : b.provider?.full_name
  const otherPartyId = isCustomer ? b.provider_id : b.customer_id
  const otherName = isCustomer ? b.provider?.full_name : b.customer?.full_name

  createNotification({
    userId: otherPartyId, type: 'reschedule_request',
    title: '📅 Permintaan Tukar Jadual',
    message: `${requesterName} meminta tukar jadual booking #${b.booking_code} ke ${newDate} ${newTime}.`,
    actionUrl: `/booking/${id}`, data: { bookingId: id, requestId: req2.id },
  }).catch(() => {})

  const otherAuth = await supabaseAdmin.auth.admin.getUserById(otherPartyId)
  const otherEmail = otherAuth.data?.user?.email ?? ''
  if (otherEmail) {
    sendRescheduleRequest({
      to: otherEmail, requesterName, otherName,
      bookingCode: b.booking_code, bookingId: id, newDate, newTime,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, requestId: req2.id })
})

export const PATCH = withAuth(async ({ user, req, params }) => {
  const { id } = params
  const { requestId, action } = await parseBody(req, respondSchema)

  const { data: reschedReq } = await supabaseAdmin.from('reschedule_requests')
    .select('id, booking_id, requested_by, new_date, new_time, status')
    .eq('id', requestId).eq('booking_id', id).single()
  if (!reschedReq) throw Errors.notFound('Permintaan')
  if (reschedReq.status !== 'pending') throw Errors.badRequest('Permintaan sudah dijawab')

  const { data: booking } = await supabaseAdmin.from('bookings')
    .select(`id, booking_code, customer_id, provider_id,
      customer:users!bookings_customer_id_fkey(full_name),
      provider:users!bookings_provider_id_fkey(full_name)`)
    .eq('id', id).single()
  if (!booking) throw Errors.notFound('Booking')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = booking as any

  if (user.id === reschedReq.requested_by) throw Errors.forbidden('Tidak boleh jawab permintaan sendiri')
  if (b.customer_id !== user.id && b.provider_id !== user.id) throw Errors.forbidden()

  const now = new Date().toISOString()
  await supabaseAdmin.from('reschedule_requests')
    .update({ status: action === 'accept' ? 'accepted' : 'rejected', responded_at: now })
    .eq('id', requestId)

  if (action === 'accept') {
    await supabaseAdmin.from('bookings')
      .update({ scheduled_date: reschedReq.new_date, start_time: reschedReq.new_time, updated_at: now })
      .eq('id', id)
  }

  const responderName = b.customer_id === user.id ? b.customer?.full_name : b.provider?.full_name
  const requesterAuth = await supabaseAdmin.auth.admin.getUserById(reschedReq.requested_by)
  const requesterEmail = requesterAuth.data?.user?.email ?? ''

  createNotification({
    userId: reschedReq.requested_by,
    type: action === 'accept' ? 'reschedule_accepted' : 'reschedule_rejected',
    title: action === 'accept' ? '✅ Tukar Jadual Diterima' : '❌ Tukar Jadual Ditolak',
    message: action === 'accept'
      ? `${responderName} telah menerima permintaan tukar jadual booking #${b.booking_code}.`
      : `${responderName} telah menolak permintaan tukar jadual booking #${b.booking_code}.`,
    actionUrl: `/booking/${id}`, data: { bookingId: id },
  }).catch(() => {})

  if (requesterEmail) {
    sendRescheduleResponse({
      to: requesterEmail, responderName,
      bookingCode: b.booking_code, bookingId: id,
      accepted: action === 'accept',
      newDate: reschedReq.new_date, newTime: (reschedReq.new_time as string).slice(0, 5),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
})
