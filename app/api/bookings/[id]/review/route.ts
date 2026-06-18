import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { notifyReviewReceived } from '@/lib/notifications'
import { Errors } from '@/lib/errors'

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

export const POST = withAuth(async ({ user, req, params }) => {
  const { id } = params
  const { rating, comment } = await parseBody(req, schema)

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('customer_id, provider_id, status, customer:users!bookings_customer_id_fkey(full_name)')
    .eq('id', id).single()

  if (!booking) throw Errors.notFound('Booking')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = booking as any
  if (b.customer_id !== user.id) throw Errors.forbidden('Only the customer can leave a review')
  if (b.status !== 'completed') throw Errors.badRequest('Booking is not completed')

  const { data: existing } = await supabaseAdmin.from('reviews').select('id').eq('booking_id', id).single()
  if (existing) throw Errors.conflict('Review already submitted')

  const now = new Date().toISOString()
  const { error: reviewError } = await supabaseAdmin.from('reviews').insert({
    id: crypto.randomUUID(), booking_id: id,
    reviewer_id: user.id, reviewee_id: b.provider_id,
    rating, comment: comment ?? null, created_at: now,
  })
  if (reviewError) throw Errors.serverError(reviewError.message)

  const { data: allReviews } = await supabaseAdmin
    .from('reviews').select('rating')
    .eq('reviewee_id', b.provider_id)
    .order('created_at', { ascending: false }).limit(1000)

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    await supabaseAdmin.from('provider_profiles').update({
      rating_avg: parseFloat(avg.toFixed(1)), total_reviews: allReviews.length, updated_at: now,
    }).eq('user_id', b.provider_id)
  }

  notifyReviewReceived({
    providerId: b.provider_id, customerName: b.customer?.full_name ?? '',
    rating, bookingId: id,
  }).catch(() => {})

  return NextResponse.json({ success: true })
})
