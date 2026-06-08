import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { data: b } = await supabaseAdmin
    .from('bookings')
    .select('id, status, customer_id, provider_id, booking_code, companion_checkin_at, customer_checkin_at')
    .eq('id', id)
    .single()

  if (!b) return NextResponse.json({ message: 'Booking tidak dijumpai' }, { status: 404 })
  if (!['confirmed', 'in_progress'].includes(b.status)) {
    return NextResponse.json({ message: 'Check-in hanya boleh dilakukan semasa sesi aktif' }, { status: 400 })
  }

  const isProvider = b.provider_id === user.id
  const isCustomer = b.customer_id === user.id
  if (!isProvider && !isCustomer) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const now = new Date().toISOString()
  const col = isProvider ? 'companion_checkin_at' : 'customer_checkin_at'

  if (isProvider && b.companion_checkin_at) return NextResponse.json({ message: 'Anda sudah check-in' }, { status: 400 })
  if (isCustomer && b.customer_checkin_at) return NextResponse.json({ message: 'Anda sudah check-in' }, { status: 400 })

  await supabaseAdmin.from('bookings').update({ [col]: now }).eq('id', id)

  // Notify the other party
  const otherUserId = isProvider ? b.customer_id : b.provider_id
  const role = isProvider ? 'Meal Companion' : 'Pelanggan'
  await createNotification({
    userId: otherUserId,
    type: 'checkin',
    title: `✅ ${role} Sudah Tiba`,
    message: `${role} telah check-in untuk sesi #${b.booking_code}. Selamat menikmati hidangan bersama!`,
    actionUrl: `/booking/${id}`,
    data: { bookingId: id },
  })

  return NextResponse.json({ success: true, checkinAt: now })
}
