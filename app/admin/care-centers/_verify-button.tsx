'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function AdminVerifyCareCenterButton({ centerId, userId }: { centerId: string; userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function verify() {
    setLoading(true)
    await fetch('/api/admin/care-centers/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ centerId, userId }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={verify}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
      Sahkan
    </button>
  )
}
