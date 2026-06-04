import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Heart, ArrowLeft, TrendingUp, DollarSign, Calendar, Clock, ShieldCheck, Lock, CheckCircle, XCircle, Hourglass } from 'lucide-react'
import WithdrawalForm from './_withdrawal-form'
import { translations, type Lang } from '@/lib/i18n'

export default async function ProviderEarningsPage() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'bm') as Lang
  const t = translations[lang]
  const ep = t.earningsPage
  const dc = t.dashCommon

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rawBookings }, { data: walletTx }, { data: profile }, { data: withdrawals }] = await Promise.all([
    supabaseAdmin
      .from('bookings')
      .select('id, booking_code, scheduled_date, provider_price, status, funds_released, funds_released_at, created_at, payment_status, customer:users!bookings_customer_id_fkey(full_name)')
      .eq('provider_id', user.id)
      .in('status', ['completed'])
      .order('created_at', { ascending: false }),

    supabaseAdmin
      .from('wallet_transactions')
      .select('id, amount, balance_after, description, created_at, reference_id')
      .eq('user_id', user.id)
      .eq('type', 'credit')
      .order('created_at', { ascending: false })
      .limit(20),

    supabaseAdmin
      .from('single_mother_profiles')
      .select('earnings_total')
      .eq('user_id', user.id)
      .single(),

    supabaseAdmin
      .from('withdrawal_requests')
      .select('id, amount, bank_name, account_number, status, notes, created_at, processed_at')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookings = (rawBookings ?? []).map((b: any) => ({
    id: b.id as string,
    bookingCode: b.booking_code as string,
    scheduledDate: b.scheduled_date as string,
    providerPrice: parseFloat(String(b.provider_price)),
    fundsReleased: b.funds_released as boolean,
    fundsReleasedAt: b.funds_released_at as string | null,
    paymentStatus: b.payment_status as string,
    createdAt: new Date(b.created_at as string),
    customerName: (b.customer as any)?.full_name ?? '',
  }))

  const platformCut = 0.15
  const releasedBookings = bookings.filter(b => b.fundsReleased)
  const pendingBookings = bookings.filter(b => !b.fundsReleased && b.paymentStatus === 'paid')

  const walletBalance = parseFloat(String(profile?.earnings_total ?? 0))

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const thisMonth = releasedBookings.filter(b => b.createdAt >= startOfMonth)
  const lastMonth = releasedBookings.filter(b => b.createdAt >= startOfLastMonth && b.createdAt <= endOfLastMonth)

  const pendingAmount = pendingBookings.reduce((s, b) => s + b.providerPrice * (1 - platformCut), 0)
  const thisMonthNet = thisMonth.reduce((s, b) => s + b.providerPrice * (1 - platformCut), 0)
  const lastMonthNet = lastMonth.reduce((s, b) => s + b.providerPrice * (1 - platformCut), 0)
  const monthName = now.toLocaleDateString(lang === 'en' ? 'en-MY' : 'ms-MY', { month: 'long', year: 'numeric' })
  const dateLocale = lang === 'en' ? 'en-MY' : 'ms-MY'

  const withdrawStatusConfig = (status: string) => ({
    pending:  { label: ep.withdrawPending,  color: 'bg-amber-100 text-amber-700',     icon: Hourglass },
    approved: { label: ep.withdrawApproved, color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    rejected: { label: ep.withdrawRejected, color: 'bg-red-100 text-red-700',         icon: XCircle },
  }[status] ?? { label: status, color: 'bg-gray-100 text-gray-600', icon: Clock })

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard/provider" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-[#6366F1]" fill="currentColor" />
            <span className="font-bold text-[#6366F1]">SenioCare</span>
          </Link>
          <span className="font-semibold text-gray-900 ml-2">{ep.title}</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Wallet balance */}
        <div className="bg-[#6366F1] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-1 opacity-80 text-sm">
            <ShieldCheck className="w-4 h-4" /> {ep.walletBalance}
          </div>
          <div className="text-4xl font-bold">RM{walletBalance.toFixed(2)}</div>
          <div className="text-xs opacity-70 mt-2">{releasedBookings.length} {ep.sessionsReleased}</div>
          {pendingAmount > 0 && (
            <div className="mt-3 bg-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <Lock className="w-4 h-4 opacity-80" />
              <span className="text-sm">RM{pendingAmount.toFixed(2)} {ep.inEscrow} ({pendingBookings.length} {ep.sessionsPending})</span>
            </div>
          )}
        </div>

        {/* This month & last month */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-1 text-gray-500 text-sm">
              <TrendingUp className="w-4 h-4" /> {ep.thisMonth}
            </div>
            <div className="text-2xl font-bold text-gray-900">RM{thisMonthNet.toFixed(0)}</div>
            <div className="text-xs text-gray-400 mt-1">{thisMonth.length} {ep.sessions} · {monthName}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-1 text-gray-500 text-sm">
              <DollarSign className="w-4 h-4" /> {ep.lastMonth}
            </div>
            <div className="text-2xl font-bold text-gray-900">RM{lastMonthNet.toFixed(0)}</div>
            <div className="text-xs text-gray-400 mt-1">{lastMonth.length} {ep.sessions}</div>
          </div>
        </div>

        {/* Pending escrow */}
        {pendingBookings.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              {ep.escrowPending}
            </h2>
            <div className="space-y-2">
              {pendingBookings.map(b => (
                <Link key={b.id} href={`/booking/${b.id}`}
                  className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4 hover:border-amber-400 transition-all">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{b.customerName}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(b.scheduledDate).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-600">RM{(b.providerPrice * (1 - platformCut)).toFixed(2)}</div>
                    <div className="text-xs text-amber-500 flex items-center gap-1 justify-end mt-0.5">
                      <Clock className="w-3 h-3" /> {ep.waiting}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Released wallet transactions */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            {ep.earningHistory}
          </h2>
          {(walletTx ?? []).length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="text-4xl mb-3">ðŸ'°</div>
              <h3 className="font-semibold text-gray-900 mb-1">{ep.noEarnings}</h3>
              <p className="text-sm text-gray-500">{ep.noEarningsDesc}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(walletTx ?? []).map((tx: any) => (
                <Link key={tx.id} href={tx.reference_id ? `/booking/${tx.reference_id}` : '#'}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4 hover:border-[#6366F1] hover:shadow-sm transition-all">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{tx.description}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(tx.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">+ RM{parseFloat(String(tx.amount)).toFixed(2)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{ep.balanceLabel}: RM{parseFloat(String(tx.balance_after)).toFixed(2)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Breakdown this month */}
        {thisMonth.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">{ep.monthlySummary}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{ep.grossTotal}</span>
                <span className="font-medium">RM{thisMonth.reduce((s, b) => s + b.providerPrice, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{ep.platformFee}</span>
                <span className="font-medium text-red-500">- RM{(thisMonth.reduce((s, b) => s + b.providerPrice, 0) * platformCut).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3 font-bold">
                <span>{ep.netEarnings}</span>
                <span className="text-[#6366F1]">RM{thisMonthNet.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal form */}
        <WithdrawalForm walletBalance={walletBalance} />

        {/* Withdrawal history */}
        {(withdrawals ?? []).length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">{ep.withdrawalHistory}</h2>
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(withdrawals ?? []).map((w: any) => {
                const cfg = withdrawStatusConfig(w.status as string)
                const StatusIcon = cfg.icon
                return (
                  <div key={w.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">RM{parseFloat(String(w.amount)).toFixed(2)}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{w.bank_name} · {w.account_number}</div>
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(w.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </div>
                    {w.notes && (
                      <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2">{w.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
