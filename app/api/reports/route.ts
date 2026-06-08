import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  reportedUserId: z.string().optional(),
  bookingId: z.string().optional(),
  category: z.enum(['no_show', 'misconduct', 'fraud', 'harassment', 'other']),
  description: z.string().min(10).max(1000),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Data tidak lengkap', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { reportedUserId, bookingId, category, description } = parsed.data

  // Check for duplicate report on same booking
  if (bookingId) {
    const { data: existing } = await supabaseAdmin
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('booking_id', bookingId)
      .maybeSingle()
    if (existing) return NextResponse.json({ message: 'Anda sudah membuat laporan untuk sesi ini' }, { status: 409 })
  }

  const { error } = await supabaseAdmin.from('reports').insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId ?? null,
    booking_id: bookingId ?? null,
    category,
    description,
  })

  if (error) {
    console.error('[reports/POST]', error)
    return NextResponse.json({ message: 'Gagal hantar laporan' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
