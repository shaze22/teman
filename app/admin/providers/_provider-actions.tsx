'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, ShieldCheck, ShieldOff } from 'lucide-react'

type Props = {
  profileId: string
  userId: string
  verifiedByAdmin: boolean
  isActive: boolean
  bgCheck: string
}

export default function ProviderActions({ profileId, userId, verifiedByAdmin, isActive, bgCheck }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function update(body: object) {
    setLoading(true)
    await fetch('/api/admin/providers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, userId, ...body }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-1">
      {!verifiedByAdmin ? (
        <button
          onClick={() => update({ verifiedByAdmin: true, bgCheck: 'approved' })}
          disabled={loading}
          title="Sahkan (Admin)"
          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" /> Sahkan
        </button>
      ) : (
        <button
          onClick={() => update({ verifiedByAdmin: false })}
          disabled={loading}
          title="Batalkan pengesahan"
          className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <XCircle className="w-3.5 h-3.5" /> Batal Verify
        </button>
      )}

      {isActive ? (
        <button
          onClick={() => update({ suspend: true })}
          disabled={loading}
          title="Suspend akaun"
          className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          <ShieldOff className="w-3.5 h-3.5" /> Suspend
        </button>
      ) : (
        <button
          onClick={() => update({ suspend: false })}
          disabled={loading}
          title="Aktifkan semula"
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Aktifkan
        </button>
      )}
    </div>
  )
}
