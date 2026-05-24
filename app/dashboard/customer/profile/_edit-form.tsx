'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'

const STATES = [
  'Selangor', 'Kuala Lumpur', 'Johor', 'Perak', 'Kedah', 'Pahang',
  'Terengganu', 'Kelantan', 'Negeri Sembilan', 'Melaka', 'Sabah',
  'Sarawak', 'Perlis', 'Pulau Pinang', 'Putrajaya', 'Labuan',
]

const NEEDS = [
  { id: 'job', label: 'Teman Kerja / Penjagaan' },
  { id: 'food', label: 'Teman Makan' },
  { id: 'learning', label: 'Teman Belajar' },
  { id: 'business', label: 'Teman Bisnes' },
  { id: 'companionship', label: 'Teman Berbual' },
  { id: 'shopping', label: 'Teman Membeli-belah' },
]

interface Props {
  initial: {
    fullName: string
    phone: string
    isForSelf: boolean
    seniorFullName: string
    seniorAge: string
    seniorPhone: string
    locationState: string
    locationCity: string
    locationPostcode: string
    mobilityStatus: string
    needs: string[]
    emergencyName: string
    emergencyRelation: string
    emergencyPhone: string
  }
}

export default function CustomerEditForm({ initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function set(key: string, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  function toggleNeed(id: string) {
    setForm(f => ({
      ...f,
      needs: f.needs.includes(id) ? f.needs.filter(x => x !== id) : [...f.needs, id],
    }))
    setSaved(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/profile/customer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          seniorAge: form.seniorAge ? Number(form.seniorAge) : undefined,
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

  const input = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F43F5E] bg-white'
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
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.isForSelf} onChange={e => set('isForSelf', e.target.checked)} className="w-4 h-4 accent-[#F43F5E]" />
            <span className="text-sm text-gray-700">Saya tempah untuk diri sendiri (bukan untuk warga emas)</span>
          </label>
        </div>
      </div>

      {/* Senior info (if waris) */}
      {!form.isForSelf && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Maklumat Warga Emas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className={label}>Nama Warga Emas</label>
              <input className={input} value={form.seniorFullName} onChange={e => set('seniorFullName', e.target.value)} />
            </div>
            <div>
              <label className={label}>Umur</label>
              <input type="number" min={50} max={120} className={input} value={form.seniorAge} onChange={e => set('seniorAge', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={label}>No. Telefon Warga Emas</label>
            <input className={input} value={form.seniorPhone} onChange={e => set('seniorPhone', e.target.value)} placeholder="Jika ada" />
          </div>
        </div>
      )}

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
        <div>
          <label className={label}>Status Mobiliti Warga Emas / Diri Sendiri</label>
          <select className={input} value={form.mobilityStatus} onChange={e => set('mobilityStatus', e.target.value)}>
            <option value="independent">Berdikari / Boleh bergerak sendiri</option>
            <option value="walking_stick">Perlukan tongkat / walker</option>
            <option value="wheelchair">Pengguna kerusi roda</option>
            <option value="bedridden">Terbaring / Perlu penjagaan penuh</option>
          </select>
        </div>
      </div>

      {/* Needs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Keperluan Perkhidmatan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {NEEDS.map(n => (
            <button key={n.id} type="button"
              onClick={() => toggleNeed(n.id)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${form.needs.includes(n.id) ? 'bg-[#F43F5E] text-white border-[#F43F5E]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#F43F5E]'}`}>
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency contact */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Kenalan Kecemasan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Nama</label>
            <input className={input} value={form.emergencyName} onChange={e => set('emergencyName', e.target.value)} required minLength={2} />
          </div>
          <div>
            <label className={label}>Hubungan</label>
            <input className={input} value={form.emergencyRelation} onChange={e => set('emergencyRelation', e.target.value)} placeholder="Contoh: Anak, Suami" />
          </div>
        </div>
        <div>
          <label className={label}>No. Telefon</label>
          <input className={input} value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} required minLength={8} />
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#F43F5E] text-white py-3 rounded-xl font-semibold hover:bg-[#E11D48] disabled:opacity-50 transition-colors">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        Simpan Perubahan
      </button>
    </form>
  )
}
