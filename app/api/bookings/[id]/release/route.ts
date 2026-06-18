import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyFundsReleased } from '@/lib/notifications'
import { getProviderAmount } from '@/lib/services'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_code, customer_id, provider_id, status, payment_status, provider_price, service_type, funds_released')
    .eq('id', id)
    .single()

  if (!booking) return NextResponse.json({ message: 'Booking not found' }, { status: 404 })
  if (booking.customer_id !== user.id) return NextResponse.json({ message: 'Only the customer can release funds' }, { status: 403 })
  if (booking.status !== 'completed') return NextResponse.json({ message: 'Booking is not completed' }, { status: 400 })
  if (booking.payment_status !== 'paid') return NextResponse.json({ message: 'Payment not received' }, { status: 400 })
  if (booking.funds_released) return NextResponse.json({ message: 'Funds already released' }, { status: 400 })

  const now = new Date().toISOString()
  const providerNet = getProviderAmount(booking.service_type, parseFloat(String(booking.provider_price)))

  // Get current wallet balance for balance_after calculation
  const { data: lastTx } = await supabaseAdmin
    .from('wallet_transactions')
    .select('balance_after')
    .eq('user_id', booking.provider_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const balanceAfter = parseFloat(String(lastTx?.balance_after ?? 0)) + providerNet

  const [releaseRes, walletRes] = await Promise.all([
    supabaseAdmin
      .from('bookings')
      .update({ funds_released: true, funds_released_at: now, updated_at: now })
      .eq('id', id),
    supabaseAdmin.from('wallet_transactions').insert({
      id: crypto.randomUUID(),
      user_id: booking.provider_id,
      type: 'credit',
      amount: providerNet,
      balance_after: balanceAfter,
      reference_type: 'booking',
      reference_id: id,
      description: `Earnings from booking #${booking.booking_code}`,
      created_at: now,
    }),
  ])

  if (releaseRes.error || walletRes.error) {
    console.error('[release] DB error:', releaseRes.error ?? walletRes.error)
    return NextResponse.json({ message: 'Failed to release funds' }, { status: 500 })
  }

  // Update denormalized earnings on provider_profiles (non-fatal)
  void supabaseAdmin.from('provider_profiles')
    .update({ earnings_total: balanceAfter, updated_at: now })
    .eq('user_id', booking.provider_id)

  notifyFundsReleased({
    bookingId: id,
    bookingCode: booking.booking_code,
    providerId: booking.provider_id,
    amount: providerNet,
  }).catch(() => {})

  return NextResponse.json({ success: true, amountReleased: providerNet })
}
