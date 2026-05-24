'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { sosId: string; status: 'resolved' | 'false_alarm'; label: string; variant?: 'ghost' }

export default function SosResolveButton({ sosId, status, label, variant }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function resolve() {
    setLoading(true)
    await fetch('/api/admin/sos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sosId, status }),
    })
    router.refresh()
    setLoading(false)
  }

  if (variant === 'ghost') {
    return (
      <button onClick={resolve} disabled={loading}
        className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors border border-red-200 rounded-lg hover:bg-red-50">
        {loading ? '...' : label}
      </button>
    )
  }

  return (
    <button onClick={resolve} disabled={loading}
      className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors">
      {loading ? '...' : label}
    </button>
  )
}
