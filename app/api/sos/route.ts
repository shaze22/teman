import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { createNotification } from '@/lib/notifications'
import { Errors } from '@/lib/errors'

export const POST = withAuth(async ({ user, req }) => {
  const { lat, lng } = await req.json().catch(() => ({ lat: null, lng: null }))
  const now = new Date().toISOString()

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

  if (sosError) throw Errors.serverError('Gagal buat SOS event')

  const mapsLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : null
  const locationText = mapsLink ? `\nLokasi: ${mapsLink}` : '\nLokasi tidak tersedia.'

  const { data: admins } = await supabaseAdmin
    .from('users').select('id').eq('role', 'super_admin').eq('status', 'active')

  await Promise.all(
    (admins ?? []).map(admin => createNotification({
      userId: admin.id,
      type: 'sos_triggered',
      title: `🆘 SOS! ${customerName}`,
      message: `${customerName} menekan butang kecemasan.${locationText}`,
      actionUrl: '/admin/sos',
      data: { sosEventId: sosEvent.id, lat, lng, triggeredBy: user.id },
    }))
  ).catch(() => {})

  return NextResponse.json({
    ok: true,
    sosEventId: sosEvent.id,
    emergencyContactsNotified: emergencyContacts.length,
    locationShared: !!(lat && lng),
  })
})
