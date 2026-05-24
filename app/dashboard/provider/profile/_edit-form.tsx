'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'

const SKILLS = [
  { id: 'cooking', label: 'Memasak' },
  { id: 'sewing', label: 'Menjahit' },
  { id: 'massage', label: 'Urut / Urutan' },
  { id: 'elderly_care', label: 'Jaga Orang Tua' },
  { id: 'cleaning', label: 'Bersih Rumah' },
  { id: 'teaching', label: 'Mengajar / Tutor' },
  { id: 'companionship', label: 'Teman Berbual' },
  { id: 'shopping', label: 'Teman Membeli-belah' },
]

const STATES = [
  'Selangor', 'Kuala Lumpur', 'Johor', 'Perak', 'Kedah', 'Pahang',
  'Terengganu', 'Kelantan', 'Negeri Sembilan', 'Melaka', 'Sabah',
  'Sarawak', 'Perlis', 'Pulau Pinang', 'Putrajaya', 'Labuan',
]

const LANGUAGES = [
  { id: 'bm', label: 'Bahasa Melayu' },
  { id: 'en', label: 'English' },
  { id: 'zh', label: 'Mandarin' },
  { id: 'ta', label: 'Tamil' },
]

interface Props {
  initial: {
    fullName: string
    phone: string
    bio: string
    locationState: string
    locationCity: string
    locationPostcode: string
    languages: string[]
    hasTransport: string
    childrenCount: number
    canBringChildren: boolean
    skills: string[]
    pricePerHour: number
  }
}

export default function ProviderEditForm({ initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function set(key: string, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  function toggleArr(key: 'skills' | 'languages', val: string) {
    setForm(f => {
      const arr = f[key] as string[]
      return { ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })
    setSaved(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/profile/provider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          childrenCount: Number(form.childrenCount),
          pricePerHour: Number(form.pricePerHour),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setSaved(true)
      router.refresh()
    } catch {
      setError('Ralat rangkaian. Cuba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const input = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] bg-white'
  const label = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {saved && <div className="bg-[#EEF2FF] border border-[#C7D2FE] text-[#3730A3] text-sm rounded-xl px-4 py-3">Profil berjaya dikemaskini!</div>}

      {/* Personal */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Maklumat Peribadi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Nama Penuh</label>
            <input className={input} value={form.fullName} onChange={e => set('fullName', e.target.value)} required minLength={2} />
          </div>
          <div>
            <label className={label}>No. Telefon</label>
            <input className={input} value={form.phone} onChange={e => set('phone', e.target.value)} required minLength={8} />
          </div>
        </div>
        <div>
          <label className={label}>Bio / Tentang Saya</label>
          <textarea className={`${input} resize-none`} rows={4} value={form.bio}
            onChange={e => set('bio', e.target.value)}
            placeholder="Ceritakan sedikit tentang diri anda, pengalaman, dan perkhidmatan yang anda tawarkan..." />
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Lokasi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>Negeri</label>
            <select className={input} value={form.locationState} onChange={e => set('locationState', e.target.value)} required>
              <option value="">-- Pilih Negeri --</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Bandar / Kawasan</label>
            <input className={input} value={form.locationCity} onChange={e => set('locationCity', e.target.value)} required />
          </div>
          <div>
            <label className={label}>Poskod</label>
            <input className={input} value={form.locationPostcode} onChange={e => set('locationPostcode', e.target.value)} maxLength={5} />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Kemahiran</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SKILLS.map(s => (
            <button key={s.id} type="button"
              onClick={() => toggleArr('skills', s.id)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${form.skills.includes(s.id) ? 'bg-[#6366F1] text-white border-[#6366F1]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#6366F1]'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Languages & Transport */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Bahasa & Pengangkutan</h2>
        <div>
          <label className={label}>Bahasa</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(l => (
              <button key={l.id} type="button"
                onClick={() => toggleArr('languages', l.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.languages.includes(l.id) ? 'bg-[#6366F1] text-white border-[#6366F1]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#6366F1]'}`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={label}>Pengangkutan</label>
          <select className={input} value={form.hasTransport} onChange={e => set('hasTransport', e.target.value)}>
            <option value="none">Tiada Kenderaan</option>
            <option value="motorcycle">Motosikal</option>
            <option value="car">Kereta</option>
          </select>
        </div>
      </div>

      {/* Children & Pricing */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Anak & Harga</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>Bilangan Anak</label>
            <input type="number" min={0} max={15} className={input}
              value={form.childrenCount} onChange={e => set('childrenCount', e.target.value)} />
          </div>
          <div>
            <label className={label}>Harga / Jam (RM)</label>
            <input type="number" min={5} step={1} className={input}
              value={form.pricePerHour} onChange={e => set('pricePerHour', e.target.value)} required />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.canBringChildren}
                onChange={e => set('canBringChildren', e.target.checked)}
                className="w-4 h-4 accent-[#6366F1]" />
              <span className="text-sm text-gray-700">Boleh bawa anak semasa bertugas</span>
            </label>
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#6366F1] text-white py-3 rounded-xl font-semibold hover:bg-[#4F46E5] disabled:opacity-50 transition-colors">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        Simpan Perubahan
      </button>
    </form>
  )
}