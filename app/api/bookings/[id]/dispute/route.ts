import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({ reason: z.string().min(10).max(1000) })

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Sila nyatakan sebab aduan (min 10 aksara)' }, { status: 400 })

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, customer_id, status, funds_released, funds_released_at')
    .eq('id', id)
    .single()

  if (!booking) return NextResponse.json({ message: 'Booking tidak dijumpai' }, { status: 404 })
  if (booking.customer_id !== user.id) return NextResponse.json({ message: 'Hanya pelanggan boleh buka aduan' }, { status: 403 })
  if (!booking.funds_released) return NextResponse.json({ message: 'Dana belum dilepaskan' }, { status: 400 })

  // 48-hour window
  const releasedAt = new Date(booking.funds_released_at as string)
  const hoursElapsed = (Date.now() - releasedAt.getTime()) / 3_600_000
  if (hoursElapsed > 48) return NextResponse.json({ message: 'Tempoh aduan 48 jam telah tamat' }, { status: 400 })

  // Check no existing open dispute
  const { data: existing } = await supabaseAdmin
    .from('disputes')
    .select('id')
    .eq('booking_id', id)
    .single()
  if (existing) return NextResponse.json({ message: 'Aduan sudah wujud untuk booking ini' }, { status: 400 })

  const now = new Date().toISOString()
  await supabaseAdmin.from('disputes').insert({
    id: crypto.randomUUID(),
    booking_id: id,
    raised_by: user.id,
    reason: parsed.data.reason,
    status: 'open',
    created_at: now,
    updated_at: now,
  })

  // Notify admin via notification to all admins (skip for now, just insert)
  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('disputes')
    .select('id, status, reason, resolution, created_at')
    .eq('booking_id', id)
    .single()

  return NextResponse.json(data ?? null)
}
