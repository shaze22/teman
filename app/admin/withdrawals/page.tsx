import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-auth'
import WithdrawalActions from './_withdrawal-actions'

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isAdmin(user.id))) redirect('/login')

  const { data: raw } = await supabaseAdmin
    .from('withdrawal_requests')
    .select('id, provider_id, amount, bank_name, account_number, account_holder, status, notes, created_at, processed_at')
    .order('created_at', { ascending: false })

  const withdrawals = await Promise.all((raw ?? []).map(async (w: any) => {
    const { data: u } = await supabaseAdmin.from('users').select('full_name').eq('id', w.provider_id).single()
    return { ...w, providerName: u?.full_name ?? ' ' }
  }))

  const pending = withdrawals.filter(w => w.status === 'pending')
  const processed = withdrawals.filter(w => w.status !== 'pending')

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
        <p className="text-sm text-gray-500 mt-1">{pending.length} pending transfer via DuitNow/FPX within 7 business days</p>
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pending Approval</h2>
          <div className="space-y-3">
            {pending.map((w: any) => (
              <div key={w.id} className="bg-white rounded-2xl border-2 border-amber-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-bold text-gray-900 text-lg">RM{parseFloat(String(w.amount)).toFixed(2)}</div>
                    <div className="text-sm text-gray-600">{w.providerName}</div>
                    <div className="text-sm text-gray-500">{w.bank_name} · {w.account_number}</div>
                    <div className="text-sm text-gray-500">Name: {w.account_holder}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(w.created_at).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                  <WithdrawalActions id={w.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center mb-8">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-semibold text-gray-900">No pending requests</p>
        </div>
      )}

      {processed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">History</h2>
          <div className="space-y-2">
            {processed.map((w: any) => (
              <div key={w.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">RM{parseFloat(String(w.amount)).toFixed(2)} {w.providerName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{w.bank_name} · {w.account_number}</div>
                  {w.notes && <div className="text-xs text-gray-500 mt-1 italic">{w.notes}</div>}
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${w.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {w.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
