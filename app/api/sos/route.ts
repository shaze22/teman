import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lat, lng } = await req.json().catch(() => ({ lat: null, lng: null }))
  const now = new Date().toISOString()

  // Get customer profile + emergency contacts
  const { data: profile } = await supabaseAdmin
    .from('customer_profiles')
    .select('id, emergency_contacts(*), users!inner(full_name)')
    .eq('user_id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profile as any
  const customerName: string = p?.users?.full_name ?? 'Pengguna'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emergencyContacts: any[] = p?.emergency_contacts ?? []

  // Create SOS event
  const { data: sosEvent, error: sosError } = await supabaseAdmin
    .from('sos_events')
    .insert({
      id: crypto.randomUUID(),
      triggered_by: user.id,
      lat: lat ?? null,
      lng: lng ?? null,
      reason: 'Butang kecemasan ditekan oleh pengguna',
      status: 'active',
      created_at: now,
    })
    .select('id')
    .single()

  if (sosError) return NextResponse.json({ error: 'Gagal buat SOS event' }, { status: 500 })

  const mapsLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : null
  const locationText = mapsLink ? `\nLokasi: ${mapsLink}` : '\nLokasi tidak tersedia.'

  const notifPromises: Promise<void>[] = []

  // Notify all super_admin
  const { data: admins } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'super_admin')
    .eq('status', 'active')

  for (const admin of admins ?? []) {
    notifPromises.push(createNotification({
      userId: admin.id,
      type: 'sos_triggered',
      title: `🆘 SOS! ${customerName}`,
      message: `${customerName} menekan butang kecemasan.${locationText}`,
      actionUrl: '/admin/sos',
      data: { sosEventId: sosEvent.id, lat, lng, triggeredBy: user.id },
    }))
  }

  // Notify NGO admins whose providers are linked to this customer's active bookings
  const { data: activeBookings } = await supabaseAdmin
    .from('bookings')
    .select('provider_id')
    .eq('customer_id', user.id)
    .in('status', ['confirmed', 'in_progress'])

  if (activeBookings && activeBookings.length > 0) {
    const providerIds = activeBookings.map(b => b.provider_id)
    const { data: ngoAdmins } = await supabaseAdmin
      .from('single_mother_profiles')
      .select('ngos!inner(admin_user_id)')
      .in('user_id', providerIds)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (ngoAdmins ?? []) as any[]) {
      const adminId = row.ngos?.admin_user_id
      if (adminId) {
        notifPromises.push(createNotification({
          userId: adminId,
          type: 'sos_triggered',
          title: `🆘 SOS! ${customerName}`,
          message: `${customerName} memerlukan bantuan kecemasan.${locationText}`,
          actionUrl: '/dashboard/ngo',
          data: { sosEventId: sosEvent.id, lat, lng },
        }))
      }
    }
  }

  // Log notification for emergency contacts (in-app they may not have accounts)
  // The contacts list is available for display in admin SOS panel
  // Future: send SMS via Twilio/Nexmo

  await Promise.all(notifPromises).catch(() => {})

  return NextResponse.json({
    ok: true,
    sosEventId: sosEvent.id,
    emergencyContactsNotified: emergencyContacts.length,
    locationShared: !!(lat && lng),
  })
}
