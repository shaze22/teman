'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  licenseId: string
  providerId: string
  providerName: string
  providerEmail: string
}

export default function LicenseVerifyActions({ licenseId, providerId, providerName, providerEmail }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState('')

  const handle = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectReason.trim()) {
      setError('Sila nyatakan sebab penolakan.')
      return
    }
    setLoading(action); setError('')
    try {
      const res = await fetch('/api/admin/providers/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId, providerId, action, rejectionReason: rejectReason }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Tindakan gagal.'); setLoading(null); return }
      router.refresh()
    } catch {
      setError('Ralat rangkaian.')
      setLoading(null)
    }
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50 p-4">
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {showRejectForm ? (
        <div className="space-y-3">
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="Sebab penolakan (diwajibkan — akan dihantar kepada provider)"
            rows={3}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
          <div className="flex gap-2">
            <button onClick={() => handle('reject')} disabled={loading === 'reject'}
              className="flex items-center gap-1.5 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
              {loading === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Hantar Penolakan
            </button>
            <button onClick={() => { setShowRejectForm(false); setRejectReason('') }}
              className="text-sm text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-200">
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => handle('approve')} disabled={!!loading}
            className="flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {loading === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Lulus Sijil
          </button>
          <button onClick={() => setShowRejectForm(true)} disabled={!!loading}
            className="flex items-center gap-1.5 bg-white border border-red-300 text-red-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50">
            <XCircle className="w-3.5 h-3.5" />
            Tolak
          </button>
        </div>
      )}
    </div>
  )
}
