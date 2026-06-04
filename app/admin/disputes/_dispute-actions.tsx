'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DisputeActions({ disputeId, currentStatus }: { disputeId: string; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function update(status: string) {
    setLoading(status)
    await fetch(`/api/admin/disputes?id=${disputeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolution: resolution || undefined, adminNotes: adminNotes || undefined }),
    })
    setLoading(null)
    setShowForm(false)
    router.refresh()
  }

  if (currentStatus === 'resolved' || currentStatus === 'closed') {
    return <span className="text-xs text-gray-400 italic">Selesai</span>
  }

  return (
    <div className="space-y-2">
      {!showForm ? (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => update('investigating')} disabled={!!loading || currentStatus === 'investigating'}
            className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200 disabled:opacity-40 transition-colors">
            {loading === 'investigating' ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Sedang Disiasat'}
          </button>
          <button onClick={() => setShowForm(true)}
            className="px-3 py-1.5 text-xs bg-[#6366F1] text-white rounded-lg font-medium hover:bg-[#4F46E5] transition-colors">
            Selesaikan
          </button>
          <button onClick={() => update('closed')} disabled={!!loading}
            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-40 transition-colors">
            Tutup
          </button>
        </div>
      ) : (
        <div className="space-y-2 bg-gray-50 rounded-xl p-3">
          <textarea value={resolution} onChange={e => setResolution(e.target.value)}
            placeholder="Resolusi untuk pelanggan..." rows={2}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366F1] resize-none" />
          <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
            placeholder="Nota admin (tidak ditunjuk kepada pengguna)..." rows={2}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366F1] resize-none" />
          <div className="flex gap-2">
            <button onClick={() => update('resolved')} disabled={!!loading}
              className="flex-1 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-40 flex items-center justify-center gap-1">
              {loading === 'resolved' ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Selesai
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg font-medium">Batal</button>
          </div>
        </div>
      )}
    </div>
  )
}
