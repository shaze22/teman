import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { cancelBooking } from '@/lib/use-cases/cancel-booking'
import { completeBooking } from '@/lib/use-cases/complete-booking'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyBookingStatusChange } from '@/lib/notifications'
import { sendBookingConfirmedCustomer } from '@/lib/email'

const schema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'in_progress', 'completed']),
  cancellationReason: z.string().optional(),
})

export const PATCH = withAuth(async ({ user, req, params }) => {
  const { id } = params
  const { status, cancellationReason } = await parseBody(req, schema)

  if (status === 'cancelled') {
    const result = await cancelBooking(id, user.id, cancellationReason)
    return NextResponse.json({ success: true, ...result })
  }

  if (status === 'completed') {
    await completeBooking(id, user.id)
    return NextResponse.json({ success: true })
  }

  // confirmed / in_progress — simple status transitions
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select(`
      customer_id, provider_id, booking_code, scheduled_date, total_amount,
      customer:users!bookings_customer_id_fkey(full_name),
      provider:users!bookings_provider_id_fkey(full_name, phone)
    `)
    .eq('id', id)
    .single()

  if (!booking) return NextResponse.json({ message: 'Booking not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = booking as any
  const isProvider = b.provider_id === user.id
  const isCustomer = b.customer_id === user.id
  if (!isProvider && !isCustomer) return NextResponse.json({ message: 'Access denied' }, { status: 403 })

  const now = new Date().toISOString()
  const update: Record<string, unknown> = { status, updated_at: now }
  if (status === 'confirmed') update.confirmed_at = now
  if (status === 'in_progress') update.checked_in_at = now

  await supabaseAdmin.from('bookings').update(update).eq('id', id)

  const [customerAuth, providerAuth] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(b.customer_id),
    supabaseAdmin.auth.admin.getUserById(b.provider_id),
  ])
  const customerEmail = customerAuth.data?.user?.email ?? ''
  const customerName = b.customer?.full_name ?? ''
  const providerName = b.provider?.full_name ?? ''

  notifyBookingStatusChange({
    bookingId: id, bookingCode: b.booking_code, status,
    customerId: b.customer_id, providerId: b.provider_id,
    customerName, providerName,
  }).catch(() => {})

  if (status === 'confirmed' && customerEmail) {
    sendBookingConfirmedCustomer({
      to: customerEmail, customerName, providerName,
      providerPhone: b.provider?.phone ?? undefined,
      bookingCode: b.booking_code, bookingId: id,
      scheduledDate: b.scheduled_date,
      totalAmount: parseFloat(String(b.total_amount ?? 0)),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
})
