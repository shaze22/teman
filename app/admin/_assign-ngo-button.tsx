'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2 } from 'lucide-react'

type Ngo = { id: string; name: string }

interface Props {
  type: 'provider' | 'customer'
  profileId: string
  currentNgoId?: string | null
}

export default function AssignNgoButton({ type, profileId, currentNgoId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [ngos, setNgos] = useState<Ngo[]>([])
  const [selected, setSelected] = useState(currentNgoId ?? '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && ngos.length === 0) {
      fetch('/api/admin/ngos')
        .then(r => r.json())
        .then(data => setNgos(data ?? []))
        .catch(() => {})
    }
  }, [open, ngos.length])

  async function save() {
    setLoading(true)
    await fetch('/api/admin/assign-ngo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, profileId, ngoId: selected || null }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="Assign NGO"
        className="flex items-center gap-1 px-3 py-1.5 border border-[#6366F1]/30 text-[#6366F1] text-xs font-medium rounded-lg hover:bg-[#EEF2FF] transition-colors"
      >
        <Building2 className="w-3.5 h-3.5" />
        {currentNgoId ? 'Tukar NGO' : 'Assign NGO'}
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64">
          <p className="text-xs font-semibold text-gray-500 mb-2">Pilih NGO</p>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#6366F1] bg-white mb-3"
          >
            <option value="">— Tiada NGO —</option>
            {ngos.map(n => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1 bg-[#6366F1] text-white text-xs font-semibold py-2 rounded-lg hover:bg-[#4F46E5] disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Simpan
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
