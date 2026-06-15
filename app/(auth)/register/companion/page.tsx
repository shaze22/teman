'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Heart, Loader2, ChevronRight, ChevronLeft, Check,
  Camera, Upload, ShieldCheck, AlertCircle, RefreshCw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STATES = [
  'Selangor','Kuala Lumpur','Johor','Perak','Kedah','Pahang',
  'Terengganu','Kelantan','Negeri Sembilan','Melaka','Sabah',
  'Sarawak','Perlis','Pulau Pinang','Putrajaya','Labuan',
]

type Step = 0 | 1 | 2 | 3 | 4

function StepDot({ n, current, done }: { n: number; current: number; done: boolean }) {
  const active = n === current
  const past = done || n < current
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
      active ? 'bg-[#0D9488] text-white' : past ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
    }`}>
      {past && !active ? <Check className="w-4 h-4" /> : n + 1}
    </div>
  )
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      resolve({ base64, mimeType: file.type || 'image/jpeg' })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function RegisterCompanionPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 0: Info Asas
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [locationState, setLocationState] = useState('')
  const [locationCity, setLocationCity] = useState('')

  // Step 1: IC
  const [icFront, setIcFront] = useState<File | null>(null)
  const [icFrontPreview, setIcFrontPreview] = useState('')
  const [icBack, setIcBack] = useState<File | null>(null)
  const [icBackPreview, setIcBackPreview] = useState('')

  // Step 2: Selfie
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')

  // Step 3: Verify
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'loading' | 'pass' | 'fail'>('idle')
  const [verifyMsg, setVerifyMsg] = useState('')

  // Referral
  const [referralCode, setReferralCode] = useState('')
  const [referralValid, setReferralValid] = useState<boolean | null>(null)

  // Step 4: Consent
  const [consent1, setConsent1] = useState(false)
  const [consent2, setConsent2] = useState(false)
  const [consent3, setConsent3] = useState(false)
  const [consent4, setConsent4] = useState(false)
  const [consent5, setConsent5] = useState(false)
  const [done, setDone] = useState(false)

  // Read referral code from cookie on mount
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)ref_code=([^;]+)/)
    if (match) setReferralCode(decodeURIComponent(match[1]))
  }, [])

  // Camera
  const startCamera = useCallback(async () => {
    setCameraError('')
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        videoRef.current.onloadedmetadata = () => setCameraReady(true)
      }
    } catch {
      setCameraError('Kamera tidak dapat diakses. Sila benarkan akses kamera.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    setCameraReady(false)
  }, [stream])

  useEffect(() => {
    if (step === 2) startCamera()
    else stopCamera()
    return () => { if (step === 2) stopCamera() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
      setSelfieFile(file)
      setSelfiePreview(URL.createObjectURL(blob))
      stopCamera()
    }, 'image/jpeg', 0.9)
  }

  function retakeSelfie() {
    setSelfieFile(null)
    setSelfiePreview('')
    startCamera()
  }

  // Gemini verify auto-run when entering step 3
  useEffect(() => {
    if (step !== 3 || verifyStatus !== 'idle') return
    runVerify()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  async function runVerify() {
    if (!icFront || !selfieFile) {
      setVerifyStatus('fail')
      setVerifyMsg('Gambar IC atau selfie tiada. Cuba semula.')
      return
    }
    setVerifyStatus('loading')
    try {
      const [ic, selfie] = await Promise.all([fileToBase64(icFront), fileToBase64(selfieFile)])
      const res = await fetch('/api/auth/register/companion/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          icBase64: ic.base64, icMimeType: ic.mimeType,
          selfieBase64: selfie.base64, selfieMimeType: selfie.mimeType,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Ralat verifikasi')

      if (data.faceMatch && data.icAuthentic && data.isAdult) {
        setVerifyStatus('pass')
        setVerifyMsg(data.confidence === 'high' ? 'Muka disahkan dengan keyakinan tinggi.' : 'Muka disahkan.')
      } else {
        setVerifyStatus('fail')
        const issues: string[] = data.issues ?? []
        if (!data.faceMatch) issues.unshift('Muka dalam selfie tidak sepadan dengan IC.')
        if (!data.icAuthentic) issues.unshift('IC tidak kelihatan sah. Pastikan gambar IC jelas.')
        if (!data.isAdult) issues.unshift('Umur tidak mencukupi (mestilah 18 tahun ke atas).')
        setVerifyMsg(issues.slice(0, 2).join(' '))
      }
    } catch (err) {
      setVerifyStatus('fail')
      setVerifyMsg(err instanceof Error ? err.message : 'Ralat semasa verifikasi.')
    }
  }

  // Age check
  function isAdult() {
    if (!dob) return false
    const age = (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    return age >= 18
  }

  // Step validation
  function canNext(): boolean {
    if (step === 0) return !!(fullName.trim() && email.trim() && password.length >= 8 && phone.trim() && dob && isAdult() && locationState && locationCity.trim())
    if (step === 1) return !!icFront
    if (step === 2) return !!selfieFile
    if (step === 3) return verifyStatus === 'pass'
    if (step === 4) return consent1 && consent2 && consent3 && consent4 && consent5
    return false
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone, role: 'companion' } },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Pendaftaran gagal. Cuba semula.')
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.append('userId', data.user.id)
    formData.append('fullName', fullName)
    formData.append('email', email)
    formData.append('phone', phone)
    formData.append('locationState', locationState)
    formData.append('locationCity', locationCity)
    formData.append('geminiPassed', 'true')
    if (icFront) formData.append('icFront', icFront)
    if (icBack)  formData.append('icBack', icBack)
    if (selfieFile) formData.append('selfie', selfieFile)
    if (referralCode) formData.append('referralCode', referralCode)

    const res = await fetch('/api/auth/register/companion', { method: 'POST', body: formData })

    if (!res.ok) {
      const json = await res.json()
      setError(json.message ?? 'Ralat semasa mendaftar.')
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  function next() {
    if (step === 4) { handleSubmit(); return }
    setStep((s) => (s + 1) as Step)
  }
  function back() { setStep((s) => Math.max(0, s - 1) as Step) }

  const stepLabels = ['Info Asas', 'Muat Naik IC', 'Selfie', 'Verifikasi', 'Persetujuan']

  if (done) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mb-6">
        <ShieldCheck className="w-10 h-10 text-teal-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang, Rakan Teman!</h1>
      <p className="text-gray-500 max-w-sm mb-8">Akaun anda telah didaftarkan dan IC telah disahkan. Mulakan perjalanan anda sebagai Companion SenioCare.</p>
      <Link href="/dashboard/provider"
        className="inline-flex items-center gap-2 bg-[#0D9488] text-white font-semibold px-8 py-3 rounded-full hover:bg-[#0F766E] transition-colors">
        Pergi ke Dashboard <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-7 h-7 text-[#0D9488]" fill="currentColor" />
            <span className="text-xl font-bold text-[#0D9488]">SenioCare</span>
          </Link>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="flex flex-col items-center gap-1">
                <StepDot n={i} current={step} done={false} />
                <span className="text-xs text-gray-400 hidden sm:block w-14 text-center leading-tight">{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`w-6 h-px mb-4 ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* STEP 0: Info Asas */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Maklumat Asas</h2>
              <Input label="Nama Penuh (seperti dalam IC)" value={fullName} onChange={setFullName} placeholder="Contoh: Siti Aminah binti Kassim" />
              <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="email@example.com" />
              <Input label="Kata Laluan (min. 8 aksara)" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
              <Input label="No. Telefon" type="tel" value={phone} onChange={setPhone} placeholder="0112345678" />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Tarikh Lahir <span className="text-gray-400">(mestilah 18 tahun ke atas)</span></label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30" />
                {dob && !isAdult() && <p className="text-xs text-red-500 mt-1">Anda mesti berumur 18 tahun ke atas.</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Negeri</label>
                <select value={locationState} onChange={e => setLocationState(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30">
                  <option value="">Pilih negeri...</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Input label="Bandar / Kawasan" value={locationCity} onChange={setLocationCity} placeholder="Contoh: Subang Jaya" />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Kod Referral <span className="text-gray-400 font-normal">(Pilihan)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={e => { setReferralCode(e.target.value.toUpperCase()); setReferralValid(null) }}
                    placeholder="Contoh: AB1CD234"
                    maxLength={10}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 font-mono tracking-widest uppercase"
                  />
                  {referralCode && (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch(`/api/referral/check?code=${referralCode}`)
                        setReferralValid(res.ok)
                      }}
                      className="px-3 py-2 text-xs bg-teal-50 text-[#0D9488] rounded-xl font-medium hover:bg-teal-100 transition-colors"
                    >
                      Semak
                    </button>
                  )}
                </div>
                {referralValid === true && <p className="text-xs text-emerald-600 mt-1">✓ Kod sah anda dan rakan anda akan dapat RM10 selepas sesi pertama!</p>}
                {referralValid === false && <p className="text-xs text-red-500 mt-1">Kod tidak sah. Cuba semak semula.</p>}
              </div>
            </div>
          )}

          {/* STEP 1: IC Upload */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Muat Naik Kad Pengenalan</h2>
              <p className="text-sm text-gray-500">Pastikan IC jelas, tidak kabur, dan boleh dibaca sepenuhnya.</p>

              <FileUpload label="IC Bahagian Hadapan *" preview={icFrontPreview} onFile={(f, prev) => { setIcFront(f); setIcFrontPreview(prev) }} />
              <FileUpload label="IC Bahagian Belakang (pilihan)" preview={icBackPreview} onFile={(f, prev) => { setIcBack(f); setIcBackPreview(prev) }} />
            </div>
          )}

          {/* STEP 2: Selfie */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Ambil Selfie</h2>
              <p className="text-sm text-gray-500">Pastikan muka anda jelas, cahaya mencukupi, dan tiada topeng.</p>

              {!selfiePreview ? (
                <div className="relative">
                  {cameraError ? (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-red-600 mb-3">{cameraError}</p>
                      <button onClick={startCamera} className="text-sm text-[#0D9488] underline">Cuba semula</button>
                    </div>
                  ) : (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted
                        className="w-full rounded-xl bg-black aspect-[4/3] object-cover" />
                      <canvas ref={canvasRef} className="hidden" />
                      <button onClick={capturePhoto} disabled={!cameraReady}
                        className="mt-3 w-full flex items-center justify-center gap-2 bg-[#0D9488] text-white font-semibold py-3 rounded-xl hover:bg-[#0F766E] disabled:opacity-50 transition-colors">
                        <Camera className="w-5 h-5" /> Ambil Gambar
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <img src={selfiePreview} alt="Selfie" className="w-full rounded-xl aspect-[4/3] object-cover" />
                  <button onClick={retakeSelfie}
                    className="mt-3 w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                    <RefreshCw className="w-4 h-4" /> Ambil Semula
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Verify */}
          {step === 3 && (
            <div className="text-center space-y-5 py-4">
              <h2 className="text-lg font-bold text-gray-900">Pengesahan Identiti</h2>

              {verifyStatus === 'loading' && (
                <div>
                  <Loader2 className="w-12 h-12 text-[#0D9488] animate-spin mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Sedang mengesahkan identiti anda...</p>
                  <p className="text-xs text-gray-400 mt-1">AI sedang membandingkan muka dalam IC dengan selfie anda</p>
                </div>
              )}

              {verifyStatus === 'pass' && (
                <div>
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="text-emerald-700 font-bold text-lg">Identiti Disahkan ✓</p>
                  <p className="text-sm text-gray-500 mt-1">{verifyMsg}</p>
                  <p className="text-sm text-gray-500 mt-2">Teruskan ke langkah seterusnya untuk melengkapkan pendaftaran.</p>
                </div>
              )}

              {verifyStatus === 'fail' && (
                <div>
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-700 font-bold text-lg">Pengesahan Gagal</p>
                  <p className="text-sm text-gray-500 mt-1">{verifyMsg}</p>
                  <div className="flex gap-3 justify-center mt-4">
                    <button onClick={() => { setStep(1); setIcFront(null); setIcFrontPreview('') }}
                      className="text-sm px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                      Tukar IC
                    </button>
                    <button onClick={() => { setStep(2); setSelfieFile(null); setSelfiePreview('') }}
                      className="text-sm px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                      Ambil Semula Selfie
                    </button>
                  </div>
                  <button onClick={() => { setVerifyStatus('idle'); runVerify() }}
                    className="mt-2 text-xs text-[#0D9488] underline">
                    Cuba semula dengan gambar yang sama
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Consent */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Persetujuan & Pengakuan</h2>
              <p className="text-sm text-gray-500">Sila baca dan tandakan semua pernyataan di bawah sebelum mendaftar.</p>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs text-amber-700 font-medium">⚠️ Penting: Pelanggaran terma boleh menyebabkan akaun ditangguhkan dan tindakan undang-undang diambil.</p>
              </div>

              {[
                { state: consent1, set: setConsent1, text: 'Saya faham bahawa SenioCare adalah platform companion untuk warga emas Malaysia. Saya TIDAK akan menawarkan sebarang perkhidmatan yang menyalahi undang-undang Malaysia.' },
                { state: consent2, set: setConsent2, text: 'Saya TIDAK akan menawarkan perkhidmatan yang tidak senonoh, tidak bermoral, atau bertentangan dengan nilai dan budaya Malaysia.' },
                { state: consent3, set: setConsent3, text: 'Saya faham bahawa SenioCare adalah platform penghubung sahaja dan tidak memberi nasihat perubatan. Saya berperanan sebagai teman kepada warga emas, bukan penjaga kesihatan berlesen.' },
                { state: consent4, set: setConsent4, text: 'Saya bersetuju dengan Terma Perkhidmatan dan Dasar Privasi SenioCare.' },
                { state: consent5, set: setConsent5, text: 'Saya mengesahkan bahawa semua maklumat yang diberikan adalah benar dan IC yang dimuat naik adalah milik saya sendiri.' },
              ].map((c, i) => (
                <label key={i} className="flex items-start gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-colors ${c.state ? 'bg-[#0D9488] border-[#0D9488]' : 'border-gray-300 group-hover:border-teal-500'}`}
                    onClick={() => c.set(!c.state)}>
                    {c.state && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-700 leading-relaxed">{c.text}</span>
                </label>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={back} disabled={step === 0 || loading}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Kembali
            </button>

            {step !== 3 && (
              <button onClick={next} disabled={!canNext() || loading}
                className="flex items-center gap-2 bg-[#0D9488] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0F766E] disabled:opacity-50 transition-colors text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {step === 4 ? 'Daftar Sekarang' : 'Seterusnya'}
                {!loading && step !== 4 && <ChevronRight className="w-4 h-4" />}
              </button>
            )}

            {step === 3 && verifyStatus === 'pass' && (
              <button onClick={next}
                className="flex items-center gap-2 bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors text-sm">
                Seterusnya <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Sudah ada akaun?{' '}
          <Link href="/login" className="text-[#0D9488] font-semibold hover:underline">Log Masuk</Link>
        </p>
      </div>
    </div>
  )
}

// Reusable input
function Input({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30" />
    </div>
  )
}

// File upload with preview
function FileUpload({ label, preview, onFile }: {
  label: string; preview: string; onFile: (f: File, preview: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onFile(file, url)
  }
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">{label}</label>
      {preview ? (
        <div className="relative">
          <img src={preview} alt="IC" className="w-full rounded-xl object-cover max-h-48" />
          <button onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
            Tukar
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-teal-500 hover:bg-teal-50/30 transition-colors group">
          <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#0D9488]" />
          <span className="text-sm text-gray-500 group-hover:text-[#0D9488]">Klik untuk muat naik gambar IC</span>
          <span className="text-xs text-gray-400">JPG, PNG · Maks 5MB</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  )
}
