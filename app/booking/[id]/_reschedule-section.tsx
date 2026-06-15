'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface RescheduleRequest {
  id: string
  requestedBy: string
  newDate: string
  newTime: string
  note: string | null
  status: string
}

interface Props {
  bookingId: string
  isProvider: boolean
  userId: string
  status: string
  pendingRequest: RescheduleRequest | null
  lang?: string
}

function tx(lang: string, en: string, bm: string) { return lang === 'en' ? en : bm }

export default function RescheduleSection({ bookingId, isProvider, userId, status, pendingRequest, lang = 'en' }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canRequest = ['pending', 'confirmed'].includes(status)
  const isMyRequest = pendingRequest?.requestedBy === userId
  const isTheirRequest = pendingRequest && !isMyRequest

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().slice(0, 10)

  async function submitRequest() {
    if (!newDate || !newTime) { setError(tx(lang, 'Please fill in date and time.', 'Sila isi tarikh dan masa.')); return }
    setLoading('request'); setError('')
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate, newTime, note: note || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setSuccess(tx(lang, 'Reschedule request sent!', 'Permintaan tukar jadual dihantar!')); setOpen(false)
      router.refresh()
    } catch { setError(tx(lang, 'Network error. Try again.', 'Ralat rangkaian. Cuba lagi.'))
    } finally { setLoading(null) }
  }

  async function respond(requestId: string, action: 'accept' | 'reject') {
    setLoading(action); setError('')
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      router.refresh()
    } catch { setError(tx(lang, 'Network error. Try again.', 'Ralat rangkaian. Cuba lagi.'))
    } finally { setLoading(null) }
  }

  if (!canRequest) return null

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">{error}</p>}
      {success && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">{success}</p>}

      {/* Incoming reschedule request from other party */}
      {isTheirRequest && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <CalendarDays className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-orange-800 text-sm">{tx(lang, 'Reschedule Request', 'Permintaan Tukar Jadual')}</p>
              <p className="text-xs text-orange-700 mt-1">
                {tx(lang, 'Proposed new schedule:', 'Jadual baru yang dicadangkan:')}
                {' '}<strong>{pendingRequest!.newDate}</strong>{' · '}<strong>{pendingRequest!.newTime.slice(0, 5)}</strong>
              </p>
              {pendingRequest!.note && (
                <p className="text-xs text-orange-600 mt-1 italic">&ldquo;{pendingRequest!.note}&rdquo;</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => respond(pendingRequest!.id, 'accept')}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm"
            >
              {loading === 'accept' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {tx(lang, 'Accept', 'Terima')}
            </button>
            <button
              onClick={() => respond(pendingRequest!.id, 'reject')}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-red-600 border border-red-200 py-2.5 rounded-xl font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors text-sm"
            >
              {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              {tx(lang, 'Reject', 'Tolak')}
            </button>
          </div>
        </div>
      )}

      {/* Own pending request */}
      {isMyRequest && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <CalendarDays className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-700">{tx(lang, 'Reschedule request pending', 'Permintaan tukar jadual menunggu jawapan')}</p>
            <p className="text-xs text-blue-600 mt-0.5">
              {pendingRequest!.newDate} · {pendingRequest!.newTime.slice(0, 5)}
            </p>
          </div>
        </div>
      )}

      {/* Request reschedule form */}
      {!pendingRequest && (
        <div className="bg-white rounded-2xl border border-gray-100">
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left"
          >
            <div className="flex items-center gap-2 text-gray-600">
              <CalendarDays className="w-4 h-4" />
              <span className="text-sm font-medium">{tx(lang, 'Request Reschedule', 'Minta Tukar Jadual')}</span>
            </div>
            {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {open && (
            <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{tx(lang, 'New Date', 'Tarikh Baru')}</label>
                  <input type="date" min={minDateStr} value={newDate} onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{tx(lang, 'New Time', 'Masa Baru')}</label>
                  <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{tx(lang, 'Note (optional)', 'Nota (pilihan)')}</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)} maxLength={300}
                  placeholder={tx(lang, 'Reason for reschedule...', 'Sebab tukar jadual...')}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
              </div>
              <button onClick={submitRequest} disabled={!!loading}
                className="w-full flex items-center justify-center gap-2 bg-[#0D9488] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0F766E] disabled:opacity-50 transition-colors text-sm">
                {loading === 'request' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
                {tx(lang, 'Send Request', 'Hantar Permintaan')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
