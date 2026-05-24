'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
]

const STEPS = ['Maklumat Waris', 'Maklumat Warga Emas', 'Keperluan', 'Sahkan']

type FormData = {
  fullName: string
  email: string
  phone: string
  password: string
  isForSelf: boolean
  seniorFullName: string
  seniorAge: string
  seniorPhone: string
  locationState: string
  locationCity: string
  locationPostcode: string
  mobilityStatus: string
  dietaryRequirements: string[]
  needs: string[]
  emergencyName: string
  emergencyRelation: string
  emergencyPhone: string
}

const initial: FormData = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  isForSelf: false,
  seniorFullName: '',
  seniorAge: '',
  seniorPhone: '',
  locationState: '',
  locationCity: '',
  locationPostcode: '',
  mobilityStatus: 'independent',
  dietaryRequirements: [],
  needs: ['job'],
  emergencyName: '',
  emergencyRelation: '',
  emergencyPhone: '',
}

export default function CustomerRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof FormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleNeed(id: string) {
    setForm((prev) => ({
      ...prev,
      needs: prev.needs.includes(id) ? prev.needs.filter((n) => n !== id) : [...prev.needs, id],
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
          role: form.isForSelf ? 'customer' : 'waris',
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Email ini mungkin sudah didaftarkan. Cuba log masuk atau gunakan email lain.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/register/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, userId: data.user.id }),
    })

    if (!res.ok) {
      let message = 'Pendaftaran gagal.'
      try {
        const json = await res.json()
        message = json.message ?? message
      } catch {}
      setError(message)
      setLoading(false)
      return
    }

    router.push('/dashboard/customer?welcome=true')
  }

  function nextStep() {
    if (step < STEPS.length - 1) setStep(step + 1)
    else handleSubmit()
  }

  const canProceed = () => {
    if (step === 0) return form.fullName && form.email && form.phone && form.password.length >= 8
    if (step === 1) return (form.isForSelf || form.seniorFullName) && form.locationState && form.locationCity
    if (step === 2) return form.needs.length > 0 && form.emergencyName && form.emergencyPhone
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
                  i < step ? 'bg-[#F43F5E] text-white' : i === step ? 'bg-[#F43F5E] text-white ring-4 ring-[#FFE4E6]' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-[#F43F5E]' : 'bg-gray-200'}`} />
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

          {/* Step 0: Registrant info */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="bg-[#FFF1F2] rounded-xl p-4 mb-4">
                <p className="text-sm text-orange-800 font-medium mb-3">Anda mendaftar sebagai...</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => update('isForSelf', true)}
                    className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                      form.isForSelf ? 'border-[#F43F5E] bg-[#FFE4E6] text-[#F43F5E]' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    Diri Sendiri
                  </button>
                  <button
                    type="button"
                    onClick={() => update('isForSelf', false)}
                    className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                      !form.isForSelf ? 'border-[#F43F5E] bg-[#FFE4E6] text-[#F43F5E]' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    Sebagai Waris
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Penuh Anda</label>
                <input type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] transition-all"
                  placeholder="Nama anda" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telefon</label>
                <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] transition-all"
                  placeholder="01X-XXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] transition-all"
                  placeholder="email@contoh.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kata Laluan</label>
                <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] transition-all"
                  placeholder="Minimum 8 aksara" />
              </div>
            </div>
          )}

          {/* Step 1: Senior info */}
          {step === 1 && (
            <div className="space-y-4">
              {!form.isForSelf && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Warga Emas</label>
                    <input type="text" value={form.seniorFullName} onChange={(e) => update('seniorFullName', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                      placeholder="Nama orang tua anda" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Umur</label>
                    <input type="number" min="50" max="120" value={form.seniorAge} onChange={(e) => update('seniorAge', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                      placeholder="Contoh: 72" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telefon Warga Emas</label>
                    <input type="tel" value={form.seniorPhone} onChange={(e) => update('seniorPhone', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                      placeholder="01X-XXXXXXXX (jika ada)" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Negeri</label>
                <select value={form.locationState} onChange={(e) => update('locationState', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] bg-white">
                  <option value="">-- Pilih Negeri --</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bandar / Kawasan</label>
                <input type="text" value={form.locationCity} onChange={(e) => update('locationCity', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                  placeholder="Contoh: Damansara Perdana" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Keupayaan Mobiliti</label>
                <select value={form.mobilityStatus} onChange={(e) => update('mobilityStatus', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] bg-white">
                  <option value="independent">Boleh berjalan sendiri</option>
                  <option value="walking_stick">Guna tongkat</option>
                  <option value="wheelchair">Guna kerusi roda</option>
                  <option value="bedridden">Tidak dapat berjalan</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Needs & Emergency */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Perkhidmatan yang Diperlukan</label>
                <div className="space-y-2">
                  {NEEDS.map((need) => (
                    <button
                      key={need.id}
                      type="button"
                      onClick={() => toggleNeed(need.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.needs.includes(need.id) ? 'border-[#F43F5E] bg-[#FFF1F2] text-[#F43F5E]' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {need.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900 mb-3">Kenalan Kecemasan</p>
                <div className="space-y-3">
                  <input type="text" value={form.emergencyName} onChange={(e) => update('emergencyName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                    placeholder="Nama kenalan kecemasan" />
                  <input type="text" value={form.emergencyRelation} onChange={(e) => update('emergencyRelation', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                    placeholder="Hubungan (contoh: Anak, Adik-beradik)" />
                  <input type="tel" value={form.emergencyPhone} onChange={(e) => update('emergencyPhone', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                    placeholder="No. telefon kecemasan" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-[#FFF1F2] rounded-xl p-4 space-y-3">
                <Row label="Nama" value={form.fullName} />
                <Row label="Email" value={form.email} />
                <Row label="Telefon" value={form.phone} />
                <Row label="Jenis" value={form.isForSelf ? 'Diri Sendiri' : 'Waris'} />
                {!form.isForSelf && <Row label="Warga Emas" value={form.seniorFullName} />}
                <Row label="Negeri" value={form.locationState} />
                <Row label="Bandar" value={form.locationCity} />
                <Row label="Perkhidmatan" value={form.needs.map((n) => NEEDS.find((nd) => nd.id === n)?.label).join(', ')} />
                <Row label="Kenalan Kecemasan" value={`${form.emergencyName} (${form.emergencyPhone})`} />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Balik
              </button>
            )}
            <button type="button" onClick={nextStep} disabled={!canProceed() || loading}
              className="flex-1 bg-[#F43F5E] text-white font-semibold py-3 rounded-xl hover:bg-[#E11D48] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
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
