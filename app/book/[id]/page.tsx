'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, ArrowLeft, Calendar, Clock, MapPin, Loader2, CheckCircle } from 'lucide-react'
import { generateBookingCode, formatRM } from '@/lib/utils'

const SERVICE_OPTIONS = [
  { id: 'job', label: 'Teman Kerja / Penjagaan' },
  { id: 'food', label: 'Teman Makan' },
  { id: 'learning', label: 'Teman Belajar' },
  { id: 'business', label: 'Teman Bisnes' },
]

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
  const [booked, setBooked] = useState(false)
  const [bookingCode, setBookingCode] = useState('')

  const pricePerHour = 35
  const platformFee = pricePerHour * duration * 0.15
  const providerPrice = pricePerHour * duration
  const total = providerPrice + platformFee

  async function handleBook() {
    setLoading(true)
    const code = generateBookingCode()

    const res = await fetch('/api/bookings', {
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

    if (res.ok) {
      setBookingCode(code)
      setBooked(true)
    }
    setLoading(false)
  }

  if (booked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-[#E0E7FF] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#6366F1]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Berjaya!</h1>
          <p className="text-gray-500 mb-4">Kod booking anda:</p>
          <div className="bg-[#6366F1] text-white font-mono text-lg font-bold px-6 py-3 rounded-xl mb-6">
            {bookingCode}
          </div>
          <p className="text-sm text-gray-500 mb-8">
            Teman akan menyemak dan mengesahkan booking anda dalam masa 2 jam.
            Anda akan mendapat notifikasi melalui email.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/dashboard/customer"
              className="w-full bg-[#6366F1] text-white font-semibold py-3 rounded-xl hover:bg-[#4F46E5] transition-colors">
              Ke Dashboard Saya
            </Link>
            <Link href="/search"
              className="w-full border-2 border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">
              Cari Teman Lain
            </Link>
          </div>
        </div>
      </div>
    )
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

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Pilih Perkhidmatan</h2>
              <div className="space-y-2">
                {SERVICE_OPTIONS.map((opt) => (
                  <button key={opt.id} type="button" onClick={() => setServiceType(opt.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                      serviceType === opt.id ? 'border-[#6366F1] bg-[#EEF2FF] text-[#6366F1]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {opt.label}
                  </button>
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
                <Row label="Perkhidmatan" value={SERVICE_OPTIONS.find((o) => o.id === serviceType)?.label ?? serviceType} />
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

              <button type="button" onClick={handleBook}
                disabled={loading}
                className="w-full bg-[#6366F1] text-white font-semibold py-3 rounded-xl hover:bg-[#4F46E5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Bayar & Hantar Booking
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
