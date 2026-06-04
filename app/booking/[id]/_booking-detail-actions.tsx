'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, LogIn, LogOut, Star, Loader2, ShieldCheck, Clock } from 'lucide-react'

interface Props {
  bookingId: string
  status: string
  isProvider: boolean
  hasReview: boolean
  fundsReleased: boolean
  paymentStatus: string
  fundsReleasedAt?: string | null
  hasDispute?: boolean
}

export default function BookingDetailActions({
  bookingId, status, isProvider, hasReview, fundsReleased, paymentStatus, fundsReleasedAt, hasDispute,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewDone, setReviewDone] = useState(hasReview)
  const [released, setReleased] = useState(fundsReleased)
  const [refundInfo, setRefundInfo] = useState<{ amount: number; status: string } | null>(null)
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeSubmitted, setDisputeSubmitted] = useState(hasDispute ?? false)

  // 48-hour dispute window
  const disputeWindowOpen = fundsReleasedAt
    ? (Date.now() - new Date(fundsReleasedAt).getTime()) / 3_600_000 < 48
    : false

  async function submitDispute() {
    setLoading('dispute')
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputeReason }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setDisputeSubmitted(true)
      setShowDisputeForm(false)
    } catch {
      setError('Ralat rangkaian. Cuba lagi.')
    } finally {
      setLoading(null)
    }
  }

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
      if (data.refundAmount) setRefundInfo({ amount: data.refundAmount, status: data.refundStatus })
      router.refresh()
    } catch {
      setError('Ralat rangkaian. Cuba lagi.')
    } finally {
      setLoading(null)
    }
  }

  async function releaseFunds() {
    setLoading('release')
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/release`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setReleased(true)
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
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
          {error}
        </p>
      )}

      {refundInfo && (
        <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Bayaran balik <strong>RM{refundInfo.amount.toFixed(2)}</strong> ({refundInfo.status === 'full' ? 'bayaran penuh' : '50% — batalkan &lt;24 jam'}) sedang diproses ke kad anda.
          </span>
        </div>
      )}

      {/* Provider: accept/reject pending booking */}
      {isProvider && status === 'pending' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tindakan</h2>
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
        </div>
      )}

      {/* Provider: check-in */}
      {isProvider && status === 'confirmed' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tindakan</h2>
          <button
            onClick={() => updateStatus('in_progress')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {isLoading('in_progress') ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            Mula Sesi (Check-In)
          </button>
        </div>
      )}

      {/* Provider: check-out */}
      {isProvider && status === 'in_progress' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tindakan</h2>
          <button
            onClick={() => updateStatus('completed')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 bg-[#6366F1] text-white py-3 rounded-xl font-semibold hover:bg-[#4F46E5] disabled:opacity-50 transition-colors"
          >
            {isLoading('completed') ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
            Tamat Sesi (Check-Out)
          </button>
        </div>
      )}

      {/* Provider: waiting for customer confirmation */}
      {isProvider && status === 'completed' && !released && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Menunggu Pengesahan Pelanggan</p>
            <p className="text-xs text-amber-700 mt-1">
              Pelanggan perlu mengesahkan sesi selesai sebelum bayaran dilepaskan ke wallet anda.
            </p>
          </div>
        </div>
      )}

      {/* Provider: funds released */}
      {isProvider && status === 'completed' && released && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-700">Bayaran telah dikreditkan ke wallet anda.</p>
        </div>
      )}

      {/* Customer: cancel */}
      {!isProvider && (status === 'pending' || status === 'confirmed') && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tindakan</h2>
          <button
            onClick={() => updateStatus('cancelled', 'Dibatalkan oleh pelanggan')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {isLoading('cancelled') ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
            Batalkan Booking
          </button>
        </div>
      )}

      {/* Customer: confirm completion + release funds (ESCROW) */}
      {!isProvider && status === 'completed' && paymentStatus === 'paid' && !released && (
        <div className="bg-white rounded-2xl border-2 border-[#6366F1]/30 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-[#6366F1] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">Sahkan Sesi Selesai</p>
              <p className="text-sm text-gray-500 mt-1">
                Setelah anda sahkan, bayaran akan dilepaskan kepada Pengasuh anda. Pastikan anda berpuas hati dengan perkhidmatan yang diberikan.
              </p>
            </div>
          </div>
          <button
            onClick={releaseFunds}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 bg-[#6366F1] text-white py-3.5 rounded-xl font-semibold hover:bg-[#4F46E5] disabled:opacity-50 transition-colors text-base"
          >
            {isLoading('release') ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            Ya, Sesi Selesai — Lepaskan Bayaran
          </button>
        </div>
      )}

      {/* Customer: funds released confirmation */}
      {!isProvider && released && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-700">Bayaran telah dilepaskan kepada Pengasuh anda. Terima kasih!</p>
        </div>
      )}

      {/* Customer: review — only after funds released */}
      {!isProvider && status === 'completed' && released && !reviewDone && !showReview && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <button
            onClick={() => setShowReview(true)}
            className="w-full flex items-center justify-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200 py-3 rounded-xl font-semibold hover:bg-yellow-100 transition-colors"
          >
            <Star className="w-5 h-5" />
            Beri Ulasan &amp; Rating
          </button>
        </div>
      )}

      {!isProvider && status === 'completed' && released && reviewDone && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-sm text-[#3730A3] bg-[#EEF2FF] rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4" />
            Ulasan telah diberikan. Terima kasih!
          </div>
        </div>
      )}

      {/* Customer: dispute window */}
      {!isProvider && status === 'completed' && released && disputeWindowOpen && !disputeSubmitted && !showDisputeForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <button
            onClick={() => setShowDisputeForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-semibold hover:bg-red-100 transition-colors text-sm"
          >
            ⚠ Buka Aduan (Tidak Berpuas Hati)
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">Window aduan tutup 48 jam selepas bayaran dilepaskan</p>
        </div>
      )}

      {showDisputeForm && (
        <div className="bg-white rounded-2xl border-2 border-red-200 p-5 space-y-3">
          <h3 className="font-semibold text-red-700">Buka Aduan</h3>
          <p className="text-sm text-gray-500">Terangkan masalah anda dengan terperinci. Admin akan menyemak dan menghubungi anda.</p>
          <textarea
            value={disputeReason}
            onChange={e => setDisputeReason(e.target.value)}
            rows={4}
            placeholder="Contoh: Teman tidak muncul / Perkhidmatan tidak memuaskan / Masa tidak ditepati..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={submitDispute}
              disabled={!!loading || disputeReason.length < 10}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 text-sm"
            >
              {isLoading('dispute') ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Hantar Aduan
            </button>
            <button onClick={() => setShowDisputeForm(false)} className="px-4 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              Batal
            </button>
          </div>
        </div>
      )}

      {disputeSubmitted && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3">
          <span className="text-red-600">⚠</span>
          <p className="text-sm font-semibold text-red-700">Aduan telah dihantar. Admin akan menghubungi anda dalam masa 1-2 hari bekerja.</p>
        </div>
      )}

      {/* Review form */}
      {showReview && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
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
        </div>
      )}
    </div>
  )
}
