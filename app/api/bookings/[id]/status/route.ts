import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { notifyBookingStatusChange } from '@/lib/notifications'
import {
  sendBookingConfirmedCustomer,
  sendBookingCancelledBoth,
  sendBookingCompletedCustomer,
} from '@/lib/email'

const schema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'in_progress', 'completed']),
  cancellationReason: z.string().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Data tidak sah' }, { status: 400 })

  const { status, cancellationReason } = parsed.data

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select(`
      customer_id, provider_id, status, booking_code, scheduled_date, total_amount, provider_price,
      customer:users!bookings_customer_id_fkey(full_name),
      provider:users!bookings_provider_id_fkey(full_name)
    `)
    .eq('id', id)
    .single()

  if (!booking) return NextResponse.json({ message: 'Booking tidak dijumpai' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = booking as any
  const isProvider = b.provider_id === user.id
  const isCustomer = b.customer_id === user.id
  if (!isProvider && !isCustomer) return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })

  const now = new Date().toISOString()
  const update: Record<string, unknown> = { status, updated_at: now }

  if (status === 'confirmed') update.confirmed_at = now
  if (status === 'in_progress') update.checked_in_at = now
  if (status === 'completed') { update.checked_out_at = now; update.completed_at = now }
  if (status === 'cancelled') {
    update.cancelled_at = now
    update.cancelled_by = user.id
    update.cancellation_reason = cancellationReason ?? null
  }

  const { error } = await supabaseAdmin.from('bookings').update(update).eq('id', id)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  // Fetch emails for notifications
  const [customerAuth, providerAuth] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(b.customer_id),
    supabaseAdmin.auth.admin.getUserById(b.provider_id),
  ])
  const customerEmail = customerAuth.data?.user?.email ?? ''
  const providerEmail = providerAuth.data?.user?.email ?? ''
  const customerName = b.customer?.full_name ?? ''
  const providerName = b.provider?.full_name ?? ''

  // Fire-and-forget: in-app + email
  notifyBookingStatusChange({
    bookingId: id, bookingCode: b.booking_code, status,
    customerId: b.customer_id, providerId: b.provider_id,
    customerName, providerName,
  }).catch(() => {})

  if (status === 'confirmed' && customerEmail) {
    sendBookingConfirmedCustomer({
      to: customerEmail, customerName, providerName,
      bookingCode: b.booking_code, bookingId: id,
      scheduledDate: b.scheduled_date,
      totalAmount: parseFloat(String(b.total_amount ?? 0)),
    }).catch(() => {})
  }

  if (status === 'cancelled') {
    const cancelledBy = isCustomer ? 'customer' : 'provider'
    if (customerEmail) {
      sendBookingCancelledBoth({
        to: customerEmail, name: customerName, otherName: providerName,
        bookingCode: b.booking_code, bookingId: id,
        scheduledDate: b.scheduled_date, cancelledBy,
      }).catch(() => {})
    }
    if (providerEmail) {
      sendBookingCancelledBoth({
        to: providerEmail, name: providerName, otherName: customerName,
        bookingCode: b.booking_code, bookingId: id,
        scheduledDate: b.scheduled_date, cancelledBy,
      }).catch(() => {})
    }
  }

  if (status === 'completed' && customerEmail) {
    sendBookingCompletedCustomer({
      to: customerEmail, customerName, providerName,
      bookingCode: b.booking_code, bookingId: id,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
