'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ChangePasswordForm() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== confirm) { setError('Kata laluan tidak sepadan'); return }
    if (next.length < 8) { setError('Kata laluan mesti sekurang-kurangnya 8 aksara'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Gagal tukar kata laluan'); setLoading(false); return }
    setDone(true)
    setLoading(false)
    setTimeout(() => { setOpen(false); setDone(false); setCurrent(''); setNext(''); setConfirm('') }, 2000)
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 rounded-2xl transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
            <Lock className="w-4 h-4 text-[#6366F1]" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">Tukar Kata Laluan</div>
            <div className="text-xs text-gray-500">Kemaskini kata laluan akaun anda</div>
          </div>
        </div>
        <span className="text-xs text-[#6366F1] font-medium">{open ? 'Tutup' : 'Tukar'}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-4">
          {done ? (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium py-2">
              <CheckCircle className="w-4 h-4" /> Kata laluan berjaya ditukar!
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Kata Laluan Semasa</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 pr-10"
                    placeholder="Masukkan kata laluan semasa" required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Kata Laluan Baru</label>
                <input type="password" value={next} onChange={e => setNext(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30"
                  placeholder="Sekurang-kurangnya 8 aksara" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Sahkan Kata Laluan Baru</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30"
                  placeholder="Masukkan semula kata laluan baru" required />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-[#6366F1] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#4F46E5] disabled:opacity-50 transition-colors">
                {loading ? 'Menyimpan...' : 'Simpan Kata Laluan'}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  )
}
