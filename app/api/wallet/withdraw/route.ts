import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  amount: z.number().positive(),
  bankName: z.string().min(1),
  accountNumber: z.string().min(5),
  accountHolder: z.string().min(1),
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
  if (!parsed.success) return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })

  const { amount, bankName, accountNumber, accountHolder } = parsed.data

  // Get available balance from most recent wallet transaction
  const { data: lastTx } = await supabaseAdmin
    .from('wallet_transactions')
    .select('balance_after')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const balance = parseFloat(String(lastTx?.balance_after ?? 0))
  if (amount > balance) return NextResponse.json({ message: 'Amount exceeds wallet balance' }, { status: 400 })

  const { data: pending } = await supabaseAdmin
    .from('withdrawal_requests')
    .select('id')
    .eq('provider_id', user.id)
    .eq('status', 'pending')
    .single()

  if (pending) return NextResponse.json({ message: 'You already have a pending withdrawal request' }, { status: 400 })

  const { error } = await supabaseAdmin.from('withdrawal_requests').insert({
    provider_id: user.id,
    amount,
    bank_name: bankName,
    account_number: accountNumber,
    account_holder: accountHolder,
    status: 'pending',
  })

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('withdrawal_requests')
    .select('id, amount, bank_name, account_number, account_holder, status, notes, created_at, processed_at')
    .eq('provider_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json(data ?? [])
}
