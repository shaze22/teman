'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATES = ['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor','Terengganu','W.P. Kuala Lumpur','W.P. Labuan','W.P. Putrajaya']

export default function NgoRegisterForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', regNumber: '', contactPerson: '', email: '', phone: '', address: '', city: '', state: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { setError('Nama NGO diperlukan'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/ngo/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, userId }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Gagal mendaftar'); setLoading(false); return }
    router.push('/dashboard/ngo')
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 bg-white'
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1'

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <div>
        <label className={labelCls}>Nama NGO <span className="text-red-400">*</span></label>
        <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Pertubuhan Ibu Tunggal Sejahtera" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>No. Pendaftaran (RON/ROS)</label>
          <input value={form.regNumber} onChange={e => set('regNumber', e.target.value)} className={inputCls} placeholder="PPM-001-12-01012020" />
        </div>
        <div>
          <label className={labelCls}>Nama Wakil</label>
          <input value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>E-mel Organisasi</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>No. Telefon</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} placeholder="03-xxxxxxxx" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Alamat</label>
        <input value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Bandar</label>
          <input value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Negeri</label>
          <select value={form.state} onChange={e => set('state', e.target.value)} className={inputCls}>
            <option value="">Pilih negeri</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-[#EEF2FF] rounded-xl p-3 text-xs text-[#4F46E5]">
        Selepas mendaftar, permohonan anda akan disemak oleh admin SenioCare dalam masa 1-3 hari bekerja sebelum diaktifkan.
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-[#6366F1] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#4F46E5] disabled:opacity-50 transition-colors">
        {loading ? 'Mendaftar...' : 'Hantar Permohonan'}
      </button>
    </form>
  )
}
