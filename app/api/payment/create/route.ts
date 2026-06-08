import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const schema = z.object({ bookingId: z.string() })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Data tidak sah' }, { status: 400 })

  const { bookingId } = parsed.data

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_code, total_amount, payment_status, customer_id, status, service_type')
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ message: 'Booking tidak dijumpai' }, { status: 404 })
  if (booking.customer_id !== user.id) return NextResponse.json({ message: 'Tiada akses' }, { status: 403 })
  if (booking.payment_status === 'paid') return NextResponse.json({ message: 'Sudah dibayar' }, { status: 400 })
  if (!['pending', 'confirmed', 'in_progress'].includes(booking.status)) {
    return NextResponse.json({ message: 'Status booking tidak sah untuk pembayaran' }, { status: 400 })
  }

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id)
  const email = authUser?.user?.email ?? undefined

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const SERVICE_LABELS: Record<string, string> = {
    job: 'Teman Kerja', food: 'Teman Makan', learning: 'Teman Belajar',
    business: 'Teman Bisnes', ibadah: 'Teman Ibadah', repair: 'Teman Repair',
    riadah: 'Teman Riadah', kombo: 'Teman Kombo',
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const amountSen = Math.round(parseFloat(String(booking.total_amount)) * 100)

  let session: { id: string; url: string | null }
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'fpx', 'grabpay'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'myr',
            unit_amount: amountSen,
            product_data: {
              name: `Booking #${booking.booking_code}`,
              description: SERVICE_LABELS[booking.service_type] ?? booking.service_type,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/payment/result?bookingId=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/booking/${booking.id}`,
      metadata: {
        bookingId: booking.id,
        bookingCode: booking.booking_code,
        userId: user.id,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal cipta sesi pembayaran'
    console.error('[payment/create]', err)
    return NextResponse.json({ message: msg }, { status: 500 })
  }

  await supabaseAdmin.from('payments').insert({
    id: crypto.randomUUID(),
    booking_id: bookingId,
    user_id: user.id,
    amount: booking.total_amount,
    type: 'booking_full',
    status: 'pending',
    payment_method: 'stripe',
    transaction_id: session.id,
    created_at: new Date().toISOString(),
  })

  return NextResponse.json({ billUrl: session.url })
}
