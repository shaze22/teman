'use client'

import { useState, use, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, ArrowLeft, Calendar, Clock, MapPin, Loader2, HelpCircle, X, AlertCircle } from 'lucide-react'
import { generateBookingCode, formatRM } from '@/lib/utils'
import { SERVICE_TYPES, SERVICE_SCOPE } from '@/lib/services'

const DURATION_OPTIONS = [2, 3, 4, 5, 6, 8]

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [serviceType, setServiceType] = useState('job')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [duration, setDuration] = useState(2)
  const [address, setAddress] = useState('')
  const [requirements, setRequirements] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pricePerHour, setPricePerHour] = useState(35)
  const [scopeModal, setScopeModal] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/providers/${id}/pricing?type=${serviceType}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.price) setPricePerHour(parseFloat(d.price)) })
      .catch(() => {})
  }, [id, serviceType])

  const platformFee = pricePerHour * duration * 0.15
  const providerPrice = pricePerHour * duration
  const total = providerPrice + platformFee

  async function handleBook() {
    setLoading(true)
    setError(null)
    const code = generateBookingCode()

    // Step 1: create booking
    const bookingRes = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: id,
        serviceType,
        scheduledDate: date,
        startTime,
        durationHours: duration,
        locationAddress: address,
        requirements,
        providerPrice,
        platformFee,
        totalAmount: total,
        bookingCode: code,
      }),
    })

    if (!bookingRes.ok) {
      const d = await bookingRes.json().catch(() => ({}))
      setError(d.message ?? 'Gagal buat booking. Cuba lagi.')
      setLoading(false)
      return
    }

    const { id: bookingId } = await bookingRes.json()

    // Step 2: create Stripe checkout session
    const payRes = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })

    if (!payRes.ok) {
      const d = await payRes.json().catch(() => ({}))
      setError(d.message ?? 'Gagal cipta sesi pembayaran. Cuba lagi.')
      setLoading(false)
      return
    }

    const { billUrl } = await payRes.json()

    // Step 3: redirect to Stripe
    window.location.href = billUrl
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <button onClick={() => step > 0 ? setStep(step - 1) : router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-[#6366F1]" fill="currentColor" />
            <span className="font-bold text-[#6366F1]">Teman</span>
          </Link>
          <span className="text-sm text-gray-500 ml-2">Buat Booking</span>
        </div>
      </nav>

      {scopeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setScopeModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900">{SERVICE_TYPES.find(s => s.id === scopeModal)?.label}</h3>
              <button onClick={() => setScopeModal(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{SERVICE_SCOPE[scopeModal]?.desc}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Skop termasuk:</p>
            <ul className="space-y-2 mb-5">
              {SERVICE_SCOPE[scopeModal]?.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-[#6366F1] font-bold mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <button onClick={() => setScopeModal(null)}
              className="w-full py-2.5 bg-[#6366F1] text-white rounded-xl font-medium text-sm hover:bg-[#4F46E5] transition-colors">
              Faham, tutup
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Pilih Perkhidmatan</h2>
              <div className="space-y-2">
                {SERVICE_TYPES.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button type="button" onClick={() => setServiceType(opt.id)}
                      className={`flex-1 text-left px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                        serviceType === opt.id ? 'border-[#6366F1] bg-[#EEF2FF] text-[#6366F1]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {opt.label}
                    </button>
                    <button type="button" onClick={() => setScopeModal(opt.id)}
                      title="Lihat skop perkhidmatan"
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-[#6366F1] hover:border-[#6366F1] transition-colors flex-shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Tarikh</div>
                </label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Masa Mula</div>
                  </label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tempoh</label>
                  <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] bg-white">
                    {DURATION_OPTIONS.map((h) => (
                      <option key={h} value={h}>{h} jam</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Alamat</div>
                </label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)}
                  rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] resize-none"
                  placeholder="Alamat penuh..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Keperluan Khas (pilihan)</label>
                <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)}
                  rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] resize-none"
                  placeholder="Ceritakan keperluan khusus anda..." />
              </div>

              <button type="button" onClick={() => setStep(1)}
                disabled={!date || !address}
                className="w-full bg-[#6366F1] text-white font-semibold py-3 rounded-xl hover:bg-[#4F46E5] transition-colors disabled:opacity-60">
                Semak & Bayar
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Semak Booking</h2>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <Row label="Perkhidmatan" value={SERVICE_TYPES.find((o) => o.id === serviceType)?.label ?? serviceType} />
                <Row label="Tarikh" value={new Date(date).toLocaleDateString('ms-MY')} />
                <Row label="Masa" value={`${startTime} (${duration} jam)`} />
                <Row label="Alamat" value={address} />
                {requirements && <Row label="Keperluan" value={requirements} />}
              </div>

              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Harga Teman ({duration} jam × RM{pricePerHour})</span>
                  <span className="font-medium">{formatRM(providerPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform fee (15%)</span>
                  <span className="font-medium">{formatRM(platformFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                  <span>Jumlah</span>
                  <span className="text-[#6366F1]">{formatRM(total)}</span>
                </div>
              </div>

              <div className="bg-[#FFF1F2] rounded-xl p-4 text-sm text-orange-800">
                Bayaran akan ditahan dalam escrow dan dilepaskan kepada Teman hanya selepas sesi selesai.
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button type="button" onClick={handleBook}
                disabled={loading}
                className="w-full bg-[#6366F1] text-white font-semibold py-3 rounded-xl hover:bg-[#4F46E5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Menuju ke pembayaran...' : 'Teruskan ke Pembayaran'}
              </button>

              <p className="text-xs text-center text-gray-400">
                Pembatalan &gt;24 jam: bayaran penuh dikembalikan. &lt;24 jam: 50% dikembalikan.
              </p>
            </div>
          )}
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
