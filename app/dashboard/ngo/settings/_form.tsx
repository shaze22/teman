'use client'

import { useState } from 'react'
import { CheckCircle, Clock } from 'lucide-react'

const STATES = ['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor','Terengganu','W.P. Kuala Lumpur','W.P. Labuan','W.P. Putrajaya']

type Props = {
  initial: {
    name: string; regNumber: string; contactPerson: string; email: string
    phone: string; address: string; city: string; state: string; referralCode: string; status: string
  }
  ngoId: string
  adminName: string
  adminEmail: string
}

export default function NgoSettingsForm({ initial, ngoId, adminName, adminEmail }: Props) {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/ngo/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ngoId, ...form }),
    })
    if (res.ok) { setSaved(true) } else {
      const d = await res.json()
      setError(d.error ?? 'Gagal simpan')
    }
    setLoading(false)
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 bg-white'
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1'

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${form.status === 'active' ? 'bg-emerald-50 border-emerald-200' : 'bg-yellow-50 border-yellow-200'}`}>
        {form.status === 'active'
          ? <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          : <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />}
        <div>
          <div className={`text-sm font-semibold ${form.status === 'active' ? 'text-emerald-800' : 'text-yellow-800'}`}>
            {form.status === 'active' ? 'NGO Aktif & Disahkan' : 'Menunggu Kelulusan Admin'}
          </div>
          <div className={`text-xs mt-0.5 ${form.status === 'active' ? 'text-emerald-600' : 'text-yellow-600'}`}>
            {form.status === 'active'
              ? 'Ahli NGO anda boleh didaftarkan sebagai provider'
              : 'Admin Teman akan semak dan luluskan NGO anda dalam masa 1-3 hari bekerja'}
          </div>
        </div>
      </div>

      {/* Admin info (read-only) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Maklumat Admin</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-400 text-xs">Nama</span><div className="font-medium">{adminName}</div></div>
          <div><span className="text-gray-400 text-xs">E-mel</span><div className="font-medium">{adminEmail}</div></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Maklumat NGO</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Nama NGO</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} required />
          </div>
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
          <div className="col-span-2">
            <label className={labelCls}>Alamat</label>
            <input value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} />
          </div>
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
          {form.referralCode && (
            <div>
              <label className={labelCls}>Kod Rujukan (tidak boleh ditukar)</label>
              <input value={form.referralCode} readOnly className={`${inputCls} bg-gray-50 text-gray-400 font-mono`} />
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {saved && <p className="text-xs text-emerald-600 font-medium">✓ Maklumat berjaya disimpan</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-[#6366F1] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#4F46E5] disabled:opacity-50 transition-colors">
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  )
}
