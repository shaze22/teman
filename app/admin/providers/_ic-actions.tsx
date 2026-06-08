'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ShieldX, Eye, Loader2 } from 'lucide-react'

interface Props {
  profileId: string
  icVerified: boolean
  icFrontUrl: string | null
  icBackUrl: string | null
  icNumber: string | null
}

export default function IcActions({ profileId, icVerified, icFrontUrl, icBackUrl, icNumber }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showPhotos, setShowPhotos] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  async function act(action: 'approve' | 'reject') {
    setLoading(action)
    await fetch(`/api/admin/providers/${profileId}/ic`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason: rejectReason || undefined }),
    })
    setLoading(null)
    setShowReject(false)
    router.refresh()
  }

  if (icVerified) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
        <ShieldCheck className="w-3 h-3" /> IC ✓
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => setShowPhotos(!showPhotos)}
        className="flex items-center gap-1 text-xs text-[#6366F1] bg-[#EEF2FF] px-2 py-1 rounded-full hover:bg-[#C7D2FE] transition-colors">
        <Eye className="w-3 h-3" /> Semak IC
      </button>

      {showPhotos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowPhotos(false)}>
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900">Semakan IC {icNumber}</h3>
            <div className="grid grid-cols-2 gap-3">
              {icFrontUrl && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Hadapan IC</p>
                  <img src={icFrontUrl} alt="IC Front" className="w-full rounded-xl border border-gray-200 object-cover" />
                </div>
              )}
              {icBackUrl && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Belakang IC</p>
                  <img src={icBackUrl} alt="IC Back" className="w-full rounded-xl border border-gray-200 object-cover" />
                </div>
              )}
            </div>
            {!showReject ? (
              <div className="flex gap-2">
                <button onClick={() => act('approve')} disabled={!!loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
                  {loading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Lulus
                </button>
                <button onClick={() => setShowReject(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-100">
                  <ShieldX className="w-4 h-4" /> Tolak
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Sebab penolakan..." rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => act('reject')} disabled={!!loading}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Hantar Penolakan
                  </button>
                  <button onClick={() => setShowReject(false)} className="px-3 py-2 text-sm bg-gray-100 rounded-lg">Batal</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
