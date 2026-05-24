'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, LogIn, LogOut, Star, Loader2 } from 'lucide-react'

interface Props {
  bookingId: string
  status: string
  isProvider: boolean
  hasReview: boolean
}

export default function BookingDetailActions({ bookingId, status, isProvider, hasReview }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewDone, setReviewDone] = useState(hasReview)

  async function updateStatus(newStatus: string, cancellationReason?: string) {
    setLoading(newStatus)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, cancellationReason }),
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

  async function submitReview() {
    setLoading('review')
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setReviewDone(true)
      setShowReview(false)
    } catch {
      setError('Ralat rangkaian. Cuba lagi.')
    } finally {
      setLoading(null)
    }
  }

  const isLoading = (s: string) => loading === s

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tindakan</h2>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Provider actions */}
      {isProvider && status === 'confirmed' && (
        <button
          onClick={() => updateStatus('in_progress')}
          disabled={!!loading}
          className="w-full flex items-center justify-center gap-2 bg-[#FFF1F2]0 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {isLoading('in_progress') ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
          Mula Sesi (Check-In)
        </button>
      )}

      {isProvider && status === 'in_progress' && (
        <button
          onClick={() => updateStatus('completed')}
          disabled={!!loading}
          className="w-full flex items-center justify-center gap-2 bg-[#6366F1] text-white py-3 rounded-xl font-semibold hover:bg-[#4F46E5] disabled:opacity-50 transition-colors"
        >
          {isLoading('completed') ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
          Tamat Sesi (Check-Out)
        </button>
      )}

      {isProvider && status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={() => updateStatus('confirmed')}
            disabled={!!loading}
            className="flex-1 flex items-center justify-center gap-2 bg-[#6366F1] text-white py-3 rounded-xl font-semibold hover:bg-[#4F46E5] disabled:opacity-50 transition-colors"
          >
            {isLoading('confirmed') ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Terima
          </button>
          <button
            onClick={() => updateStatus('cancelled')}
            disabled={!!loading}
            className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {isLoading('cancelled') ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
            Tolak
          </button>
        </div>
      )}

      {/* Customer actions */}
      {!isProvider && (status === 'pending' || status === 'confirmed') && (
        <button
          onClick={() => updateStatus('cancelled', 'Dibatalkan oleh pelanggan')}
          disabled={!!loading}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          {isLoading('cancelled') ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
          Batalkan Booking
        </button>
      )}

      {!isProvider && status === 'completed' && !reviewDone && !showReview && (
        <button
          onClick={() => setShowReview(true)}
          className="w-full flex items-center justify-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200 py-3 rounded-xl font-semibold hover:bg-yellow-100 transition-colors"
        >
          <Star className="w-5 h-5" />
          Beri Ulasan & Rating
        </button>
      )}

      {!isProvider && status === 'completed' && reviewDone && (
        <div className="flex items-center gap-2 text-sm text-[#3730A3] bg-[#EEF2FF] rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4" />
          Ulasan telah diberikan. Terima kasih!
        </div>
      )}

      {/* Review form */}
      {showReview && (
        <div className="border border-yellow-200 rounded-xl p-4 space-y-3 bg-yellow-50">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`text-2xl transition-transform hover:scale-110 ${n <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Komen (pilihan)</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Kongsikan pengalaman anda..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={submitReview}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 text-white py-2.5 rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 transition-colors text-sm"
            >
              {isLoading('review') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
              Hantar Ulasan
            </button>
            <button
              onClick={() => setShowReview(false)}
              className="px-4 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
