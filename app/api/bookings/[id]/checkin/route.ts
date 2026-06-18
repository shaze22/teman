import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { createNotification } from '@/lib/notifications'
import { Errors } from '@/lib/errors'

export const POST = withAuth(async ({ user, params }) => {
  const { id } = params

  const { data: b } = await supabaseAdmin
    .from('bookings')
    .select('id, status, customer_id, provider_id, booking_code, companion_checkin_at, customer_checkin_at')
    .eq('id', id).single()

  if (!b) throw Errors.notFound('Booking')
  if (!['confirmed', 'in_progress'].includes(b.status))
    throw Errors.badRequest('Check-in hanya boleh dilakukan semasa sesi aktif')

  const isProvider = b.provider_id === user.id
  const isCustomer = b.customer_id === user.id
  if (!isProvider && !isCustomer) throw Errors.forbidden()

  if (isProvider && b.companion_checkin_at) throw Errors.badRequest('Anda sudah check-in')
  if (isCustomer && b.customer_checkin_at) throw Errors.badRequest('Anda sudah check-in')

  const now = new Date().toISOString()
  const col = isProvider ? 'companion_checkin_at' : 'customer_checkin_at'
  await supabaseAdmin.from('bookings').update({ [col]: now }).eq('id', id)

  const otherUserId = isProvider ? b.customer_id : b.provider_id
  const role = isProvider ? 'Provider' : 'Pelanggan'
  await createNotification({
    userId: otherUserId, type: 'checkin',
    title: `✅ ${role} Sudah Tiba`,
    message: `${role} telah check-in untuk sesi #${b.booking_code}.`,
    actionUrl: `/booking/${id}`, data: { bookingId: id },
  })

  return NextResponse.json({ success: true, checkinAt: now })
})
