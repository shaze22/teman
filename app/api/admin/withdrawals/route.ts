import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAdmin } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { approveWithdrawal } from '@/lib/use-cases/approve-withdrawal'

export const GET = withAdmin(async () => {
  const { data } = await supabaseAdmin
    .from('withdrawal_requests')
    .select(`
      id, amount, bank_name, account_number, account_holder, status, notes, created_at, processed_at, provider_id,
      provider:users!withdrawal_requests_provider_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enriched = (data ?? []).map((w: any) => ({
    ...w,
    providerName: w.provider?.full_name ?? w.provider_id,
    provider: undefined,
  }))

  return NextResponse.json(enriched)
})

const patchSchema = z.object({
  id: z.string(),
  action: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
})

export const PATCH = withAdmin(async ({ user, req }) => {
  const { id, action, notes } = await parseBody(req, patchSchema)
  await approveWithdrawal(id, action, user.id, notes)
  return NextResponse.json({ success: true })
})
