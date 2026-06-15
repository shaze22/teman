'use client'

import { useState } from 'react'
import { MapPin, Loader2, CheckCircle } from 'lucide-react'

interface Props {
  bookingId: string
  isProvider: boolean
  alreadyCheckedIn: boolean
  otherCheckedIn: boolean
  lang: string
}

export default function CheckinSection({ bookingId, isProvider, alreadyCheckedIn, otherCheckedIn, lang }: Props) {
  const [done, setDone] = useState(alreadyCheckedIn)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const en = lang === 'en'
  const myLabel = isProvider
    ? (en ? 'I Have Arrived at the Restaurant' : 'Saya Sudah Tiba di Restoran')
    : (en ? 'I Have Arrived at the Restaurant' : 'Saya Sudah Tiba di Restoran')
  const otherLabel = isProvider
    ? (en ? 'Customer has checked in ✅' : 'Pelanggan sudah check-in ✅')
    : (en ? 'Companion has checked in ✅' : 'Companion sudah check-in ✅')

  async function handleCheckin() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/bookings/${bookingId}/checkin`, { method: 'POST' })
      if (!res.ok) {
        const j = await res.json()
        setError(j.message ?? (en ? 'Check-in failed' : 'Gagal check-in'))
      } else {
        setDone(true)
      }
    } catch {
      setError(en ? 'Network error' : 'Ralat rangkaian')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#0D9488]" />
        {en ? 'Session Check-In' : 'Check-In Sesi'}
      </h2>

      {done ? (
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl px-4 py-3 text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          {en ? 'You have checked in ✅' : 'Anda sudah check-in ✅'}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">
            {en
              ? 'Tap the button below once you arrive at the restaurant to notify the other party.'
              : 'Tekan butang di bawah sebaik anda tiba di restoran untuk maklumkan pihak lain.'}
          </p>
          <button
            onClick={handleCheckin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#0D9488] text-white font-semibold py-3 rounded-xl hover:bg-[#0F766E] transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {myLabel}
          </button>
          {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
        </>
      )}

      {otherCheckedIn && (
        <p className="text-xs text-emerald-600 mt-2 text-center font-medium">{otherLabel}</p>
      )}
    </div>
  )
}
