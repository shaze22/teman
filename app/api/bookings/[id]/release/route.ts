import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyFundsReleased } from '@/lib/notifications'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_code, customer_id, provider_id, status, payment_status, provider_price, funds_released')
    .eq('id', id)
    .single()

  if (!booking) return NextResponse.json({ message: 'Booking tidak dijumpai' }, { status: 404 })
  if (booking.customer_id !== user.id) return NextResponse.json({ message: 'Hanya pelanggan boleh sahkan selesai' }, { status: 403 })
  if (booking.status !== 'completed') return NextResponse.json({ message: 'Booking belum selesai' }, { status: 400 })
  if (booking.payment_status !== 'paid') return NextResponse.json({ message: 'Pembayaran belum diterima' }, { status: 400 })
  if (booking.funds_released) return NextResponse.json({ message: 'Dana sudah dilepaskan' }, { status: 400 })

  const now = new Date().toISOString()
  const providerNet = parseFloat(String(booking.provider_price)) * 0.85

  // Get current earnings to compute balanceAfter
  const { data: profile } = await supabaseAdmin
    .from('single_mother_profiles')
    .select('id, earnings_total')
    .eq('user_id', booking.provider_id)
    .single()

  const currentEarnings = parseFloat(String(profile?.earnings_total ?? 0))
  const balanceAfter = currentEarnings + providerNet

  // Run all updates
  const [, , walletRes] = await Promise.all([
    // Mark booking as funds released
    supabaseAdmin
      .from('bookings')
      .update({ funds_released: true, funds_released_at: now, updated_at: now })
      .eq('id', id),

    // Update provider total earnings
    profile
      ? supabaseAdmin
          .from('single_mother_profiles')
          .update({ earnings_total: balanceAfter, updated_at: now })
          .eq('id', profile.id)
      : Promise.resolve({ error: null }),

    // Record wallet transaction
    supabaseAdmin.from('wallet_transactions').insert({
      id: crypto.randomUUID(),
      user_id: booking.provider_id,
      type: 'credit',
      amount: providerNet,
      balance_after: balanceAfter,
      reference_type: 'booking',
      reference_id: id,
      description: `Pendapatan booking #${booking.booking_code}`,
      created_at: now,
    }),
  ])

  if (walletRes.error) {
    console.error('[release] wallet insert error:', walletRes.error)
    return NextResponse.json({ message: walletRes.error.message }, { status: 500 })
  }

  // Notify provider
  notifyFundsReleased({
    bookingId: id,
    bookingCode: booking.booking_code,
    providerId: booking.provider_id,
    amount: providerNet,
  }).catch(() => {})

  return NextResponse.json({ success: true, amountReleased: providerNet })
}
