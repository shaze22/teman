'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'

export default function PromoForm() {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    code: '', discount_type: 'percentage', discount_value: '', min_amount: '', max_uses: '', valid_until: '',
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code.toUpperCase().trim(),
        discountType: form.discount_type,
        discountValue: parseFloat(form.discount_value),
        minAmount: form.min_amount ? parseFloat(form.min_amount) : 0,
        maxUses: form.max_uses ? parseInt(form.max_uses) : null,
        validUntil: form.valid_until || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.message); setLoading(false); return }
    setShow(false)
    setForm({ code: '', discount_type: 'percentage', discount_value: '', min_amount: '', max_uses: '', valid_until: '' })
    router.refresh()
    setLoading(false)
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]'

  return (
    <div>
      {!show ? (
        <button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-2 bg-[#6366F1] text-white text-sm font-semibold rounded-xl hover:bg-[#4F46E5] transition-colors">
          <Plus className="w-4 h-4" /> Tambah Kod Promo
        </button>
      ) : (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 mb-6">
          <h3 className="font-semibold text-gray-900">Kod Promo Baru</h3>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kod</label>
              <input className={inp} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="TEMAN10" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Jenis Diskaun</label>
              <select className={inp} value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                <option value="percentage">Peratusan (%)</option>
                <option value="fixed">Tetap (RM)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nilai {form.discount_type === 'percentage' ? '(%)' : '(RM)'}</label>
              <input type="number" className={inp} value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} placeholder={form.discount_type === 'percentage' ? '10' : '5'} required min={0} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Min. Pembelian (RM)</label>
              <input type="number" className={inp} value={form.min_amount} onChange={e => setForm(f => ({ ...f, min_amount: e.target.value }))} placeholder="0" min={0} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Maks. Guna (kosong = tiada had)</label>
              <input type="number" className={inp} value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="100" min={1} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tamat Pada</label>
              <input type="date" className={inp} value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-[#6366F1] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#4F46E5] disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Simpan
            </button>
            <button type="button" onClick={() => setShow(false)} className="px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Batal</button>
          </div>
        </form>
      )}
    </div>
  )
}
