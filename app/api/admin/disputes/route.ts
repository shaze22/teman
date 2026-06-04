import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

export async function GET() {
  await requireAdmin()

  const { data } = await supabaseAdmin
    .from('disputes')
    .select('id, booking_id, raised_by, reason, status, resolution, admin_notes, created_at, updated_at, resolved_at')
    .order('created_at', { ascending: false })

  if (!data) return NextResponse.json([])

  // Enrich with booking + user info
  const enriched = await Promise.all(data.map(async (d) => {
    const [{ data: booking }, { data: raiser }] = await Promise.all([
      supabaseAdmin.from('bookings').select('booking_code, total_amount, provider_id, customer_id').eq('id', d.booking_id).single(),
      supabaseAdmin.from('users').select('full_name').eq('id', d.raised_by).single(),
    ])
    return {
      ...d,
      bookingCode: booking?.booking_code ?? '',
      totalAmount: parseFloat(String(booking?.total_amount ?? 0)),
      raiserName: raiser?.full_name ?? '',
    }
  }))

  return NextResponse.json(enriched)
}

const patchSchema = z.object({
  status: z.enum(['investigating', 'resolved', 'closed']),
  resolution: z.string().optional(),
  adminNotes: z.string().optional(),
})

export async function PATCH(request: NextRequest) {
  await requireAdmin()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ message: 'ID diperlukan' }, { status: 400 })

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Data tidak sah' }, { status: 400 })

  const now = new Date().toISOString()
  const update: Record<string, unknown> = {
    status: parsed.data.status,
    updated_at: now,
  }
  if (parsed.data.resolution) update.resolution = parsed.data.resolution
  if (parsed.data.adminNotes) update.admin_notes = parsed.data.adminNotes
  if (parsed.data.status === 'resolved' || parsed.data.status === 'closed') update.resolved_at = now

  const { error } = await supabaseAdmin.from('disputes').update(update).eq('id', id)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
