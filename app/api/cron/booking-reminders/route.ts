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
  // Compare full datetime (date + time) to avoid boundary-date false matches
  const w24Start = new Date(now.getTime() + 20 * 3_600_000).toISOString()
  const w24End   = new Date(now.getTime() + 28 * 3_600_000).toISOString()

  const { data: bookings24 } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_code, scheduled_date, start_time, customer_id, provider_id, customer:users!bookings_customer_id_fkey(full_name), provider:users!bookings_provider_id_fkey(full_name)')
    .in('status', ['confirmed'])
    // Filter on the combined scheduled_date+start_time range
    .gte('scheduled_date', w24Start.slice(0, 10))
    .lte('scheduled_date', w24End.slice(0, 10))
    .eq('reminder_sent', false)
    .limit(200)

  if ((bookings24 ?? []).length > 0) {
    // Batch-fetch all auth emails in two calls instead of 2×N calls
    const customerIds = [...new Set((bookings24 ?? []).map((b: any) => b.customer_id as string))]
    const providerIds = [...new Set((bookings24 ?? []).map((b: any) => b.provider_id as string))]

    const [customerEmails, providerEmails] = await Promise.all([
      batchGetEmails(customerIds),
      batchGetEmails(providerIds),
    ])

    for (const b of bookings24 ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const booking = b as any
      const customerName = booking.customer?.full_name ?? ''
      const providerName = booking.provider?.full_name ?? ''
      const startTime = (booking.start_time as string)?.slice(0, 5) ?? ''

      // Verify this booking's datetime actually falls in the 20-28h window
      const bookingDt = new Date(`${booking.scheduled_date}T${booking.start_time ?? '00:00'}`)
      const hoursUntil = (bookingDt.getTime() - now.getTime()) / 3_600_000
      if (hoursUntil < 20 || hoursUntil > 28) continue

      await Promise.all([
        createNotification({ userId: booking.customer_id, type: 'booking_reminder', title: '⏰ Session Reminder', message: `Your session with ${providerName} starts tomorrow at ${startTime}.`, actionUrl: `/booking/${booking.id}`, data: { bookingId: booking.id } }),
        createNotification({ userId: booking.provider_id, type: 'booking_reminder', title: '⏰ Session Reminder', message: `Your session with ${customerName} starts tomorrow at ${startTime}.`, actionUrl: `/booking/${booking.id}`, data: { bookingId: booking.id } }),
      ])

      const customerEmail = customerEmails[booking.customer_id] ?? ''
      const providerEmail = providerEmails[booking.provider_id] ?? ''
      if (customerEmail) sendBookingReminder({ to: customerEmail, name: customerName, otherName: providerName, role: 'customer', bookingCode: booking.booking_code, bookingId: booking.id, scheduledDate: booking.scheduled_date, startTime }).catch(() => {})
      if (providerEmail) sendBookingReminder({ to: providerEmail, name: providerName, otherName: customerName, role: 'provider', bookingCode: booking.booking_code, bookingId: booking.id, scheduledDate: booking.scheduled_date, startTime }).catch(() => {})
      await supabaseAdmin.from('bookings').update({ reminder_sent: true }).eq('id', booking.id)
      sent24++
    }
  }

  // --- 2h reminders: bookings starting in 1.5–2.5 hours ---
  const w2Start = new Date(now.getTime() + 1.5 * 3_600_000).toISOString()
  const w2End   = new Date(now.getTime() + 2.5 * 3_600_000).toISOString()

  const { data: bookings2h } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_code, scheduled_date, start_time, customer_id, provider_id, customer:users!bookings_customer_id_fkey(full_name), provider:users!bookings_provider_id_fkey(full_name)')
    .in('status', ['confirmed'])
    .eq('scheduled_date', w2Start.slice(0, 10))
    .gte('start_time', w2Start.slice(11, 16))
    .lte('start_time', w2End.slice(11, 16))
    .eq('reminder_2h_sent', false)
    .limit(200)

  if ((bookings2h ?? []).length > 0) {
    const customerIds2 = [...new Set((bookings2h ?? []).map((b: any) => b.customer_id as string))]
    const providerIds2 = [...new Set((bookings2h ?? []).map((b: any) => b.provider_id as string))]

    const [customerEmails2, providerEmails2] = await Promise.all([
      batchGetEmails(customerIds2),
      batchGetEmails(providerIds2),
    ])

    for (const b of bookings2h ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const booking = b as any
      const customerName = booking.customer?.full_name ?? ''
      const providerName = booking.provider?.full_name ?? ''
      const startTime = (booking.start_time as string)?.slice(0, 5) ?? ''

      await Promise.all([
        createNotification({ userId: booking.customer_id, type: 'booking_reminder', title: '⏰ Session in 2 Hours!', message: `Your session with ${providerName} starts at ${startTime} today. Be ready!`, actionUrl: `/booking/${booking.id}`, data: { bookingId: booking.id } }),
        createNotification({ userId: booking.provider_id, type: 'booking_reminder', title: '⏰ Session in 2 Hours!', message: `Your session with ${customerName} starts at ${startTime} today. Be ready!`, actionUrl: `/booking/${booking.id}`, data: { bookingId: booking.id } }),
      ])
      await supabaseAdmin.from('bookings').update({ reminder_2h_sent: true }).eq('id', booking.id)
      sent2++

      const customerEmail2 = customerEmails2[booking.customer_id] ?? ''
      const providerEmail2 = providerEmails2[booking.provider_id] ?? ''
      if (customerEmail2) sendBookingReminder({ to: customerEmail2, name: customerName, otherName: providerName, role: 'customer', bookingCode: booking.booking_code, bookingId: booking.id, scheduledDate: booking.scheduled_date, startTime }).catch(() => {})
      if (providerEmail2) sendBookingReminder({ to: providerEmail2, name: providerName, otherName: customerName, role: 'provider', bookingCode: booking.booking_code, bookingId: booking.id, scheduledDate: booking.scheduled_date, startTime }).catch(() => {})
    }
  }

  console.log(`[cron/reminders] 24h: ${sent24}, 2h: ${sent2}`)
  return NextResponse.json({ ok: true, sent24, sent2 })
}

// Batch fetch auth emails for a list of user IDs — avoids N+1 auth API calls
async function batchGetEmails(userIds: string[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {}
  if (userIds.length === 0) return map

  // Supabase Auth admin API does not support bulk fetch — use users table email join
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .in('id', userIds)

  for (const u of data ?? []) {
    if (u.email) map[u.id] = u.email
  }
  return map
}
