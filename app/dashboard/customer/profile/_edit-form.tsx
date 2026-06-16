'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { useLang } from '@/lib/lang-context'

const STATES = [
  'Selangor', 'Kuala Lumpur', 'Johor', 'Perak', 'Kedah', 'Pahang',
  'Terengganu', 'Kelantan', 'Negeri Sembilan', 'Melaka', 'Sabah',
  'Sarawak', 'Perlis', 'Pulau Pinang', 'Putrajaya', 'Labuan',
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
  const { t } = useLang()
  const cf = t.customerEditForm

  const NEEDS = [
    { id: 'job', label: cf.needJob },
    { id: 'food', label: cf.needFood },
    { id: 'learning', label: cf.needLearning },
    { id: 'business', label: cf.needBusiness },
    { id: 'companionship', label: cf.needCompanionship },
    { id: 'shopping', label: cf.needShopping },
  ]

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
      setError(cf.errorNetwork)
    } finally {
      setLoading(false)
    }
  }

  const input = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-white'
  const label = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {saved && <div className="bg-[#F0FDFA] border border-[#99F6E4] text-[#134E4A] text-sm rounded-xl px-4 py-3">{cf.profileSaved}</div>}

      {/* Personal */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">{cf.personalTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>{cf.fullName}</label>
            <input className={input} value={form.fullName} onChange={e => set('fullName', e.target.value)} required minLength={2} />
          </div>
          <div>
            <label className={label}>{cf.phone}</label>
            <input className={input} value={form.phone} onChange={e => set('phone', e.target.value)} required minLength={8} />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.isForSelf} onChange={e => set('isForSelf', e.target.checked)} className="w-4 h-4 accent-teal-600" />
            <span className="text-sm text-gray-700">{cf.bookForSelf}</span>
          </label>
        </div>
      </div>

      {/* Senior info (if waris) */}
      {!form.isForSelf && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">{cf.seniorTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className={label}>{cf.seniorName}</label>
              <input className={input} value={form.seniorFullName} onChange={e => set('seniorFullName', e.target.value)} />
            </div>
            <div>
              <label className={label}>{cf.seniorAge}</label>
              <input type="number" min={50} max={120} className={input} value={form.seniorAge} onChange={e => set('seniorAge', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={label}>{cf.seniorPhone}</label>
            <input className={input} value={form.seniorPhone} onChange={e => set('seniorPhone', e.target.value)} placeholder={cf.seniorPhonePlaceholder} />
          </div>
        </div>
      )}

      {/* Location */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">{cf.locationTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>{cf.state}</label>
            <select className={input} value={form.locationState} onChange={e => set('locationState', e.target.value)} required>
              <option value="">{cf.stateDefault}</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>{cf.city}</label>
            <input className={input} value={form.locationCity} onChange={e => set('locationCity', e.target.value)} required />
          </div>
          <div>
            <label className={label}>{cf.postcode}</label>
            <input className={input} value={form.locationPostcode} onChange={e => set('locationPostcode', e.target.value)} maxLength={5} />
          </div>
        </div>
        <div>
          <label className={label}>{cf.mobilityLabel}</label>
          <select className={input} value={form.mobilityStatus} onChange={e => set('mobilityStatus', e.target.value)}>
            <option value="independent">{cf.mobilityIndependent}</option>
            <option value="walking_stick">{cf.mobilityStick}</option>
            <option value="wheelchair">{cf.mobilityWheelchair}</option>
            <option value="bedridden">{cf.mobilityBedridden}</option>
          </select>
        </div>
      </div>

      {/* Needs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">{cf.needsTitle}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {NEEDS.map(n => (
            <button key={n.id} type="button"
              onClick={() => toggleNeed(n.id)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${form.needs.includes(n.id) ? 'bg-[#0D9488] text-white border-[#0D9488]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0D9488]'}`}>
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency contact */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">{cf.emergencyTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>{cf.emergencyName}</label>
            <input className={input} value={form.emergencyName} onChange={e => set('emergencyName', e.target.value)} required minLength={2} />
          </div>
          <div>
            <label className={label}>{cf.emergencyRelation}</label>
            <input className={input} value={form.emergencyRelation} onChange={e => set('emergencyRelation', e.target.value)} placeholder={cf.emergencyRelationPlaceholder} />
          </div>
        </div>
        <div>
          <label className={label}>{cf.emergencyPhone}</label>
          <input className={input} value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} required minLength={8} />
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#0D9488] text-white py-3 rounded-xl font-semibold hover:bg-[#0F766E] disabled:opacity-50 transition-colors">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {cf.saveBtn}
      </button>
    </form>
  )
}
