'use client'

import { useState } from 'react'
import { Loader2, Save, Plus, Trash2 } from 'lucide-react'

const DAYS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']

interface Slot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface Props {
  profileId: string
  initial: Slot[]
}

export default function AvailabilityForm({ profileId, initial }: Props) {
  const [slots, setSlots] = useState<Slot[]>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function addSlot(day: number) {
    setSlots(s => [...s, { id: crypto.randomUUID(), dayOfWeek: day, startTime: '08:00', endTime: '17:00' }])
    setSaved(false)
  }

  function removeSlot(id: string) {
    setSlots(s => s.filter(x => x.id !== id))
    setSaved(false)
  }

  function updateSlot(id: string, key: 'startTime' | 'endTime', val: string) {
    setSlots(s => s.map(x => x.id === id ? { ...x, [key]: val } : x))
    setSaved(false)
  }

  async function save() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/profile/provider/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, slots }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setSaved(true)
    } catch {
      setError('Ralat rangkaian. Cuba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {saved && <div className="bg-[#EEF2FF] border border-[#C7D2FE] text-[#3730A3] text-sm rounded-xl px-4 py-3">Jadual berjaya disimpan!</div>}

      <div className="space-y-3">
        {DAYS.map((day, i) => {
          const daySlots = slots.filter(s => s.dayOfWeek === i)
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 text-sm">{day}</span>
                <button type="button" onClick={() => addSlot(i)}
                  className="flex items-center gap-1 text-xs text-[#6366F1] font-medium hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Tambah masa
                </button>
              </div>
              {daySlots.length === 0 ? (
                <p className="text-xs text-gray-400">Tidak tersedia</p>
              ) : (
                <div className="space-y-2">
                  {daySlots.map(slot => (
                    <div key={slot.id} className="flex items-center gap-2">
                      <input type="time" value={slot.startTime}
                        onChange={e => updateSlot(slot.id, 'startTime', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
                      <span className="text-gray-400 text-sm">hingga</span>
                      <input type="time" value={slot.endTime}
                        onChange={e => updateSlot(slot.id, 'endTime', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
                      <button type="button" onClick={() => removeSlot(slot.id)}
                        className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={save} disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#6366F1] text-white py-3 rounded-xl font-semibold hover:bg-[#4F46E5] disabled:opacity-50 transition-colors">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        Simpan Jadual
      </button>
    </div>
  )
}