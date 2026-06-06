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
  // Window: bookings starting in 20–28 hours from now (runs at 2am MYT → catches next-day sessions)
  const windowStart = new Date(now.getTime() + 20 * 3600 * 1000)
  const windowEnd   = new Date(now.getTime() + 28 * 3600 * 1000)

  const startDate = windowStart.toISOString().slice(0, 10)
  const endDate   = windowEnd.toISOString().slice(0, 10)

  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, booking_code, scheduled_date, start_time, customer_id, provider_id,
      customer:users!bookings_customer_id_fkey(full_name),
      provider:users!bookings_provider_id_fkey(full_name)
    `)
    .in('status', ['confirmed'])
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate)
    .eq('reminder_sent', false)

  if (error) {
    console.error('[cron/reminders]', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  let sent = 0

  for (const b of bookings ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const booking = b as any
    const customerName = booking.customer?.full_name ?? ''
    const providerName = booking.provider?.full_name ?? ''
    const startTime = (booking.start_time as string)?.slice(0, 5) ?? ''

    // Fetch emails
    const [customerAuth, providerAuth] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(booking.customer_id),
      supabaseAdmin.auth.admin.getUserById(booking.provider_id),
    ])
    const customerEmail = customerAuth.data?.user?.email ?? ''
    const providerEmail = providerAuth.data?.user?.email ?? ''

    // In-app notifications
    await Promise.all([
      createNotification({
        userId: booking.customer_id,
        type: 'booking_reminder',
        title: '⏰ Peringatan Sesi Esok',
        message: `Sesi anda dengan ${providerName} akan bermula esok pada ${startTime}.`,
        actionUrl: `/booking/${booking.id}`,
        data: { bookingId: booking.id },
      }),
      createNotification({
        userId: booking.provider_id,
        type: 'booking_reminder',
        title: '⏰ Peringatan Sesi Esok',
        message: `Sesi anda dengan ${customerName} akan bermula esok pada ${startTime}.`,
        actionUrl: `/booking/${booking.id}`,
        data: { bookingId: booking.id },
      }),
    ])

    // Emails (fire and forget)
    if (customerEmail) {
      sendBookingReminder({
        to: customerEmail, name: customerName, otherName: providerName, role: 'customer',
        bookingCode: booking.booking_code, bookingId: booking.id,
        scheduledDate: booking.scheduled_date, startTime,
      }).catch(() => {})
    }
    if (providerEmail) {
      sendBookingReminder({
        to: providerEmail, name: providerName, otherName: customerName, role: 'provider',
        bookingCode: booking.booking_code, bookingId: booking.id,
        scheduledDate: booking.scheduled_date, startTime,
      }).catch(() => {})
    }

    // Mark reminder sent
    await supabaseAdmin.from('bookings').update({ reminder_sent: true }).eq('id', booking.id)
    sent++
  }

  console.log(`[cron/reminders] sent ${sent} reminders`)
  return NextResponse.json({ ok: true, sent })
}
