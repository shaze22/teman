'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, MapPin, CheckCircle2, ShieldCheck, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useLang } from '@/lib/lang-context'

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

const BANGSA_OPTIONS = [
  'Melayu', 'Cina', 'India', 'Iban', 'Kadazan/Dusun', 'Orang Asli', 'Lain-lain',
]

const AGE_RANGE_OPTIONS = [
  '20-25', '26-30', '31-35', '36-40', '41-45', '46-50', '50+',
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
    lat?: number | null
    lng?: number | null
    bangsa?: string | null
    ageRange?: string | null
    icNumber?: string | null
    icSubmittedAt?: string | null
    icVerified?: boolean
    icRejectedReason?: string | null
    gallery?: { id: string; image_url: string; title: string | null }[]
  }
}

export default function ProviderEditForm({ initial }: Props) {
  const router = useRouter()
  const { t } = useLang()
  const pf = t.providerEditForm

  const SKILLS = [
    { id: 'cooking', label: t.skills.cooking },
    { id: 'sewing', label: t.skills.sewing },
    { id: 'massage', label: t.skills.massage },
    { id: 'elderly_care', label: t.skills.elderly_care },
    { id: 'cleaning', label: t.skills.cleaning },
    { id: 'teaching', label: t.skills.teaching },
    { id: 'companionship', label: t.skills.companionship },
    { id: 'shopping', label: t.skills.shopping },
  ]

  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const [locSaved, setLocSaved] = useState(!!(initial.lat && initial.lng))

  const [icNumber, setIcNumber] = useState(initial.icNumber ?? '')
  const [icFront, setIcFront] = useState<File | null>(null)
  const [icBack, setIcBack] = useState<File | null>(null)
  const [icLoading, setIcLoading] = useState(false)
  const [icMsg, setIcMsg] = useState<string | null>(null)

  const [gallery, setGallery] = useState(initial.gallery ?? [])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [galleryCaption, setGalleryCaption] = useState('')
  const [galleryFile, setGalleryFile] = useState<File | null>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

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

  function captureLocation() {
    if (!navigator.geolocation) return
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('lat', pos.coords.latitude)
        set('lng', pos.coords.longitude)
        setLocSaved(true)
        setLocLoading(false)
      },
      () => {
        setError(pf.errorLocation)
        setLocLoading(false)
      }
    )
  }

  async function submitIC(e: React.FormEvent) {
    e.preventDefault()
    if (!icFront || !icBack) { setIcMsg(pf.icMissingFiles); return }
    setIcLoading(true)
    setIcMsg(null)
    const fd = new FormData()
    fd.append('icNumber', icNumber)
    fd.append('front', icFront)
    fd.append('back', icBack)
    const res = await fetch('/api/profile/provider/ic', { method: 'POST', body: fd })
    const data = await res.json()
    setIcMsg(res.ok ? pf.icSuccess : data.message)
    setIcLoading(false)
    if (res.ok) router.refresh()
  }

  async function uploadGalleryPhoto() {
    if (!galleryFile) return
    setGalleryLoading(true)
    const fd = new FormData()
    fd.append('file', galleryFile)
    if (galleryCaption) fd.append('caption', galleryCaption)
    const res = await fetch('/api/profile/provider/gallery', { method: 'POST', body: fd })
    if (res.ok) {
      const item = await res.json()
      setGallery(prev => [...prev, item])
      setGalleryFile(null)
      setGalleryCaption('')
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
    setGalleryLoading(false)
  }

  async function deleteGalleryPhoto(id: string) {
    await fetch('/api/profile/provider/gallery', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setGallery(prev => prev.filter(p => p.id !== id))
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
      setError(pf.errorNetwork)
    } finally {
      setLoading(false)
    }
  }

  const input = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] bg-white'
  const label = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {saved && <div className="bg-[#EEF2FF] border border-[#C7D2FE] text-[#3730A3] text-sm rounded-xl px-4 py-3">{pf.profileSaved}</div>}

      {/* Personal */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">{pf.personalTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>{pf.fullName}</label>
            <input className={input} value={form.fullName} onChange={e => set('fullName', e.target.value)} required minLength={2} />
          </div>
          <div>
            <label className={label}>{pf.phone}</label>
            <input className={input} value={form.phone} onChange={e => set('phone', e.target.value)} required minLength={8} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>{pf.race}</label>
            <select className={input} value={form.bangsa ?? ''} onChange={e => set('bangsa', e.target.value || null)}>
              <option value="">{pf.raceDefault}</option>
              {BANGSA_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>{pf.ageRange}</label>
            <select className={input} value={form.ageRange ?? ''} onChange={e => set('ageRange', e.target.value || null)}>
              <option value="">{pf.ageRangeDefault}</option>
              {AGE_RANGE_OPTIONS.map(r => <option key={r} value={r}>{r} {pf.ageUnit}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={label}>{pf.bio}</label>
          <textarea className={`${input} resize-none`} rows={4} value={form.bio}
            onChange={e => set('bio', e.target.value)}
            placeholder={pf.bioPlaceholder} />
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">{pf.locationTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>{pf.state}</label>
            <select className={input} value={form.locationState} onChange={e => set('locationState', e.target.value)} required>
              <option value="">{pf.stateDefault}</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>{pf.city}</label>
            <input className={input} value={form.locationCity} onChange={e => set('locationCity', e.target.value)} required />
          </div>
          <div>
            <label className={label}>{pf.postcode}</label>
            <input className={input} value={form.locationPostcode} onChange={e => set('locationPostcode', e.target.value)} maxLength={5} />
          </div>
        </div>
        <div className="pt-1">
          <p className="text-xs text-gray-500 mb-2">{pf.gpsHint}</p>
          <button
            type="button"
            onClick={captureLocation}
            disabled={locLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              locSaved
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#6366F1] hover:text-[#6366F1]'
            }`}
          >
            {locLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : locSaved ? <CheckCircle2 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            {locLoading ? pf.gpsLoading : locSaved ? pf.gpsSaved : pf.gpsShare}
          </button>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">{pf.skillsTitle}</h2>
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
        <h2 className="font-semibold text-gray-900">{pf.langTransportTitle}</h2>
        <div>
          <label className={label}>{pf.language}</label>
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
          <label className={label}>{pf.transport}</label>
          <select className={input} value={form.hasTransport} onChange={e => set('hasTransport', e.target.value)}>
            <option value="none">{pf.transportNone}</option>
            <option value="motorcycle">{pf.transportMotorcycle}</option>
            <option value="car">{pf.transportCar}</option>
          </select>
        </div>
      </div>

      {/* Children & Pricing */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">{pf.childrenPriceTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>{pf.childrenCount}</label>
            <input type="number" min={0} max={15} className={input}
              value={form.childrenCount} onChange={e => set('childrenCount', e.target.value)} />
          </div>
          <div>
            <label className={label}>{pf.pricePerHour}</label>
            <input type="number" min={5} step={1} className={input}
              value={form.pricePerHour} onChange={e => set('pricePerHour', e.target.value)} required />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.canBringChildren}
                onChange={e => set('canBringChildren', e.target.checked)}
                className="w-4 h-4 accent-[#6366F1]" />
              <span className="text-sm text-gray-700">{pf.canBringChildren}</span>
            </label>
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#6366F1] text-white py-3 rounded-xl font-semibold hover:bg-[#4F46E5] disabled:opacity-50 transition-colors">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {pf.saveBtn}
      </button>

      {/* IC Verification */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#6366F1]" />
          <h2 className="font-semibold text-gray-900">{pf.icTitle}</h2>
          {initial.icVerified && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{pf.icVerified}</span>}
          {initial.icSubmittedAt && !initial.icVerified && !initial.icRejectedReason && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">{pf.icPending}</span>
          )}
          {initial.icRejectedReason && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{pf.icRejected}</span>}
        </div>
        {initial.icRejectedReason && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{pf.icRejectedReason} {initial.icRejectedReason}</p>
        )}
        {!initial.icVerified && (
          <form onSubmit={submitIC} className="space-y-3">
            <div>
              <label className={label}>{pf.icNumber}</label>
              <input className={input} value={icNumber} onChange={e => setIcNumber(e.target.value)}
                placeholder="901231-14-5678" pattern="\d{6}-\d{2}-\d{4}" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>{pf.icFront}</label>
                <input type="file" accept="image/*" onChange={e => setIcFront(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#EEF2FF] file:text-[#6366F1] hover:file:bg-[#C7D2FE] transition-all" required />
              </div>
              <div>
                <label className={label}>{pf.icBack}</label>
                <input type="file" accept="image/*" onChange={e => setIcBack(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#EEF2FF] file:text-[#6366F1] hover:file:bg-[#C7D2FE] transition-all" required />
              </div>
            </div>
            {icMsg && <p className={`text-sm rounded-lg px-3 py-2 ${icMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{icMsg}</p>}
            <button type="submit" disabled={icLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#6366F1] text-white text-sm font-semibold rounded-xl hover:bg-[#4F46E5] disabled:opacity-50 transition-colors">
              {icLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {pf.icSubmit}
            </button>
          </form>
        )}
        {initial.icVerified && (
          <p className="text-sm text-emerald-600">{pf.icVerifiedNote}</p>
        )}
      </div>

      {/* Gallery */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#6366F1]" />
          <h2 className="font-semibold text-gray-900">{pf.galleryTitle}</h2>
          <span className="text-xs text-gray-400">{gallery.length}/10 foto</span>
        </div>

        {gallery.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {gallery.map(p => (
              <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                <img src={p.image_url} alt={p.title ?? ''} className="w-full h-full object-cover" />
                <button onClick={() => deleteGalleryPhoto(p.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {gallery.length < 10 && (
          <div className="space-y-2">
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={e => setGalleryFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#EEF2FF] file:text-[#6366F1] hover:file:bg-[#C7D2FE]" />
            <input className={input} value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)} placeholder={pf.galleryCaption} />
            <button type="button" onClick={uploadGalleryPhoto} disabled={!galleryFile || galleryLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors">
              {galleryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              {pf.galleryUpload}
            </button>
          </div>
        )}
      </div>
    </form>
  )
}
