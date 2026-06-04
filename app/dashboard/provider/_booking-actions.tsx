'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function BookingActions({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'confirmed' | 'cancelled' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function update(status: 'confirmed' | 'cancelled') {
    setLoading(status)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      router.refresh()
    } catch {
      setError('Ralat rangkaian. Cuba lagi.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-2 space-y-1">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => update('confirmed')}
          disabled={!!loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#6366F1] text-white text-xs font-medium rounded-lg hover:bg-[#4F46E5] disabled:opacity-50 transition-colors"
        >
          {loading === 'confirmed' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
          Terima
        </button>
        <button
          onClick={() => update('cancelled')}
          disabled={!!loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          {loading === 'cancelled' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
          Tolak
        </button>
      </div>
    </div>
  )
}