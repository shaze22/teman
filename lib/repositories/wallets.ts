import { supabaseAdmin } from '@/lib/supabase/admin'

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

  async credit(
    userId: string,
    amount: number,
    opts: { referenceType: string; referenceId: string; description: string },
  ): Promise<number> {
    const currentBalance = await this.getBalance(userId)
    const newBalance = currentBalance + amount
    await supabaseAdmin.from('wallet_transactions').insert({
      id: crypto.randomUUID(),
      user_id: userId,
      type: 'credit',
      amount,
      balance_after: newBalance,
      reference_type: opts.referenceType,
      reference_id: opts.referenceId,
      description: opts.description,
      created_at: new Date().toISOString(),
    })
    return newBalance
  },

  async debit(
    userId: string,
    amount: number,
    opts: { referenceType: string; referenceId: string; description: string },
  ): Promise<number> {
    const currentBalance = await this.getBalance(userId)
    const newBalance = Math.max(0, currentBalance - amount)
    await supabaseAdmin.from('wallet_transactions').insert({
      id: crypto.randomUUID(),
      user_id: userId,
      type: 'debit',
      amount,
      balance_after: newBalance,
      reference_type: opts.referenceType,
      reference_id: opts.referenceId,
      description: opts.description,
      created_at: new Date().toISOString(),
    })
    return newBalance
  },
}
