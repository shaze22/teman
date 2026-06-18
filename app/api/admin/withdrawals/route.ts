import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isAdmin(user.id))) return NextResponse.json({ message: 'Access denied' }, { status: 403 })

  // Batch fetch users to avoid N+1
  const { data } = await supabaseAdmin
    .from('withdrawal_requests')
    .select(`
      id, amount, bank_name, account_number, account_holder, status, notes, created_at, processed_at, provider_id,
      provider:users!withdrawal_requests_provider_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enriched = (data ?? []).map((w: any) => ({
    ...w,
    providerName: w.provider?.full_name ?? w.provider_id,
    provider: undefined,
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
  if (!user || !(await isAdmin(user.id))) return NextResponse.json({ message: 'Access denied' }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Invalid data' }, { status: 400 })

  const { id, action, notes } = parsed.data
  const now = new Date().toISOString()

  const { data: wr } = await supabaseAdmin
    .from('withdrawal_requests')
    .select('provider_id, amount, status')
    .eq('id', id)
    .single()

  if (!wr) return NextResponse.json({ message: 'Request not found' }, { status: 404 })
  if (wr.status !== 'pending') return NextResponse.json({ message: 'Request already processed' }, { status: 400 })

  await supabaseAdmin
    .from('withdrawal_requests')
    .update({ status: action, notes: notes ?? null, processed_at: now, updated_at: now })
    .eq('id', id)

  if (action === 'approved') {
    // Get current wallet balance from last transaction
    const { data: lastTx } = await supabaseAdmin
      .from('wallet_transactions')
      .select('balance_after')
      .eq('user_id', wr.provider_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const currentBalance = parseFloat(String(lastTx?.balance_after ?? 0))
    const newBalance = Math.max(0, currentBalance - parseFloat(String(wr.amount)))

    await supabaseAdmin.from('wallet_transactions').insert({
      id: crypto.randomUUID(),
      user_id: wr.provider_id,
      type: 'debit',
      amount: wr.amount,
      balance_after: newBalance,
      reference_type: 'withdrawal',
      reference_id: id,
      description: 'Withdrawal approved',
      created_at: now,
    })
  }

  return NextResponse.json({ success: true })
}
