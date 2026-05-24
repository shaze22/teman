import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Heart, ArrowLeft, TrendingUp, DollarSign, Calendar, Clock } from 'lucide-react'

export default async function ProviderEarningsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawBookings } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_code, scheduled_date, provider_price, status, created_at, customer:users!bookings_customer_id_fkey(full_name)')
    .eq('provider_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookings = (rawBookings ?? []).map((b: any) => ({
    id: b.id as string,
    bookingCode: b.booking_code as string,
    scheduledDate: b.scheduled_date as string,
    providerPrice: parseFloat(String(b.provider_price)),
    createdAt: new Date(b.created_at as string),
    customerName: b.customer?.full_name ?? '',
  }))

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const thisMonth = bookings.filter(b => b.createdAt >= startOfMonth)
  const lastMonth = bookings.filter(b => b.createdAt >= startOfLastMonth && b.createdAt <= endOfLastMonth)
  const total = bookings.reduce((s, b) => s + b.providerPrice, 0)
  const thisMonthTotal = thisMonth.reduce((s, b) => s + b.providerPrice, 0)
  const lastMonthTotal = lastMonth.reduce((s, b) => s + b.providerPrice, 0)
  const platformCut = 0.15
  const netTotal = total * (1 - platformCut)
  const netThisMonth = thisMonthTotal * (1 - platformCut)

  const monthName = now.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard/provider" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-[#6366F1]" fill="currentColor" />
            <span className="font-bold text-[#6366F1]">Teman</span>
          </Link>
          <span className="font-semibold text-gray-900 ml-2">Pendapatan Saya</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#6366F1] text-white rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1 opacity-80 text-sm">
              <TrendingUp className="w-4 h-4" /> Bulan Ini
            </div>
            <div className="text-3xl font-bold">RM{netThisMonth.toFixed(0)}</div>
            <div className="text-xs opacity-70 mt-1">{thisMonth.length} sesi · {monthName}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-1 text-gray-500 text-sm">
              <DollarSign className="w-4 h-4" /> Jumlah Keseluruhan
            </div>
            <div className="text-3xl font-bold text-gray-900">RM{netTotal.toFixed(0)}</div>
            <div className="text-xs text-gray-400 mt-1">{bookings.length} sesi selesai</div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Ringkasan Pendapatan</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Jumlah kasar (bulan ini)</span>
              <span className="font-medium">RM{thisMonthTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Yuran platform (15%)</span>
              <span className="font-medium text-red-500">- RM{(thisMonthTotal * platformCut).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3 font-bold">
              <span>Pendapatan bersih</span>
              <span className="text-[#6366F1]">RM{netThisMonth.toFixed(2)}</span>
            </div>
          </div>
          {lastMonthTotal > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
              Bulan lepas: RM{(lastMonthTotal * (1 - platformCut)).toFixed(0)} bersih ({lastMonth.length} sesi)
            </div>
          )}
        </div>

        {/* Transaction history */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Sejarah Sesi</h2>
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="font-semibold text-gray-900 mb-1">Belum ada pendapatan</h3>
              <p className="text-sm text-gray-500">Pendapatan akan direkodkan selepas sesi selesai.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.map(b => (
                <Link key={b.id} href={`/booking/${b.id}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4 hover:border-[#6366F1] hover:shadow-sm transition-all">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{b.customerName}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(b.scheduledDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#6366F1]">RM{(b.providerPrice * (1 - platformCut)).toFixed(0)}</div>
                    <div className="text-xs text-gray-400">daripada RM{b.providerPrice.toFixed(0)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Withdrawal notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">Pengeluaran Wang</p>
            <p className="text-xs text-yellow-700 mt-1">
              Sistem pengeluaran automatik ke akaun bank akan diaktifkan tidak lama lagi.
              Buat masa ini, hubungi admin Teman untuk proses bayaran manual.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
