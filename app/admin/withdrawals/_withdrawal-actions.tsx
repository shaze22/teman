'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function WithdrawalActions({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showReject, setShowReject] = useState(false)
  const [notes, setNotes] = useState('')

  async function process(action: 'approved' | 'rejected') {
    setLoading(action)
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, notes: notes || undefined }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(null)
      setShowReject(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 min-w-[140px]">
      <button
        onClick={() => process('approved')}
        disabled={!!loading}
        className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors"
      >
        {loading === 'approved' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Approve
      </button>

      {!showReject ? (
        <button
          onClick={() => setShowReject(true)}
          disabled={!!loading}
          className="flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl font-medium text-sm hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          <XCircle className="w-4 h-4" /> Reject
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Rejection reason (optional)..."
            rows={2}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => process('rejected')}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-lg font-medium text-xs hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {loading === 'rejected' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Reject
            </button>
            <button
              onClick={() => { setShowReject(false); setNotes('') }}
              className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
