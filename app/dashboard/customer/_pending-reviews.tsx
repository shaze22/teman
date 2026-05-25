'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, Loader2, CheckCircle, ChevronRight } from 'lucide-react'

type PendingBooking = {
  id: string
  providerName: string
  scheduledDate: string
  serviceType: string
}

const SERVICE_LABELS: Record<string, string> = {
  job: 'Teman Kerja', food: 'Teman Makan', learning: 'Teman Belajar',
  business: 'Teman Bisnes', ibadah: 'Teman Ibadah', repair: 'Teman Repair',
  riadah: 'Teman Riadah', kombo: 'Teman Kombo',
}

function ReviewCard({ booking, onDone }: { booking: PendingBooking; onDone: (id: string) => void }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function submit() {
    if (rating === 0) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      onDone(booking.id)
    } catch {
      setError('Ralat rangkaian. Cuba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const displayRating = hovered || rating

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#6366F1] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {booking.providerName.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{booking.providerName}</div>
            <div className="text-xs text-gray-500">
              {SERVICE_LABELS[booking.serviceType] ?? booking.serviceType} ·{' '}
              {new Date(booking.scheduledDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#F43F5E] font-semibold bg-[#FFF1F2] px-2 py-1 rounded-full">
            Beri Ulasan
          </span>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-4">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>
          )}

          <p className="text-sm font-medium text-gray-700 mb-2">Rating anda</p>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(n)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${n <= displayRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <>
              <p className="text-xs text-gray-500 mb-3">
                {['', 'Sangat tidak berpuas hati', 'Kurang memuaskan', 'Boleh tahan', 'Berpuas hati', 'Sangat berpuas hati!'][rating]}
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Kongsikan pengalaman anda (pilihan)..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 resize-none mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={submit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#6366F1] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#4F46E5] disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                  Hantar Ulasan
                </button>
                <Link
                  href={`/booking/${booking.id}`}
                  className="px-3 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Detail
                </Link>
              </div>
            </>
          )}

          {rating === 0 && (
            <p className="text-xs text-gray-400 text-center">Pilih bilangan bintang di atas</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function PendingReviews({ bookings: initial }: { bookings: PendingBooking[] }) {
  const [bookings, setBookings] = useState(initial)
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

  function handleDone(id: string) {
    setDoneIds(prev => new Set([...prev, id]))
  }

  const visible = bookings.filter(b => !doneIds.has(b.id))

  if (visible.length === 0) {
    if (doneIds.size > 0) {
      return (
        <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-[#6366F1] flex-shrink-0" />
          <p className="text-sm font-medium text-[#3730A3]">Semua ulasan telah diberikan. Terima kasih!</p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">Ulasan Tertunggak</h2>
        <span className="text-xs bg-[#F43F5E] text-white font-bold px-2 py-0.5 rounded-full">{visible.length}</span>
      </div>
      <div className="space-y-2">
        {visible.map(b => (
          <ReviewCard key={b.id} booking={b} onDone={handleDone} />
        ))}
      </div>
    </div>
  )
}
