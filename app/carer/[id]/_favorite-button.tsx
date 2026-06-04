'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useLang } from '@/lib/lang-context'

export default function FavoriteButton({ providerId }: { providerId: string }) {
  const { t } = useLang()
  const pp = t.profilePage

  const [isFav, setIsFav] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/favorites')
      .then((r) => {
        if (!r.ok) return null
        return r.json()
      })
      .then((data) => {
        if (data?.favorites) {
          setIsFav((data.favorites as string[]).includes(providerId))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [providerId])

  async function toggle() {
    if (saving) return
    setSaving(true)
    const method = isFav ? 'DELETE' : 'POST'
    try {
      const res = await fetch('/api/favorites', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      })
      if (res.ok) setIsFav(!isFav)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-400"
      >
        <Heart className="w-4 h-4" />
        {pp.save}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`w-full flex items-center justify-center gap-2 py-3 border rounded-xl text-sm font-semibold transition-all ${
        isFav
          ? 'bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100'
          : 'bg-white border-gray-200 text-gray-600 hover:border-[#6366F1] hover:text-[#6366F1]'
      }`}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${isFav ? 'text-rose-500' : ''}`}
        fill={isFav ? 'currentColor' : 'none'}
      />
      {isFav ? pp.saved : pp.save}
    </button>
  )
}
