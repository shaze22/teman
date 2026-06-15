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
  lang?: string
}

function tx(lang: string, en: string, bm: string) {
  return lang === 'en' ? en : bm
}

export default function BookingDetailActions({
  bookingId, status, isProvider, hasReview, fundsReleased, paymentStatus, fundsReleasedAt, hasDispute, lang = 'en',
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewDone, setReviewDone] = useState(hasReview)
  const [released] = useState(fundsReleased)
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
            {tx(lang, 'Refund of', 'Bayaran balik')} <strong>RM{refundInfo.amount.toFixed(2)}</strong> ({refundInfo.status === 'full' ? tx(lang, 'full refund', 'bayaran penuh') : tx(lang, '50% cancelled <24h', '50% batalkan <24 jam')}) {tx(lang, 'is being processed to your card.', 'sedang diproses ke kad anda.')}
          </span>
        </div>
      )}

      {/* Provider: accept/reject pending booking */}
      {isProvider && status === 'pending' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{tx(lang, 'Actions', 'Tindakan')}</h2>
          <div className="flex gap-3">
            <button
              onClick={() => updateStatus('confirmed')}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0D9488] text-white py-3 rounded-xl font-semibold hover:bg-[#0F766E] disabled:opacity-50 transition-colors"
            >
              {isLoading('confirmed') ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {tx(lang, 'Accept', 'Terima')}
            </button>
            <button
              onClick={() => updateStatus('cancelled')}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {isLoading('cancelled') ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
              {tx(lang, 'Reject', 'Tolak')}
            </button>
          </div>
        </div>
      )}

      {/* Provider: check-in */}
      {isProvider && status === 'confirmed' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{tx(lang, 'Actions', 'Tindakan')}</h2>
          <button
            onClick={() => updateStatus('in_progress')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {isLoading('in_progress') ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            {tx(lang, 'Start Session (Check-In)', 'Mula Sesi (Check-In)')}
          </button>
        </div>
      )}

      {/* Provider: check-out */}
      {isProvider && status === 'in_progress' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{tx(lang, 'Actions', 'Tindakan')}</h2>
          <button
            onClick={() => updateStatus('completed')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 bg-[#0D9488] text-white py-3 rounded-xl font-semibold hover:bg-[#0F766E] disabled:opacity-50 transition-colors"
          >
            {isLoading('completed') ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
            {tx(lang, 'End Session (Check-Out)', 'Tamat Sesi (Check-Out)')}
          </button>
        </div>
      )}

      {/* Provider: pending admin transfer */}
      {isProvider && status === 'completed' && !released && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">{tx(lang, 'Session Complete Earnings Processing', 'Sesi Selesai Pendapatan Diproses')}</p>
            <p className="text-xs text-amber-700 mt-1">
              {tx(lang, 'Your earnings are being credited to your wallet. Withdrawal requests can be made from the Earnings page.', 'Pendapatan anda sedang dikreditkan ke wallet. Permohonan pengeluaran boleh dibuat dari halaman Pendapatan.')}
            </p>
          </div>
        </div>
      )}

      {/* Provider: funds released, request withdrawal */}
      {isProvider && status === 'completed' && released && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-700">{tx(lang, 'Payment credited to your wallet.', 'Bayaran dikreditkan ke wallet anda.')}</p>
            <p className="text-xs text-emerald-600 mt-0.5">{tx(lang, 'Admin will transfer within 7 working days after a withdrawal request is submitted.', 'Admin akan transfer dalam 7 hari bekerja selepas permohonan pengeluaran dibuat.')}</p>
          </div>
        </div>
      )}

      {/* Customer: cancel */}
      {!isProvider && (status === 'pending' || status === 'confirmed') && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{tx(lang, 'Actions', 'Tindakan')}</h2>
          <button
            onClick={() => updateStatus('cancelled', tx(lang, 'Cancelled by customer', 'Dibatalkan oleh pelanggan'))}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {isLoading('cancelled') ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
            {tx(lang, 'Cancel Booking', 'Batalkan Booking')}
          </button>
        </div>
      )}

      {/* Customer: session complete notice */}
      {!isProvider && status === 'completed' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-700">{tx(lang, 'Session complete. Payment will be processed within 7 working days. Thank you!', 'Sesi selesai. Bayaran akan diuruskan dalam 7 hari bekerja. Terima kasih!')}</p>
        </div>
      )}

      {/* Customer: review after session completed */}
      {!isProvider && status === 'completed' && !reviewDone && !showReview && (
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

      {!isProvider && status === 'completed' && reviewDone && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-sm text-[#134E4A] bg-[#F0FDFA] rounded-xl px-4 py-3">
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
            ⚠ {tx(lang, 'Open Dispute (Not Satisfied)', 'Buka Aduan (Tidak Berpuas Hati)')}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">{tx(lang, 'Dispute window closes 48 hours after payment is released', 'Window aduan tutup 48 jam selepas bayaran dilepaskan')}</p>
        </div>
      )}

      {showDisputeForm && (
        <div className="bg-white rounded-2xl border-2 border-red-200 p-5 space-y-3">
          <h3 className="font-semibold text-red-700">{tx(lang, 'Open Dispute', 'Buka Aduan')}</h3>
          <p className="text-sm text-gray-500">{tx(lang, 'Describe your issue in detail. Admin will review and contact you.', 'Terangkan masalah anda dengan terperinci. Admin akan menyemak dan menghubungi anda.')}</p>
          <textarea
            value={disputeReason}
            onChange={e => setDisputeReason(e.target.value)}
            rows={4}
            placeholder={tx(lang, 'e.g. Companion did not show up / Service was unsatisfactory / Late arrival...', 'Contoh: Teman tidak muncul / Perkhidmatan tidak memuaskan / Masa tidak ditepati...')}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={submitDispute}
              disabled={!!loading || disputeReason.length < 10}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 text-sm"
            >
              {isLoading('dispute') ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {tx(lang, 'Submit Dispute', 'Hantar Aduan')}
            </button>
            <button onClick={() => setShowDisputeForm(false)} className="px-4 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              {tx(lang, 'Cancel', 'Batal')}
            </button>
          </div>
        </div>
      )}

      {disputeSubmitted && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3">
          <span className="text-red-600">⚠</span>
          <p className="text-sm font-semibold text-red-700">{tx(lang, 'Dispute submitted. Admin will contact you within 1-2 working days.', 'Aduan telah dihantar. Admin akan menghubungi anda dalam masa 1-2 hari bekerja.')}</p>
        </div>
      )}

      {/* Review form */}
      {showReview && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="border border-yellow-200 rounded-xl p-4 space-y-3 bg-yellow-50">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{tx(lang, 'Rating', 'Rating')}</p>
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
              <p className="text-sm font-medium text-gray-700 mb-1">{tx(lang, 'Comment (optional)', 'Komen (pilihan)')}</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder={tx(lang, 'Share your experience...', 'Kongsikan pengalaman anda...')}
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
                {tx(lang, 'Submit Review', 'Hantar Ulasan')}
              </button>
              <button
                onClick={() => setShowReview(false)}
                className="px-4 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {tx(lang, 'Cancel', 'Batal')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
