import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { Errors } from '@/lib/errors'

const schema = z.object({
  reportedUserId: z.string().optional(),
  bookingId: z.string().optional(),
  category: z.enum(['no_show', 'misconduct', 'fraud', 'harassment', 'other']),
  description: z.string().min(10).max(1000),
})

export const POST = withAuth(async ({ user, req }) => {
  const { reportedUserId, bookingId, category, description } = await parseBody(req, schema)

  if (bookingId) {
    const { data: existing } = await supabaseAdmin.from('reports').select('id')
      .eq('reporter_id', user.id).eq('booking_id', bookingId).maybeSingle()
    if (existing) throw Errors.conflict('Anda sudah membuat laporan untuk sesi ini')
  }

  const { error } = await supabaseAdmin.from('reports').insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId ?? null,
    booking_id: bookingId ?? null,
    category, description,
  })
  if (error) throw Errors.serverError('Gagal hantar laporan')

  return NextResponse.json({ success: true })
})
