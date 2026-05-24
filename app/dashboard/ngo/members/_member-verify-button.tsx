'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'

export default function MemberVerifyButton({ profileId, ngoId, verifiedByNgo }: {
  profileId: string
  ngoId: string
  verifiedByNgo: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    await fetch('/api/ngo/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, ngoId, verifiedByNgo: !verifiedByNgo }),
    })
    router.refresh()
    setLoading(false)
  }

  return verifiedByNgo ? (
    <button onClick={toggle} disabled={loading}
      className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors flex-shrink-0">
      <XCircle className="w-3.5 h-3.5" />
      {loading ? '...' : 'Batal Verify'}
    </button>
  ) : (
    <button onClick={toggle} disabled={loading}
      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors flex-shrink-0">
      <CheckCircle className="w-3.5 h-3.5" />
      {loading ? '...' : 'Sahkan'}
    </button>
  )
}
