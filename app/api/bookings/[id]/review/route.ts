import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { notifyReviewReceived } from '@/lib/notifications'

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Data tidak sah' }, { status: 400 })

  const { rating, comment } = parsed.data

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('customer_id, provider_id, status, customer:users!bookings_customer_id_fkey(full_name)')
    .eq('id', id)
    .single()

  if (!booking) return NextResponse.json({ message: 'Booking tidak dijumpai' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = booking as any
  if (b.customer_id !== user.id) return NextResponse.json({ message: 'Hanya pelanggan boleh beri ulasan' }, { status: 403 })
  if (b.status !== 'completed') return NextResponse.json({ message: 'Booking belum selesai' }, { status: 400 })

  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('booking_id', id)
    .single()
  if (existing) return NextResponse.json({ message: 'Ulasan sudah diberikan' }, { status: 409 })

  const now = new Date().toISOString()

  const { error: reviewError } = await supabaseAdmin.from('reviews').insert({
    id: crypto.randomUUID(),
    booking_id: id,
    reviewer_id: user.id,
    reviewee_id: b.provider_id,
    rating,
    comment: comment ?? null,
    created_at: now,
  })
  if (reviewError) return NextResponse.json({ message: reviewError.message }, { status: 500 })

  const { data: allReviews } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', b.provider_id)

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    await supabaseAdmin
      .from('single_mother_profiles')
      .update({ rating_avg: parseFloat(avg.toFixed(1)), total_reviews: allReviews.length, updated_at: now })
      .eq('user_id', b.provider_id)
  }

  notifyReviewReceived({
    providerId: b.provider_id,
    customerName: b.customer?.full_name ?? '',
    rating,
    bookingId: id,
  }).catch(() => {})

  return NextResponse.json({ success: true })
}
