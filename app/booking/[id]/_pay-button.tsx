'use client'

import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'

export default function PayButton({ bookingId, totalAmount }: { bookingId: string; totalAmount: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); setLoading(false); return }
      window.location.href = data.billUrl
    } catch {
      setError('Ralat rangkaian. Cuba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#6366F1]/30 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pembayaran</h2>
      <div className="flex items-center justify-between">
        <span className="text-gray-700 text-sm">Jumlah perlu dibayar</span>
        <span className="font-bold text-lg text-[#6366F1]">RM{totalAmount.toFixed(2)}</span>
      </div>
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#6366F1] text-white py-3 rounded-xl font-semibold hover:bg-[#4F46E5] disabled:opacity-50 transition-colors"
      >
        {loading
          ? <Loader2 className="w-5 h-5 animate-spin" />
          : <CreditCard className="w-5 h-5" />}
        {loading ? 'Mengalihkan ke halaman bayaran...' : 'Bayar Sekarang (FPX / Online Banking)'}
      </button>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      <p className="text-xs text-gray-400 text-center">Pembayaran selamat melalui Billplz · FPX · Semua bank Malaysia</p>
    </div>
  )
}
