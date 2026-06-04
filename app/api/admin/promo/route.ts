import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  code: z.string().min(2).max(20),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  minAmount: z.number().min(0).default(0),
  maxUses: z.number().int().positive().nullable().optional(),
  validUntil: z.string().nullable().optional(),
})

export async function GET() {
  await requireAdmin()
  const { data } = await supabaseAdmin.from('promo_codes').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  await requireAdmin()
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Data tidak sah' }, { status: 400 })
  const d = parsed.data

  const { error } = await supabaseAdmin.from('promo_codes').insert({
    id: crypto.randomUUID(),
    code: d.code.toUpperCase(),
    discount_type: d.discountType,
    discount_value: d.discountValue,
    min_amount: d.minAmount,
    max_uses: d.maxUses ?? null,
    valid_until: d.validUntil ? new Date(d.validUntil + 'T23:59:59').toISOString() : null,
    created_at: new Date().toISOString(),
  })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ message: 'Kod promo sudah wujud' }, { status: 400 })
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  await requireAdmin()
  const { id, is_active } = await request.json()
  await supabaseAdmin.from('promo_codes').update({ is_active }).eq('id', id)
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  await requireAdmin()
  const { id } = await request.json()
  await supabaseAdmin.from('promo_codes').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
