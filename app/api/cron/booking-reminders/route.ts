import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { sendBookingReminder } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let sent24 = 0
  let sent2 = 0

  // --- 24h reminders: bookings starting in 20–28 hours ---
  const w24Start = new Date(now.getTime() + 20 * 3600 * 1000).toISOString().slice(0, 10)
  const w24End   = new Date(now.getTime() + 28 * 3600 * 1000).toISOString().slice(0, 10)

  const { data: bookings24 } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_code, scheduled_date, start_time, customer_id, provider_id, customer:users!bookings_customer_id_fkey(full_name), provider:users!bookings_provider_id_fkey(full_name)')
    .in('status', ['confirmed'])
    .gte('scheduled_date', w24Start)
    .lte('scheduled_date', w24End)
    .eq('reminder_sent', false)

  for (const b of bookings24 ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const booking = b as any
    const customerName = booking.customer?.full_name ?? ''
    const providerName = booking.provider?.full_name ?? ''
    const startTime = (booking.start_time as string)?.slice(0, 5) ?? ''
    const [customerAuth, providerAuth] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(booking.customer_id),
      supabaseAdmin.auth.admin.getUserById(booking.provider_id),
    ])
    await Promise.all([
      createNotification({ userId: booking.customer_id, type: 'booking_reminder', title: '⏰ Peringatan Sesi Esok', message: `Sesi anda dengan ${providerName} akan bermula esok pada ${startTime}.`, actionUrl: `/booking/${booking.id}`, data: { bookingId: booking.id } }),
      createNotification({ userId: booking.provider_id, type: 'booking_reminder', title: '⏰ Peringatan Sesi Esok', message: `Sesi anda dengan ${customerName} akan bermula esok pada ${startTime}.`, actionUrl: `/booking/${booking.id}`, data: { bookingId: booking.id } }),
    ])
    const customerEmail = customerAuth.data?.user?.email ?? ''
    const providerEmail = providerAuth.data?.user?.email ?? ''
    if (customerEmail) sendBookingReminder({ to: customerEmail, name: customerName, otherName: providerName, role: 'customer', bookingCode: booking.booking_code, bookingId: booking.id, scheduledDate: booking.scheduled_date, startTime }).catch(() => {})
    if (providerEmail) sendBookingReminder({ to: providerEmail, name: providerName, otherName: customerName, role: 'provider', bookingCode: booking.booking_code, bookingId: booking.id, scheduledDate: booking.scheduled_date, startTime }).catch(() => {})
    await supabaseAdmin.from('bookings').update({ reminder_sent: true }).eq('id', booking.id)
    sent24++
  }

  // --- 2h reminders: bookings starting in 1.5–2.5 hours ---
  const w2Start = new Date(now.getTime() + 1.5 * 3600 * 1000).toISOString().slice(0, 10)
  const w2End   = new Date(now.getTime() + 2.5 * 3600 * 1000).toISOString().slice(0, 10)
  const timeNowPlus90  = new Date(now.getTime() + 1.5 * 3600 * 1000).toTimeString().slice(0, 5)
  const timeNowPlus150 = new Date(now.getTime() + 2.5 * 3600 * 1000).toTimeString().slice(0, 5)

  const { data: bookings2h } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_code, scheduled_date, start_time, customer_id, provider_id, customer:users!bookings_customer_id_fkey(full_name), provider:users!bookings_provider_id_fkey(full_name)')
    .in('status', ['confirmed'])
    .gte('scheduled_date', w2Start)
    .lte('scheduled_date', w2End)
    .gte('start_time', timeNowPlus90)
    .lte('start_time', timeNowPlus150)
    .eq('reminder_2h_sent', false)

  for (const b of bookings2h ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const booking = b as any
    const customerName = booking.customer?.full_name ?? ''
    const providerName = booking.provider?.full_name ?? ''
    const startTime = (booking.start_time as string)?.slice(0, 5) ?? ''
    await Promise.all([
      createNotification({ userId: booking.customer_id, type: 'booking_reminder', title: '⏰ Sesi Dalam 2 Jam!', message: `Sesi anda dengan ${providerName} akan bermula pada ${startTime} hari ini. Pastikan anda bersedia!`, actionUrl: `/booking/${booking.id}`, data: { bookingId: booking.id } }),
      createNotification({ userId: booking.provider_id, type: 'booking_reminder', title: '⏰ Sesi Dalam 2 Jam!', message: `Sesi anda dengan ${customerName} akan bermula pada ${startTime} hari ini. Pastikan anda bersedia!`, actionUrl: `/booking/${booking.id}`, data: { bookingId: booking.id } }),
    ])
    await supabaseAdmin.from('bookings').update({ reminder_2h_sent: true }).eq('id', booking.id)
    sent2++
  }

  console.log(`[cron/reminders] 24h: ${sent24}, 2h: ${sent2}`)
  return NextResponse.json({ ok: true, sent24, sent2 })
}
