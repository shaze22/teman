'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteAccountButton() {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
    if (res.ok) {
      router.push('/')
    } else {
      setLoading(false)
      setConfirm(false)
    }
  }

  if (confirm) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-red-600 font-medium">Adakah anda pasti? Tindakan ini tidak boleh dibatalkan.</p>
        <div className="flex gap-2">
          <button onClick={handleDelete} disabled={loading}
            className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
            {loading ? 'Memproses...' : 'Ya, Padam Akaun Saya'}
          </button>
          <button onClick={() => setConfirm(false)}
            className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Batal
          </button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirm(true)}
      className="px-4 py-2 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors">
      Padam Akaun
    </button>
  )
}
