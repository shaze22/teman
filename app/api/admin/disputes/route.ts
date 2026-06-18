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

  if (!data || data.length === 0) return NextResponse.json([])

  // Batch fetch related records to avoid N+1
  const bookingIds = [...new Set(data.map(d => d.booking_id).filter(Boolean))]
  const raiserIds = [...new Set(data.map(d => d.raised_by).filter(Boolean))]

  const [{ data: bookings }, { data: raisers }] = await Promise.all([
    supabaseAdmin.from('bookings').select('id, booking_code, total_amount').in('id', bookingIds),
    supabaseAdmin.from('users').select('id, full_name').in('id', raiserIds),
  ])

  const bookingMap = Object.fromEntries((bookings ?? []).map(b => [b.id, b]))
  const raiserMap = Object.fromEntries((raisers ?? []).map(u => [u.id, u]))

  const enriched = data.map(d => ({
    ...d,
    bookingCode: bookingMap[d.booking_id]?.booking_code ?? '',
    totalAmount: parseFloat(String(bookingMap[d.booking_id]?.total_amount ?? 0)),
    raiserName: raiserMap[d.raised_by]?.full_name ?? '',
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
  if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 })

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Invalid data' }, { status: 400 })

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
