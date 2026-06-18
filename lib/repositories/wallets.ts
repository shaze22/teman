import { supabaseAdmin } from '@/lib/supabase/admin'
import { Errors } from '@/lib/errors'

export const walletsRepo = {
  async getBalance(userId: string): Promise<number> {
    const { data } = await supabaseAdmin
      .from('wallet_transactions')
      .select('balance_after')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return parseFloat(String(data?.balance_after ?? 0))
  },

  // Uses Postgres advisory lock to serialize concurrent ops — no read-modify-write race
  async credit(
    userId: string,
    amount: number,
    opts: { referenceType: string; referenceId: string; description: string },
  ): Promise<number> {
    const { data, error } = await supabaseAdmin.rpc('atomic_wallet_credit', {
      p_user_id:  userId,
      p_amount:   amount,
      p_type:     'credit',
      p_ref_type: opts.referenceType,
      p_ref_id:   opts.referenceId,
      p_desc:     opts.description,
      p_id:       crypto.randomUUID(),
    })
    if (error) throw Errors.serverError(`Wallet credit failed: ${error.message}`)
    return parseFloat(String(data))
  },

  async debit(
    userId: string,
    amount: number,
    opts: { referenceType: string; referenceId: string; description: string },
  ): Promise<number> {
    const { data, error } = await supabaseAdmin.rpc('atomic_wallet_debit', {
      p_user_id:  userId,
      p_amount:   amount,
      p_ref_type: opts.referenceType,
      p_ref_id:   opts.referenceId,
      p_desc:     opts.description,
      p_id:       crypto.randomUUID(),
    })
    if (error) throw Errors.serverError(`Wallet debit failed: ${error.message}`)
    return parseFloat(String(data))
  },
}
