'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

const STEPS = ['Maklumat Asas', 'Kemahiran & Lokasi', 'Harga & Ketersediaan', 'Sahkan']

type FormData = {
  fullName: string
  email: string
  phone: string
  password: string
  locationState: string
  locationCity: string
  locationPostcode: string
  skills: string[]
  languages: string[]
  hasTransport: string
  bio: string
  pricePerHour: string
  childrenCount: string
  canBringChildren: boolean
  ngoReferralCode: string
}

const initial: FormData = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  locationState: '',
  locationCity: '',
  locationPostcode: '',
  skills: [],
  languages: ['bm'],
  hasTransport: 'none',
  bio: '',
  pricePerHour: '',
  childrenCount: '0',
  canBringChildren: false,
  ngoReferralCode: '',
}

export default function ProviderRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof FormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleSkill(id: string) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(id)
        ? prev.skills.filter((s) => s !== id)
        : [...prev.skills, id],
    }))
  }

  function toggleLanguage(id: string) {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(id)
        ? prev.languages.filter((l) => l !== id)
        : [...prev.languages, id],
    }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          phone: form.phone,
          role: 'single_mother',
        },
      },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Pendaftaran gagal. Sila cuba lagi.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/register/provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, userId: data.user.id }),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.message ?? 'Pendaftaran gagal.')
      setLoading(false)
      return
    }

    router.push('/dashboard/provider?welcome=true')
  }

  function nextStep() {
    if (step < STEPS.length - 1) setStep(step + 1)
    else handleSubmit()
  }

  const canProceed = () => {
    if (step === 0) return form.fullName && form.email && form.phone && form.password.length >= 8
    if (step === 1) return form.locationState && form.locationCity && form.skills.length > 0
    if (step === 2) return form.pricePerHour && parseFloat(form.pricePerHour) >= 10
    return true
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-12">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Heart className="w-8 h-8 text-[#6366F1]" fill="currentColor" />
          <span className="text-2xl font-bold text-[#6366F1]">Teman</span>
        </Link>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-colors ${
                  i < step
                    ? 'bg-[#6366F1] text-white'
                    : i === step
                    ? 'bg-[#6366F1] text-white ring-4 ring-[#E0E7FF]'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-[#6366F1]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{STEPS[step]}</h2>
          <p className="text-sm text-gray-500 mb-6">Langkah {step + 1} daripada {STEPS.length}</p>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 border border-red-100">
              {error}
            </div>
          )}

          {/* Step 0: Basic info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Penuh</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition-all"
                  placeholder="Nama seperti di IC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telefon</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition-all"
                  placeholder="01X-XXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition-all"
                  placeholder="email@contoh.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kata Laluan</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition-all"
                  placeholder="Minimum 8 aksara"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kod Rujukan NGO (pilihan)</label>
                <input
                  type="text"
                  value={form.ngoReferralCode}
                  onChange={(e) => update('ngoReferralCode', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition-all"
                  placeholder="Masukkan kod NGO jika ada"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <input type="checkbox" id="bil-count" className="w-4 h-4 accent-[#6366F1]" required />
                <label htmlFor="bil-count">
                  Saya bersetuju dengan{' '}
                  <Link href="/terms" className="text-[#6366F1] underline">Terma & Syarat</Link> dan{' '}
                  <Link href="/privacy" className="text-[#6366F1] underline">Dasar Privasi</Link>
                </label>
              </div>
            </div>
          )}

          {/* Step 1: Skills & Location */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kemahiran Saya</label>
                <div className="grid grid-cols-2 gap-2">
                  {SKILLS.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.skills.includes(skill.id)
                          ? 'border-[#6366F1] bg-[#EEF2FF] text-[#6366F1]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {skill.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Negeri</label>
                <select
                  value={form.locationState}
                  onChange={(e) => update('locationState', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] bg-white"
                >
                  <option value="">-- Pilih Negeri --</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bandar / Kawasan</label>
                <input
                  type="text"
                  value={form.locationCity}
                  onChange={(e) => update('locationCity', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                  placeholder="Contoh: Puchong, Subang Jaya"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bahasa yang Dikuasai</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => toggleLanguage(lang.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                        form.languages.includes(lang.id)
                          ? 'border-[#6366F1] bg-[#EEF2FF] text-[#6366F1]'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pengangkutan</label>
                <select
                  value={form.hasTransport}
                  onChange={(e) => update('hasTransport', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] bg-white"
                >
                  <option value="none">Tiada kenderaan sendiri</option>
                  <option value="motorcycle">Ada motor</option>
                  <option value="car">Ada kereta</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Pricing & Availability */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga per Jam (RM)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">RM</span>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={form.pricePerHour}
                    onChange={(e) => update('pricePerHour', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                    placeholder="25"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Minimum RM10 / maksimum RM100 per jam</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cerita Tentang Diri Saya</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => update('bio', e.target.value)}
                  rows={4}
                  maxLength={300}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] resize-none"
                  placeholder="Ceritakan pengalaman, kemahiran, dan kenapa anda ingin menjadi Teman..."
                />
                <p className="text-xs text-gray-400 text-right mt-1">{form.bio.length}/300</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bilangan Anak</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={form.childrenCount}
                  onChange={(e) => update('childrenCount', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="bring-children"
                  checked={form.canBringChildren}
                  onChange={(e) => update('canBringChildren', e.target.checked)}
                  className="w-4 h-4 accent-[#6366F1]"
                />
                <label htmlFor="bring-children" className="text-sm text-gray-700">
                  Saya mungkin perlu bawa anak semasa bertugas
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-[#EEF2FF] rounded-xl p-4 space-y-3">
                <Row label="Nama" value={form.fullName} />
                <Row label="Email" value={form.email} />
                <Row label="Telefon" value={form.phone} />
                <Row label="Negeri" value={form.locationState} />
                <Row label="Bandar" value={form.locationCity} />
                <Row label="Kemahiran" value={form.skills.map((s) => SKILLS.find((sk) => sk.id === s)?.label).join(', ')} />
                <Row label="Harga" value={`RM${form.pricePerHour}/jam`} />
                <Row label="Pengangkutan" value={form.hasTransport === 'none' ? 'Tiada' : form.hasTransport === 'motorcycle' ? 'Motor' : 'Kereta'} />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Profil anda akan disemak oleh NGO atau admin sebelum diaktifkan.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Balik
              </button>
            )}
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed() || loading}
              className="flex-1 bg-[#6366F1] text-white font-semibold py-3 rounded-xl hover:bg-[#4F46E5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {step === STEPS.length - 1 ? 'Daftar Sekarang' : (
                <>Seterusnya <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  )
}
