'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react'

const BANKS = [
  'Maybank', 'CIMB Bank', 'Public Bank', 'RHB Bank', 'Hong Leong Bank',
  'AmBank', 'Bank Islam', 'Bank Rakyat', 'BSN', 'OCBC Bank',
  'HSBC Bank', 'Standard Chartered', 'Alliance Bank', 'Affin Bank', 'Other',
]

interface Props {
  walletBalance: number
}

export default function WithdrawalForm({ walletBalance }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError('Masukkan jumlah yang sah'); return }
    if (amt > walletBalance) { setError('Jumlah melebihi baki wallet'); return }
    if (amt < 10) { setError('Jumlah minimum pengeluaran ialah RM10'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, bankName, accountNumber, accountHolder }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setSuccess(true)
      router.refresh()
    } catch {
      setError('Ralat rangkaian. Cuba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (walletBalance <= 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">Minta Pengeluaran</div>
            <div className="text-xs text-gray-400">Baki tersedia: RM{walletBalance.toFixed(2)}</div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {success ? (
            <div className="py-6 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-gray-900">Permohonan Dihantar!</p>
              <p className="text-sm text-gray-500 mt-1">Admin akan proses dalam 1-3 hari bekerja.</p>
              <button onClick={() => { setSuccess(false); setOpen(false) }}
                className="mt-4 text-sm text-[#6366F1] hover:underline">Tutup</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="pt-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-3 py-2 rounded-lg">
                  <X className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah (RM)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">RM</span>
                  <input
                    type="number" step="0.01" min="10" max={walletBalance}
                    value={amount} onChange={e => setAmount(e.target.value)} required
                    placeholder={`Max RM${walletBalance.toFixed(2)}`}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[50, 100, 200].filter(v => v <= walletBalance).map(v => (
                    <button key={v} type="button" onClick={() => setAmount(String(v))}
                      className="text-xs px-3 py-1 rounded-lg bg-[#EEF2FF] text-[#6366F1] font-medium hover:bg-[#6366F1] hover:text-white transition-colors">
                      RM{v}
                    </button>
                  ))}
                  <button type="button" onClick={() => setAmount(walletBalance.toFixed(2))}
                    className="text-xs px-3 py-1 rounded-lg bg-[#EEF2FF] text-[#6366F1] font-medium hover:bg-[#6366F1] hover:text-white transition-colors">
                    Semua
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank</label>
                <select value={bankName} onChange={e => setBankName(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] bg-white">
                  <option value="">Pilih bank...</option>
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Akaun</label>
                <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} required
                  placeholder="cth. 1234567890"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Pemegang Akaun</label>
                <input type="text" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} required
                  placeholder="Nama penuh seperti dalam buku bank"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#6366F1] text-white py-3 rounded-xl font-semibold hover:bg-[#4F46E5] disabled:opacity-50 transition-colors text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                {loading ? 'Menghantar...' : 'Hantar Permohonan'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
