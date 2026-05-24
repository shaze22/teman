'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, Loader2, MapPin } from 'lucide-react'

type State = 'idle' | 'getting-location' | 'sending' | 'sent' | 'error'

export default function SosButton() {
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [confirm, setConfirm] = useState(false)

  async function handleSOS() {
    if (!confirm) { setConfirm(true); return }

    setState('getting-location')
    setErrorMsg('')

    let lat: number | null = null
    let lng: number | null = null

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      })
      lat = pos.coords.latitude
      lng = pos.coords.longitude
    } catch {
      // Location unavailable — proceed without coordinates
    }

    setState('sending')

    const res = await fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    })

    if (res.ok) {
      setState('sent')
      setConfirm(false)
    } else {
      const d = await res.json().catch(() => ({}))
      setErrorMsg(d.error ?? 'Gagal menghantar SOS')
      setState('error')
      setConfirm(false)
    }
  }

  function reset() {
    setState('idle')
    setConfirm(false)
    setErrorMsg('')
  }

  if (state === 'sent') {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-emerald-800 mb-0.5">SOS Dihantar ✓</div>
          <div className="text-sm text-emerald-700">Lokasi anda telah dihantar kepada waris dan admin. Bantuan dalam perjalanan.</div>
        </div>
        <button onClick={reset} className="text-xs text-emerald-600 underline flex-shrink-0">Tutup</button>
      </div>
    )
  }

  return (
    <div className={`border-2 rounded-2xl p-5 mb-6 transition-all ${confirm ? 'bg-red-100 border-red-400' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${confirm ? 'bg-red-200' : 'bg-red-100'}`}>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="font-bold text-red-700 mb-0.5">🆘 Butang Kecemasan</div>
            {confirm ? (
              <div className="text-sm text-red-700 font-medium">Tekan SOS sekali lagi untuk mengesahkan. Lokasi anda akan dikongsi.</div>
            ) : (
              <div className="text-sm text-red-600">Tekan jika berlaku kecemasan. Lokasi akan dihantar kepada waris dan admin.</div>
            )}
            {state === 'error' && <div className="text-xs text-red-500 mt-1">{errorMsg}</div>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {confirm && (
            <button onClick={() => setConfirm(false)}
              className="px-4 py-2.5 border border-red-300 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors">
              Batal
            </button>
          )}
          <button
            onClick={handleSOS}
            disabled={state === 'getting-location' || state === 'sending'}
            className={`font-bold px-6 py-2.5 rounded-xl transition-all disabled:opacity-60 flex items-center gap-2 ${
              confirm
                ? 'bg-red-700 text-white hover:bg-red-800 animate-pulse'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {state === 'getting-location' && <><MapPin className="w-4 h-4 animate-bounce" /> Lokasi...</>}
            {state === 'sending' && <><Loader2 className="w-4 h-4 animate-spin" /> Menghantar...</>}
            {(state === 'idle' || state === 'error') && (confirm ? '⚠️ Sahkan SOS' : 'SOS')}
          </button>
        </div>
      </div>
    </div>
  )
}
