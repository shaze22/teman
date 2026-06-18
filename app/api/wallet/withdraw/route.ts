import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { walletsRepo } from '@/lib/repositories/wallets'
import { Errors } from '@/lib/errors'

const schema = z.object({
  amount: z.number().positive(),
  bankName: z.string().min(1),
  accountNumber: z.string().min(5),
  accountHolder: z.string().min(1),
})

export const POST = withAuth(async ({ user, req }) => {
  const { amount, bankName, accountNumber, accountHolder } = await parseBody(req, schema)

  const balance = await walletsRepo.getBalance(user.id)
  if (amount > balance) throw Errors.badRequest('Amount exceeds wallet balance')

  const { data: pending } = await supabaseAdmin
    .from('withdrawal_requests').select('id')
    .eq('provider_id', user.id).eq('status', 'pending').single()
  if (pending) throw Errors.conflict('You already have a pending withdrawal request')

  const { error } = await supabaseAdmin.from('withdrawal_requests').insert({
    provider_id: user.id, amount,
    bank_name: bankName, account_number: accountNumber, account_holder: accountHolder,
    status: 'pending',
  })
  if (error) throw Errors.serverError(error.message)

  return NextResponse.json({ success: true })
})

export const GET = withAuth(async ({ user }) => {
  const { data } = await supabaseAdmin
    .from('withdrawal_requests')
    .select('id, amount, bank_name, account_number, account_holder, status, notes, created_at, processed_at')
    .eq('provider_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)
  return NextResponse.json(data ?? [])
})
