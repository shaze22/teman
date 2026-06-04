'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PromoToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter()
  const [active, setActive] = useState(isActive)

  async function toggle() {
    const next = !active
    setActive(next)
    await fetch('/api/admin/promo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: next }),
    })
    router.refresh()
  }

  return (
    <button onClick={toggle}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${active ? 'bg-[#6366F1]' : 'bg-gray-200'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${active ? 'translate-x-4.5' : 'translate-x-1'}`} />
    </button>
  )
}
