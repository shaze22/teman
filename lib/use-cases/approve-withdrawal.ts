import { supabaseAdmin } from '@/lib/supabase/admin'
import { Errors } from '@/lib/errors'
import { walletsRepo } from '@/lib/repositories/wallets'

export async function approveWithdrawal(
  withdrawalId: string,
  action: 'approved' | 'rejected',
  adminId: string,
  notes?: string,
): Promise<void> {
  const { data: wr } = await supabaseAdmin
    .from('withdrawal_requests')
    .select('provider_id, amount, status')
    .eq('id', withdrawalId)
    .single()

  if (!wr) throw Errors.notFound('Withdrawal request')
  if (wr.status !== 'pending') throw Errors.conflict('Request already processed')

  const now = new Date().toISOString()
  await supabaseAdmin.from('withdrawal_requests')
    .update({ status: action, notes: notes ?? null, processed_at: now, updated_at: now, processed_by: adminId })
    .eq('id', withdrawalId)

  if (action === 'approved') {
    await walletsRepo.debit(wr.provider_id, parseFloat(String(wr.amount)), {
      referenceType: 'withdrawal',
      referenceId: withdrawalId,
      description: 'Withdrawal approved',
    })
  }
}
