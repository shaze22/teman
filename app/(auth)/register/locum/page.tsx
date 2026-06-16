'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Heart, Loader2, ChevronRight, ChevronLeft, Check,
  Camera, Upload, ShieldCheck, AlertCircle, RefreshCw,
  Stethoscope, Activity, Home, Car, Users, Award,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STATES = [
  'Selangor','Kuala Lumpur','Johor','Perak','Kedah','Pahang',
  'Terengganu','Kelantan','Negeri Sembilan','Melaka','Sabah',
  'Sarawak','Perlis','Pulau Pinang','Putrajaya','Labuan',
]

const ROLES = [
  {
    id: 'locum_nurse',
    label: 'Jururawat Berlesen',
    labelEn: 'Licensed Nurse',
    icon: Stethoscope,
    badge: 'LJM Verified',
    desc: 'SRN / SEM — Lembaga Jururawat Malaysia',
    requiresLicense: true,
    licenseType: 'LJM_SRN' as const,
    color: 'border-teal-300 bg-teal-50 text-teal-700',
  },
  {
    id: 'locum_physio',
    label: 'Ahli Fisioterapi',
    labelEn: 'Physiotherapist',
    icon: Activity,
    badge: 'LFM Verified',
    desc: 'Lembaga Fisioterapi Malaysia',
    requiresLicense: true,
    licenseType: 'LFM' as const,
    color: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  },
  {
    id: 'locum_care_aide',
    label: 'Pembantu Penjagaan',
    labelEn: 'Home Care Aide',
    icon: Home,
    badge: 'IHRAM Certified',
    desc: 'Sijil Homecare IHRAM atau setaraf',
    requiresLicense: true,
    licenseType: 'IHRAM_HOMECARE' as const,
    color: 'border-blue-300 bg-blue-50 text-blue-700',
  },
  {
    id: 'medical_escort',
    label: 'Pendamping Perubatan',
    labelEn: 'Medical Escort',
    icon: Car,
    badge: 'IC + Selfie',
    desc: 'Teman ke hospital / klinik — IC + selfie sahaja',
    requiresLicense: false,
    licenseType: null,
    color: 'border-purple-300 bg-purple-50 text-purple-700',
  },
  {
    id: 'companion',
    label: 'Pendamping',
    labelEn: 'Companion',
    icon: Users,
    badge: 'IC + Selfie',
    desc: 'Riadah, Ibadah, Makan Bersama — IC + selfie sahaja',
    requiresLicense: false,
    licenseType: null,
    color: 'border-rose-300 bg-rose-50 text-rose-700',
  },
]

const LICENSE_TYPE_MAP: Record<string, string[]> = {
  locum_nurse: ['LJM_SRN', 'LJM_SEM'],
  locum_physio: ['LFM'],
  locum_care_aide: ['IHRAM_HOMECARE', 'KKM_PARAMEDIC', 'OTHER'],
}

const LICENSE_LABELS: Record<string, string> = {
  LJM_SRN: 'Jururawat Berdaftar (SRN) — Lembaga Jururawat Malaysia',
  LJM_SEM: 'Jururawat Enrolled (SEM) — Lembaga Jururawat Malaysia',
  LFM: 'Ahli Fisioterapi Berdaftar — Lembaga Fisioterapi Malaysia',
  IHRAM_HOMECARE: 'Sijil Homecare — Institut Homecare Malaysia',
  KKM_PARAMEDIC: 'Pembantu Perubatan KKM',
  OTHER: 'Lain-lain (nyatakan dalam nota)',
}

type Step = 0 | 1 | 2 | 3 | 4

function StepBar({ step, totalSteps }: { step: Step; totalSteps: number }) {
  const labels = ['Peranan', 'Info Asas', 'Pengesahan IC', 'Sijil Profesional', 'Persetujuan']
  return (
    <div className="flex items-center gap-1 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center gap-1 flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
            i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-400'
          }`}>
            {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <div className={`hidden sm:block text-xs ${i === step ? 'text-teal-600 font-medium' : 'text-slate-400'}`}>
            {labels[i]}
          </div>
          {i < totalSteps - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  )
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve({ base64: dataUrl.split(',')[1], mimeType: file.type || 'image/jpeg' })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function RegisterLocumPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [step, setStep] = useState<Step>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 0 — Role
  const [selectedRole, setSelectedRole] = useState('')

  // Step 1 — Basic info
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')

  // Step 2 — IC + selfie
  const [icFront, setIcFront] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [geminiPassed, setGeminiPassed] = useState(false)
  const [geminiMsg, setGeminiMsg] = useState('')

  // Step 3 — Professional license
  const [licenseType, setLicenseType] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [licenseExpiry, setLicenseExpiry] = useState('')

  // Step 4 — Consent
  const [consents, setConsents] = useState<boolean[]>([false, false, false, false, false])

  const selectedRoleObj = ROLES.find(r => r.id === selectedRole)
  const requiresLicense = selectedRoleObj?.requiresLicense ?? false
  const totalSteps: number = requiresLicense ? 5 : 4
  const availableLicenseTypes = selectedRole ? (LICENSE_TYPE_MAP[selectedRole] ?? []) : []

  // Step 2 — camera helpers
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setCameraActive(true)
    } catch {
      setError('Kamera tidak dapat diakses. Sila pastikan kebenaran kamera dibenarkan.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }, [])

  const captureSelfie = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    canvas.toBlob(blob => {
      if (blob) setSelfieFile(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.9)
    stopCamera()
  }, [stopCamera])

  const verifyWithGemini = async () => {
    if (!icFront || !selfieFile) { setError('Sila muat naik IC dan ambil selfie terlebih dahulu.'); return }
    setLoading(true); setError(''); setGeminiMsg('')
    try {
      const [icData, selfieData] = await Promise.all([fileToBase64(icFront), fileToBase64(selfieFile)])
      const res = await fetch('/api/auth/register/companion/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icBase64: icData.base64, icMimeType: icData.mimeType, selfieBase64: selfieData.base64, selfieMimeType: selfieData.mimeType }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || data.message || 'Pengesahan gagal.'); return }
      if (data.faceMatch && data.icAuthentic && data.isAdult) {
        setGeminiPassed(true)
        setGeminiMsg('IC dan wajah disahkan berjaya.')
      } else {
        setError(`Pengesahan gagal: ${data.issues?.join(', ') || 'IC atau wajah tidak sepadan.'}`)
      }
    } catch {
      setError('Ralat rangkaian. Sila cuba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!consents.every(Boolean)) { setError('Sila tandakan semua kotak persetujuan.'); return }
    setLoading(true); setError('')
    try {
      const formData = new FormData()
      formData.append('role', selectedRole)
      formData.append('fullName', fullName)
      formData.append('email', email)
      formData.append('password', password)
      formData.append('phone', phone)
      formData.append('locationState', state)
      formData.append('locationCity', city)
      if (icFront) formData.append('icFile', icFront)
      if (selfieFile) formData.append('selfieFile', selfieFile)
      if (requiresLicense && licenseFile) {
        formData.append('licenseFile', licenseFile)
        formData.append('licenseType', licenseType)
        formData.append('licenseNumber', licenseNumber)
        if (licenseExpiry) formData.append('licenseExpiry', licenseExpiry)
      }
      formData.append('providerConsent', 'true')

      const res = await fetch('/api/auth/register/locum', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Pendaftaran gagal.'); return }

      const supabase = createClient()
      await supabase.auth.signInWithPassword({ email, password })
      router.push('/dashboard/provider?welcome=true')
    } catch {
      setError('Ralat rangkaian. Sila cuba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    setError('')
    if (step === 0) {
      if (!selectedRole) { setError('Sila pilih peranan anda.'); return }
      setStep(1)
    } else if (step === 1) {
      if (!fullName || !email || !password || !state || !city) { setError('Sila isi semua maklumat wajib.'); return }
      if (password.length < 8) { setError('Kata laluan mesti sekurang-kurangnya 8 aksara.'); return }
      setStep(2)
    } else if (step === 2) {
      if (!geminiPassed) { setError('Sila selesaikan pengesahan IC + selfie terlebih dahulu.'); return }
      if (requiresLicense) setStep(3)
      else setStep((totalSteps - 1) as Step)
    } else if (step === 3 && requiresLicense) {
      if (!licenseType || !licenseNumber) { setError('Sila isi jenis sijil dan nombor pendaftaran.'); return }
      setStep(4)
    }
  }

  const prevStep = () => {
    setError('')
    if (step > 0) setStep((step - 1) as Step)
  }

  const consentItems = requiresLicense ? [
    'Nombor pendaftaran profesional saya adalah sah dan boleh disahkan dengan badan kawal selia.',
    'Saya bersetuju untuk mematuhi etika profesional dan standard penjagaan semasa bertugas.',
    'Saya memahami bahawa SenioCare adalah platform penghubung sahaja dan bukan majikan saya.',
    'Maklumat saya boleh dikongsi dengan keluarga pelanggan untuk tujuan tempahan.',
    'Saya bersetuju dengan Terma Perkhidmatan dan Dasar Privasi SenioCare.',
  ] : [
    'Saya bersetuju untuk menyediakan perkhidmatan pendampingan yang selamat dan profesional.',
    'Saya memahami bahawa SenioCare adalah platform penghubung sahaja dan bukan majikan saya.',
    'Aktiviti pendampingan adalah untuk tujuan yang dinyatakan sahaja (riadah/ibadah/makan).',
    'Maklumat saya boleh dikongsi dengan keluarga pelanggan untuk tujuan tempahan.',
    'Saya bersetuju dengan Terma Perkhidmatan dan Dasar Privasi SenioCare.',
  ]

  const adjustedStep = !requiresLicense && step >= 3 ? step - 1 : step

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
          </div>
          <span className="font-bold text-slate-900">SenioCare</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-start justify-center p-4 pt-8">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900">Daftar sebagai Profesional</h1>
            <p className="text-sm text-slate-500 mt-1">Langkah {step + 1} daripada {totalSteps}</p>
          </div>

          <StepBar step={(!requiresLicense && step >= 3 ? step - 0 : step) as Step} totalSteps={totalSteps} />

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* STEP 0 — Role selection */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 mb-4">Pilih peranan anda untuk menentukan keperluan pendaftaran:</p>
              {ROLES.map(role => {
                const Icon = role.icon
                return (
                  <button key={role.id} onClick={() => setSelectedRole(role.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      selectedRole === role.id ? role.color + ' border-2' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedRole === role.id ? 'bg-white/60' : 'bg-slate-100'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{role.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{role.desc}</div>
                    </div>
                    <div className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                      selectedRole === role.id ? 'bg-white/60' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {role.badge}
                    </div>
                  </button>
                )
              })}
              {selectedRole && selectedRoleObj?.requiresLicense && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <strong>Nota:</strong> Peranan ini memerlukan pengesahan manual sijil profesional oleh admin SenioCare sebelum anda boleh menerima tempahan. Proses biasanya 1-3 hari bekerja.
                </div>
              )}
            </div>
          )}

          {/* STEP 1 — Basic info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penuh <span className="text-red-500">*</span></label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seperti dalam IC"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mel <span className="text-red-500">*</span></label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="email@example.com"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kata Laluan <span className="text-red-500">*</span></label>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Minimum 8 aksara"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombor Telefon</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01X-XXXXXXXX"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Negeri <span className="text-red-500">*</span></label>
                  <select value={state} onChange={e => setState(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">Pilih negeri</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bandar <span className="text-red-500">*</span></label>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="Contoh: Petaling Jaya"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — IC + Selfie */}
          {step === 2 && (
            <div className="space-y-5">
              {geminiPassed ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                  <div>
                    <div className="font-semibold text-sm">IC & Wajah Disahkan</div>
                    <div className="text-xs">{geminiMsg}</div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Kad Pengenalan (IC) Hadapan</label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors">
                      <Upload className="w-6 h-6 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-500">
                        {icFront ? icFront.name : 'Klik untuk muat naik gambar IC'}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => setIcFront(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Selfie Wajah</label>
                    {selfieFile ? (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <Camera className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-600 flex-1">Selfie diambil</span>
                        <button onClick={() => setSelfieFile(null)} className="text-xs text-red-500 hover:underline">Buang</button>
                      </div>
                    ) : cameraActive ? (
                      <div className="space-y-3">
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black aspect-video object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        <button onClick={captureSelfie} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-teal-700">
                          Ambil Gambar
                        </button>
                        <button onClick={stopCamera} className="w-full text-slate-500 text-sm hover:underline">Batal</button>
                      </div>
                    ) : (
                      <button onClick={startCamera}
                        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-teal-400 hover:bg-teal-50/30 transition-colors">
                        <Camera className="w-6 h-6 text-slate-400" />
                        <span className="text-sm text-slate-500">Buka kamera untuk ambil selfie</span>
                      </button>
                    )}
                  </div>

                  {icFront && selfieFile && !geminiPassed && (
                    <button onClick={verifyWithGemini} disabled={loading}
                      className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      {loading ? 'Sedang mengesahkan...' : 'Sahkan IC + Selfie'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 3 — Professional License (only if requiresLicense) */}
          {step === 3 && requiresLicense && (
            <div className="space-y-4">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-700">
                <strong>Penting:</strong> Admin akan mengesahkan sijil anda dalam 1-3 hari bekerja. Anda boleh lengkapkan profil semasa menunggu.
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Sijil / Pendaftaran <span className="text-red-500">*</span></label>
                <select value={licenseType} onChange={e => setLicenseType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Pilih jenis sijil</option>
                  {availableLicenseTypes.map(lt => (
                    <option key={lt} value={lt}>{LICENSE_LABELS[lt]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombor Pendaftaran <span className="text-red-500">*</span></label>
                <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
                  placeholder="Contoh: SRN/12345/2024"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tarikh Tamat (jika ada)</label>
                <input type="date" value={licenseExpiry} onChange={e => setLicenseExpiry(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Muat Naik Sijil (PDF atau gambar)</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors">
                  <Award className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500">
                    {licenseFile ? licenseFile.name : 'Klik untuk muat naik sijil / kad pendaftaran'}
                  </span>
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setLicenseFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            </div>
          )}

          {/* STEP 4 / Last step — Consent */}
          {((step === 4 && requiresLicense) || (step === 3 && !requiresLicense)) && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 mb-4">Sila baca dan bersetuju dengan semua terma berikut:</p>
              {consentItems.map((item, i) => (
                <label key={i} className="flex items-start gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                    consents[i] ? 'bg-teal-600 border-teal-600' : 'border-slate-300 group-hover:border-teal-400'
                  }`} onClick={() => {
                    const next = [...consents]
                    next[i] = !next[i]
                    setConsents(next)
                  }}>
                    {consents[i] && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-slate-600 leading-relaxed">{item}</span>
                </label>
              ))}
            </div>
          )}

          {/* NAV BUTTONS */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={prevStep} disabled={loading}
                className="flex items-center gap-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" /> Balik
              </button>
            )}

            {((step < 4 && requiresLicense) || (step < 3 && !requiresLicense)) && step !== 2 ? (
              <button onClick={nextStep} disabled={loading}
                className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
                Seterusnya <ChevronRight className="w-4 h-4" />
              </button>
            ) : step === 2 ? (
              !geminiPassed ? (
                <div className="flex-1 text-sm text-center text-slate-400 flex items-center justify-center">
                  Selesaikan pengesahan IC + selfie dahulu
                </div>
              ) : (
                <button onClick={nextStep}
                  className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 flex items-center justify-center gap-2">
                  Seterusnya <ChevronRight className="w-4 h-4" />
                </button>
              )
            ) : (
              <button onClick={handleSubmit} disabled={loading || !consents.every(Boolean)}
                className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {loading ? 'Mendaftar...' : 'Hantar Pendaftaran'}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Sudah ada akaun?{' '}
            <Link href="/login" className="text-teal-600 hover:underline">Log Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
