'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, CheckCircle2, ShieldCheck, Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react'

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

const SERVICE_LABELS: Record<string, string> = {
  nursing: 'Jururawat Berlesen',
  physiotherapy: 'Fisioterapi',
  home_care: 'Pembantu Penjagaan',
  medical_escort: 'Pendamping Perubatan',
  riadah: 'Riadah Bersama',
  ibadah: 'Ibadah Bersama',
  makan: 'Makan Bersama',
}

const PRICING_UNIT: Record<string, string> = {
  per_hour: '/jam',
  per_session: '/sesi',
  per_day: '/hari',
  per_task: '/tugas',
  per_meal: '/hidangan',
}

interface Props {
  initial: {
    fullName: string
    phone: string
    bio: string
    locationState: string
    locationCity: string
    languages: string[]
    hasTransport: string
    icVerified: boolean
    licenseVerified: boolean
    licenseRejectionReason: string | null
    pricing: Array<{ id: string; service_type: string; pricing_type: string; price: number }>
    gallery: Array<{ id: string; image_url: string; title: string | null }>
  }
}

export default function ProviderEditForm({ initial }: Props) {
  const router = useRouter()

  const [form, setForm] = useState({
    fullName: initial.fullName,
    phone: initial.phone,
    bio: initial.bio,
    locationState: initial.locationState,
    locationCity: initial.locationCity,
    languages: initial.languages,
    hasTransport: initial.hasTransport,
  })
  const [prices, setPrices] = useState<Record<string, number>>(
    Object.fromEntries(initial.pricing.map(p => [p.id, p.price]))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [gallery, setGallery] = useState(initial.gallery)
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [galleryCaption, setGalleryCaption] = useState('')
  const [galleryFile, setGalleryFile] = useState<File | null>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  function set(key: string, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  function toggleLanguage(val: string) {
    setForm(f => {
      const arr = f.languages
      return { ...f, languages: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })
    setSaved(false)
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
    await fetch('/api/profile/provider/gallery', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setGallery(prev => prev.filter(p => p.id !== id))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const pricingUpdates = initial.pricing.map(p => ({
        id: p.id,
        price: prices[p.id] ?? p.price,
      }))
      const res = await fetch('/api/profile/provider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, pricingUpdates }),
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

  const input = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {saved && (
        <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Profil berjaya disimpan.
        </div>
      )}

      {/* Personal */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Maklumat Peribadi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nama Penuh</label>
            <input className={input} value={form.fullName} onChange={e => set('fullName', e.target.value)} required minLength={2} />
          </div>
          <div>
            <label className={labelCls}>No. Telefon</label>
            <input className={input} value={form.phone} onChange={e => set('phone', e.target.value)} required minLength={8} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Bio / Tentang Anda</label>
          <textarea className={`${input} resize-none`} rows={4} value={form.bio}
            onChange={e => set('bio', e.target.value)}
            placeholder="Ceritakan pengalaman, kelayakan dan cara anda membantu warga emas..." />
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Lokasi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Negeri</label>
            <select className={input} value={form.locationState} onChange={e => set('locationState', e.target.value)} required>
              <option value="">-- Pilih negeri --</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Bandar / Daerah</label>
            <input className={input} value={form.locationCity} onChange={e => set('locationCity', e.target.value)} required placeholder="cth. Petaling Jaya" />
          </div>
        </div>
      </div>

      {/* Languages & Transport */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Bahasa & Pengangkutan</h2>
        <div>
          <label className={labelCls}>Bahasa yang dikuasai</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(l => (
              <button key={l.id} type="button"
                onClick={() => toggleLanguage(l.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.languages.includes(l.id) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-500'}`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Pengangkutan Sendiri</label>
          <select className={input} value={form.hasTransport} onChange={e => set('hasTransport', e.target.value)}>
            <option value="none">Tiada</option>
            <option value="motorcycle">Motorsikal</option>
            <option value="car">Kereta</option>
          </select>
        </div>
      </div>

      {/* Pricing */}
      {initial.pricing.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Harga Perkhidmatan (RM)</h2>
          <p className="text-xs text-gray-500">Tetapkan harga untuk setiap perkhidmatan yang anda tawarkan.</p>
          <div className="space-y-3">
            {initial.pricing.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <label className="text-sm text-gray-700 flex-1 min-w-0 truncate">
                  {SERVICE_LABELS[p.service_type] ?? p.service_type}
                  <span className="text-gray-400 ml-1">{PRICING_UNIT[p.pricing_type] ?? ''}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-500">RM</span>
                  <input
                    type="number"
                    min={5}
                    step={1}
                    value={prices[p.id] ?? p.price}
                    onChange={e => { setPrices(prev => ({ ...prev, [p.id]: Number(e.target.value) })); setSaved(false) }}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        Simpan Perubahan
      </button>

      {/* Verification Status */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <h2 className="font-semibold text-gray-900">Status Pengesahan</h2>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">IC Disahkan</span>
            {initial.icVerified ? (
              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Disahkan
              </span>
            ) : (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">Menunggu</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Sijil Profesional</span>
            {initial.licenseVerified ? (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Disahkan
              </span>
            ) : initial.licenseRejectionReason ? (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Ditolak</span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Tiada / Menunggu</span>
            )}
          </div>
          {initial.licenseRejectionReason && (
            <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              Sebab ditolak: {initial.licenseRejectionReason}
            </div>
          )}
        </div>
        {!initial.icVerified && (
          <p className="text-xs text-gray-500">Untuk hantar semula IC atau sijil, hubungi sokongan kami.</p>
        )}
      </div>

      {/* Gallery */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-teal-600" />
          <h2 className="font-semibold text-gray-900">Galeri Foto</h2>
          <span className="text-xs text-gray-400">{gallery.length}/10 foto</span>
        </div>

        {gallery.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {gallery.map(p => (
              <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                <img src={p.image_url} alt={p.title ?? ''} className="w-full h-full object-cover" />
                <button type="button" onClick={() => deleteGalleryPhoto(p.id)}
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
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              value={galleryCaption}
              onChange={e => setGalleryCaption(e.target.value)}
              placeholder="Kapsyen (pilihan)"
            />
            <button type="button" onClick={uploadGalleryPhoto} disabled={!galleryFile || galleryLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors">
              {galleryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              Muat Naik Foto
            </button>
          </div>
        )}
      </div>
    </form>
  )
}
