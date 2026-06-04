import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { summarizeReviews } from '@/lib/gemini'
import { z } from 'zod'

const Schema = z.object({ providerId: z.string() })

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'providerId diperlukan' }, { status: 400 })

  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('rating, comment')
    .eq('provider_id', parsed.data.providerId)
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!reviews || reviews.length === 0) {
    return NextResponse.json({ summary: 'Belum ada ulasan untuk provider ini.' })
  }

  try {
    const summary = await summarizeReviews(reviews as { rating: number; comment: string }[])
    return NextResponse.json({ summary, count: reviews.length })
  } catch {
    return NextResponse.json({ error: 'AI tidak tersedia.' }, { status: 500 })
  }
}
