'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Loader2, Building2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STATES = [
  'Selangor', 'Kuala Lumpur', 'Johor', 'Perak', 'Kedah', 'Pahang',
  'Terengganu', 'Kelantan', 'Negeri Sembilan', 'Melaka', 'Sabah',
  'Sarawak', 'Perlis', 'Pulau Pinang', 'Putrajaya', 'Labuan',
]

const CENTER_TYPES = [
  { value: 'nursing_home', label: 'Rumah Warga Emas (Nursing Home)' },
  { value: 'day_care', label: 'Pusat Jagaan Harian (Day Care)' },
  { value: 'welfare_center', label: 'Pusat Kebajikan' },
  { value: 'rehabilitation', label: 'Pusat Pemulihan' },
  { value: 'hospital', label: 'Hospital / Klinik' },
]

type FormData = {
  fullName: string
  email: string
  phone: string
  password: string
  centerName: string
  centerType: string
  registrationNumber: string
  address: string
  city: string
  state: string
  postcode: string
  picName: string
  residentCapacity: string
  website: string
}

const INIT: FormData = {
  fullName: '', email: '', phone: '', password: '',
  centerName: '', centerType: 'welfare_center', registrationNumber: '',
  address: '', city: '', state: '', postcode: '',
  picName: '', residentCapacity: '', website: '',
}

export default function RegisterCareCenterPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INIT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } },
      })
      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error('Pendaftaran gagal')

      const res = await fetch('/api/auth/register/care-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          centerName: form.centerName,
          centerType: form.centerType,
          registrationNumber: form.registrationNumber || undefined,
          address: form.address,
          city: form.city,
          state: form.state,
          postcode: form.postcode || undefined,
          picName: form.picName,
          residentCapacity: form.residentCapacity || undefined,
          website: form.website || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Ralat pendaftaran')

      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ralat tidak diketahui')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Permohonan Dihantar</h2>
          <p className="text-gray-500 text-sm mb-6">
            Terima kasih! Akaun Pusat Penjagaan anda sedang disemak oleh pasukan SenioCare.
            Anda akan menerima emel pengesahan dalam masa 1–2 hari bekerja.
          </p>
          <Link href="/login" className="inline-flex items-center justify-center w-full bg-[#6366F1] text-white font-semibold py-3 rounded-xl hover:bg-[#4F46E5] transition-colors">
            Pergi ke Log Masuk
          </Link>
        </div>
      </div>
    )
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )

  const Input = ({ field, ...props }: { field: keyof FormData } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      value={form[field]}
      onChange={e => set(field, e.target.value)}
      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1]"
    />
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-7 h-7 text-[#6366F1]" fill="currentColor" />
            <span className="text-xl font-bold text-[#6366F1]">SenioCare</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Daftar Pusat Penjagaan</h1>
              <p className="text-sm text-gray-500">Untuk nursing home, pusat jagaan, & pusat kebajikan</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="pb-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Maklumat Akaun</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nama Penuh (Pengurus)">
                  <Input field="fullName" placeholder="Nama penuh anda" required />
                </Field>
                <Field label="No. Telefon">
                  <Input field="phone" type="tel" placeholder="01x-xxxxxxx" required />
                </Field>
                <Field label="Emel">
                  <Input field="email" type="email" placeholder="emel@pusat.com" required />
                </Field>
                <Field label="Kata Laluan">
                  <Input field="password" type="password" placeholder="Min. 8 aksara" required minLength={8} />
                </Field>
              </div>
            </div>

            <div className="pb-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Maklumat Pusat</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nama Pusat Penjagaan">
                  <Input field="centerName" placeholder="Cth: Rumah Seri Kenangan KL" required />
                </Field>
                <Field label="Jenis Pusat">
                  <select
                    value={form.centerType}
                    onChange={e => set('centerType', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1]"
                    required
                  >
                    {CENTER_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="No. Pendaftaran (SSM/ROS) Pilihan">
                  <Input field="registrationNumber" placeholder="Cth: 202301012345" />
                </Field>
                <Field label="Nama Pegawai Bertanggungjawab (PIC)">
                  <Input field="picName" placeholder="Nama PIC / ketua jabatan" required />
                </Field>
                <Field label="Kapasiti Penghuni (Anggaran)">
                  <Input field="residentCapacity" type="number" placeholder="Cth: 50" />
                </Field>
                <Field label="Laman Web Pilihan">
                  <Input field="website" type="url" placeholder="https://pusat.com.my" />
                </Field>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Alamat Pusat</p>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Alamat Penuh">
                  <Input field="address" placeholder="No. jalan, taman, kawasan" required />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bandar">
                    <Input field="city" placeholder="Cth: Petaling Jaya" required />
                  </Field>
                  <Field label="Poskod">
                    <Input field="postcode" placeholder="47500" />
                  </Field>
                </div>
                <Field label="Negeri">
                  <select
                    value={form.state}
                    onChange={e => set('state', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1]"
                    required
                  >
                    <option value="">-- Pilih Negeri --</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6366F1] text-white font-semibold py-3 rounded-xl hover:bg-[#4F46E5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Mendaftar...</> : 'Hantar Permohonan'}
            </button>

            <p className="text-center text-xs text-gray-400">
              Akaun Pusat Penjagaan memerlukan pengesahan oleh pasukan SenioCare sebelum aktif.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Sudah ada akaun?{' '}
          <Link href="/login" className="text-[#6366F1] font-semibold hover:underline">Log masuk</Link>
        </p>
      </div>
    </div>
  )
}
