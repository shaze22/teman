'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Heart, Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang-context'

function GoogleRegisterButton() {
  const [loading, setLoading] = useState(false)
  async function handleGoogle() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback` },
    })
  }
  return (
    <button onClick={handleGoogle} disabled={loading}
      className="w-full flex items-center justify-center gap-3 border border-gray-200 bg-white text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60 text-sm mb-4">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      Daftar dengan Google
    </button>
  )
}

const STATES = [
  'Selangor', 'Kuala Lumpur', 'Johor', 'Perak', 'Kedah', 'Pahang',
  'Terengganu', 'Kelantan', 'Negeri Sembilan', 'Melaka', 'Sabah',
  'Sarawak', 'Perlis', 'Pulau Pinang', 'Putrajaya', 'Labuan',
]

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
  ngoReferralCode: string
  referralCode: string
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
  ngoReferralCode: '',
  referralCode: '',
}

export default function CustomerRegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLang()
  const rc = t.registerCustomer

  const STEPS = [rc.step0, rc.step1, rc.step2, rc.step3]
  const NEEDS = [
    { id: 'job', label: rc.needJob },
    { id: 'food', label: rc.needFood },
    { id: 'learning', label: rc.needLearning },
    { id: 'business', label: rc.needBusiness },
  ]

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) update('referralCode', ref.toUpperCase())
  }, [searchParams])

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
      setError(rc.errorEmailUsed)
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/register/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, userId: data.user.id }),
    })

    if (!res.ok) {
      let message = rc.errorFailed
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
          <span className="text-2xl font-bold text-[#6366F1]">SenioCare</span>
        </Link>

        {/* Google quick register */}
        <GoogleRegisterButton />
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
          <div className="relative flex justify-center"><span className="bg-[#F8FAFC] px-3 text-xs text-gray-400">atau daftar dengan email</span></div>
        </div>

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
          <p className="text-sm text-gray-500 mb-6">{rc.stepOf} {step + 1} {rc.stepFrom} {STEPS.length}</p>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 border border-red-100">
              {error}
            </div>
          )}

          {/* Step 0: Registrant info */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="bg-[#FFF1F2] rounded-xl p-4 mb-4">
                <p className="text-sm text-orange-800 font-medium mb-3">{rc.registering}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => update('isForSelf', true)}
                    className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                      form.isForSelf ? 'border-[#F43F5E] bg-[#FFE4E6] text-[#F43F5E]' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {rc.forSelf}
                  </button>
                  <button
                    type="button"
                    onClick={() => update('isForSelf', false)}
                    className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                      !form.isForSelf ? 'border-[#F43F5E] bg-[#FFE4E6] text-[#F43F5E]' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {rc.asGuardian}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{rc.fullName}</label>
                <input type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] transition-all"
                  placeholder={rc.fullNamePlaceholder} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{rc.phone}</label>
                <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] transition-all"
                  placeholder="01X-XXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{rc.email}</label>
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] transition-all"
                  placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{rc.password}</label>
                <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] transition-all"
                  placeholder={rc.passwordPlaceholder} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {rc.referralCode} <span className="text-gray-400 font-normal">{rc.optional}</span>
                </label>
                <input type="text" value={form.referralCode} onChange={(e) => update('referralCode', e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] transition-all font-mono uppercase"
                  placeholder={rc.referralCodePlaceholder} />
                <p className="text-xs text-gray-400 mt-1">{rc.referralCodeHint}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {rc.ngoCode} <span className="text-gray-400 font-normal">{rc.optional}</span>
                </label>
                <input type="text" value={form.ngoReferralCode} onChange={(e) => update('ngoReferralCode', e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] transition-all font-mono uppercase"
                  placeholder={rc.ngoCodePlaceholder} />
                <p className="text-xs text-gray-400 mt-1">{rc.ngoCodeHint}</p>
              </div>
            </div>
          )}

          {/* Step 1: Senior info */}
          {step === 1 && (
            <div className="space-y-4">
              {!form.isForSelf && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{rc.seniorName}</label>
                    <input type="text" value={form.seniorFullName} onChange={(e) => update('seniorFullName', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                      placeholder={rc.seniorNamePlaceholder} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{rc.seniorAge}</label>
                    <input type="number" min="50" max="120" value={form.seniorAge} onChange={(e) => update('seniorAge', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                      placeholder={rc.seniorAgePlaceholder} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{rc.seniorPhone}</label>
                    <input type="tel" value={form.seniorPhone} onChange={(e) => update('seniorPhone', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                      placeholder={rc.seniorPhonePlaceholder} />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{rc.state}</label>
                <select value={form.locationState} onChange={(e) => update('locationState', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] bg-white">
                  <option value="">{rc.stateDefault}</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{rc.city}</label>
                <input type="text" value={form.locationCity} onChange={(e) => update('locationCity', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                  placeholder={rc.cityPlaceholder} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{rc.mobility}</label>
                <select value={form.mobilityStatus} onChange={(e) => update('mobilityStatus', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] bg-white">
                  <option value="independent">{rc.mobilityIndependent}</option>
                  <option value="walking_stick">{rc.mobilityStick}</option>
                  <option value="wheelchair">{rc.mobilityWheelchair}</option>
                  <option value="bedridden">{rc.mobilityImmobile}</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Needs & Emergency */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{rc.needsTitle}</label>
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
                <p className="text-sm font-semibold text-gray-900 mb-3">{rc.emergency}</p>
                <div className="space-y-3">
                  <input type="text" value={form.emergencyName} onChange={(e) => update('emergencyName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                    placeholder={rc.emergencyNamePlaceholder} />
                  <input type="text" value={form.emergencyRelation} onChange={(e) => update('emergencyRelation', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                    placeholder={rc.emergencyRelationPlaceholder} />
                  <input type="tel" value={form.emergencyPhone} onChange={(e) => update('emergencyPhone', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                    placeholder={rc.emergencyPhonePlaceholder} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-[#FFF1F2] rounded-xl p-4 space-y-3">
                <Row label={rc.reviewName} value={form.fullName} />
                <Row label={rc.reviewEmail} value={form.email} />
                <Row label={rc.reviewPhone} value={form.phone} />
                <Row label={rc.reviewType} value={form.isForSelf ? rc.reviewSelf : rc.reviewGuardian} />
                {!form.isForSelf && <Row label={rc.reviewSenior} value={form.seniorFullName} />}
                <Row label={rc.reviewState} value={form.locationState} />
                <Row label={rc.reviewCity} value={form.locationCity} />
                <Row label={rc.reviewService} value={form.needs.map((n) => NEEDS.find((nd) => nd.id === n)?.label ?? n).join(', ')} />
                <Row label={rc.reviewEmergency} value={`${form.emergencyName} (${form.emergencyPhone})`} />
                {form.ngoReferralCode && <Row label={rc.reviewNgoCode} value={form.ngoReferralCode} />}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4" /> {rc.back}
              </button>
            )}
            <button type="button" onClick={nextStep} disabled={!canProceed() || loading}
              className="flex-1 bg-[#F43F5E] text-white font-semibold py-3 rounded-xl hover:bg-[#E11D48] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {step === STEPS.length - 1 ? rc.submit : (
                <>{rc.next} <ChevronRight className="w-4 h-4" /></>
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
