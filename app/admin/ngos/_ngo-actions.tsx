'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NgoActions({ ngoId, status }: { ngoId: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function update(newStatus: string) {
    setLoading(true)
    await fetch('/api/admin/ngos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ngoId, status: newStatus }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {status === 'pending' && (
        <button onClick={() => update('active')} disabled={loading}
          className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors">
          {loading ? '...' : 'Luluskan'}
        </button>
      )}
      {status === 'active' && (
        <button onClick={() => update('suspended')} disabled={loading}
          className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
          {loading ? '...' : 'Gantung'}
        </button>
      )}
      {status === 'suspended' && (
        <button onClick={() => update('active')} disabled={loading}
          className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors">
          {loading ? '...' : 'Aktifkan'}
        </button>
      )}
    </div>
  )
}
