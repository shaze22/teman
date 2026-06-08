'use client'

import { useState } from 'react'
import { Flag, Loader2, X } from 'lucide-react'

interface Props {
  bookingId: string
  reportedUserId: string
  lang: string
  alreadyReported: boolean
}

const CATEGORIES = [
  { id: 'no_show', en: 'Did not show up', bm: 'Tidak hadir tanpa makluman' },
  { id: 'misconduct', en: 'Misconduct / Rude behaviour', bm: 'Kelakuan tidak sopan / kasar' },
  { id: 'fraud', en: 'Fraud / Scam', bm: 'Penipuan / scam' },
  { id: 'harassment', en: 'Harassment', bm: 'Gangguan / ugutan' },
  { id: 'other', en: 'Other', bm: 'Lain-lain' },
]

export default function ReportButton({ bookingId, reportedUserId, lang, alreadyReported }: Props) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(alreadyReported)
  const [error, setError] = useState('')

  const en = lang === 'en'

  async function submit() {
    if (!category || description.length < 10) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, reportedUserId, category, description }),
      })
      if (res.ok) {
        setDone(true)
        setOpen(false)
      } else {
        const j = await res.json()
        setError(j.message ?? (en ? 'Failed to submit' : 'Gagal hantar'))
      }
    } catch {
      setError(en ? 'Network error' : 'Ralat rangkaian')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <p className="text-xs text-center text-gray-400 mt-2">
        {en ? '🚩 Report submitted. Admin will review within 2 business days.' : '🚩 Laporan dihantar. Admin akan semak dalam 2 hari bekerja.'}
      </p>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 text-sm text-red-500 border border-red-200 py-2.5 rounded-xl hover:bg-red-50 transition-colors"
      >
        <Flag className="w-4 h-4" />
        {en ? 'Report an Issue' : 'Laporkan Masalah'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{en ? 'Report an Issue' : 'Laporkan Masalah'}</h3>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              {en
                ? 'Your report is confidential. Admin will review and respond within 2 business days.'
                : 'Laporan anda adalah sulit. Admin akan semak dan bertindak balas dalam 2 hari bekerja.'}
            </p>

            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-gray-700">{en ? 'Category' : 'Kategori'}</label>
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-colors ${
                    category === c.id ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {en ? c.en : c.bm}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {en ? 'Description (min. 10 characters)' : 'Penerangan (min. 10 aksara)'}
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                placeholder={en ? 'Describe what happened...' : 'Terangkan apa yang berlaku...'}
              />
              <p className="text-xs text-gray-400 mt-1">{description.length}/1000</p>
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                {en ? 'Cancel' : 'Batal'}
              </button>
              <button
                onClick={submit}
                disabled={!category || description.length < 10 || loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {en ? 'Submit Report' : 'Hantar Laporan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
