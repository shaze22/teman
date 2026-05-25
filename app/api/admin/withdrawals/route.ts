import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isAdmin(user.id))) return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })

  const { data } = await supabaseAdmin
    .from('withdrawal_requests')
    .select('id, amount, bank_name, account_number, account_holder, status, notes, created_at, processed_at, provider_id')
    .order('created_at', { ascending: false })

  const enriched = await Promise.all((data ?? []).map(async (w: any) => {
    const { data: u } = await supabaseAdmin.from('users').select('full_name').eq('id', w.provider_id).single()
    return { ...w, providerName: u?.full_name ?? w.provider_id }
  }))

  return NextResponse.json(enriched)
}

const schema = z.object({
  id: z.string(),
  action: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
})

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isAdmin(user.id))) return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Data tidak sah' }, { status: 400 })

  const { id, action, notes } = parsed.data
  const now = new Date().toISOString()

  const { data: wr } = await supabaseAdmin
    .from('withdrawal_requests')
    .select('provider_id, amount, status')
    .eq('id', id)
    .single()

  if (!wr) return NextResponse.json({ message: 'Permohonan tidak dijumpai' }, { status: 404 })
  if (wr.status !== 'pending') return NextResponse.json({ message: 'Permohonan sudah diproses' }, { status: 400 })

  await supabaseAdmin
    .from('withdrawal_requests')
    .update({ status: action, notes: notes ?? null, processed_at: now, updated_at: now })
    .eq('id', id)

  if (action === 'approved') {
    const { data: profile } = await supabaseAdmin
      .from('single_mother_profiles')
      .select('id, earnings_total')
      .eq('user_id', wr.provider_id)
      .single()

    if (profile) {
      const newBalance = parseFloat(String(profile.earnings_total)) - parseFloat(String(wr.amount))
      await Promise.all([
        supabaseAdmin
          .from('single_mother_profiles')
          .update({ earnings_total: Math.max(0, newBalance), updated_at: now })
          .eq('id', profile.id),
        supabaseAdmin.from('wallet_transactions').insert({
          id: crypto.randomUUID(),
          user_id: wr.provider_id,
          type: 'debit',
          amount: wr.amount,
          balance_after: Math.max(0, newBalance),
          reference_type: 'withdrawal',
          reference_id: id,
          description: `Pengeluaran diluluskan`,
          created_at: now,
        }),
      ])
    }
  }

  return NextResponse.json({ success: true })
}
