'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UserSuspendButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, suspend: isActive }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 flex-shrink-0 ${
        isActive
          ? 'border-red-200 text-red-600 hover:bg-red-50'
          : 'border-blue-200 text-blue-600 hover:bg-blue-50'
      }`}>
      {loading ? '...' : isActive ? 'Suspend' : 'Aktifkan'}
    </button>
  )
}
