import { supabaseAdmin } from '@/lib/supabase/admin'
import { Errors } from '@/lib/errors'
import type { DbUser, UserStatus } from '@/lib/types'

export const usersRepo = {
  async findById(id: string): Promise<DbUser> {
    const { data, error } = await supabaseAdmin
      .from('users').select('*').eq('id', id).single()
    if (error || !data) throw Errors.notFound('User')
    return data as DbUser
  },

  async findByEmail(email: string): Promise<DbUser | null> {
    const { data } = await supabaseAdmin
      .from('users').select('*').eq('email', email).maybeSingle()
    return data as DbUser | null
  },

  async updateStatus(id: string, status: UserStatus): Promise<void> {
    await supabaseAdmin.from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
  },

  async getCreditBalance(id: string): Promise<number> {
    const { data } = await supabaseAdmin
      .from('users').select('credit_balance').eq('id', id).single()
    return parseFloat(String(data?.credit_balance ?? 0))
  },

  async updateCreditBalance(id: string, newBalance: number): Promise<void> {
    await supabaseAdmin.from('users')
      .update({ credit_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', id)
  },

  async getEmail(id: string): Promise<string | undefined> {
    const { data } = await supabaseAdmin.auth.admin.getUserById(id)
    return data?.user?.email ?? undefined
  },
}
