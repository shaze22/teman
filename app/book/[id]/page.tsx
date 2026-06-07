'use client'

import { useState, use, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, ArrowLeft, Calendar, Clock, MapPin, Loader2, HelpCircle, X, AlertCircle, ChevronLeft, ChevronRight, Users, User } from 'lucide-react'
import { generateBookingCode, formatRM } from '@/lib/utils'
import { SERVICE_TYPES, SERVICE_SCOPE } from '@/lib/services'
import { useLang } from '@/lib/lang-context'

const DURATION_OPTIONS = [2, 3, 4, 5, 6, 8]

const DAYS_SHORT_BM = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab']
const DAYS_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS_BM = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type AvailSlot = { dayOfWeek: number; startTime: string; endTime: string }

function timeToMins(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minsToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function getTimeOptions(slots: AvailSlot[], dayOfWeek: number): string[] {
  const daySlots = slots.filter(s => s.dayOfWeek === dayOfWeek)
  if (daySlots.length === 0) return []
  const times: string[] = []
  for (const slot of daySlots) {
    let cur = timeToMins(slot.startTime)
    const end = timeToMins(slot.endTime) - 60
    while (cur <= end) {
      times.push(minsToTime(cur))
      cur += 60
    }
  }
  return [...new Set(times)].sort()
}

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { lang, t } = useLang()

  const DAYS_SHORT = lang === 'en' ? DAYS_SHORT_EN : DAYS_SHORT_BM
  const MONTHS = lang === 'en' ? MONTHS_EN : MONTHS_BM

  const [step, setStep] = useState(0)
  const [serviceType, setServiceType] = useState('job')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [duration, setDuration] = useState(2)
  const [address, setAddress] = useState('')
  const [requirements, setRequirements] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pricePerHour, setPricePerHour] = useState(35)
  const [scopeModal, setScopeModal] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>('stripe')
  const [promoInput, setPromoInput] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [appliedPromo, setAppliedPromo] = useState('')
  const [availSlots, setAvailSlots] = useState<AvailSlot[]>([])
  const [availLoaded, setAvailLoaded] = useState(false)
  const [creditBalance, setCreditBalance] = useState(0)
  const [useCredit, setUseCredit] = useState(false)
  const [providerIsLocum, setProviderIsLocum] = useState(false)
  const [activeServiceTypes, setActiveServiceTypes] = useState<string[]>([])
  const [isDuo, setIsDuo] = useState(false)
  const [duoPartner, setDuoPartner] = useState<{ id: string; name: string; avatarUrl: string | null; price: number } | null>(null)
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  useEffect(() => {
    fetch(`/api/providers/${id}/pricing?type=${serviceType}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.price) setPricePerHour(parseFloat(d.price)) })
      .catch(() => {})
  }, [id, serviceType])

  useEffect(() => {
    fetch(`/api/providers/${id}/profile`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.is_locum && d?.locum_verified) setProviderIsLocum(true)
        if (Array.isArray(d?.activeServiceTypes) && d.activeServiceTypes.length > 0) {
          setActiveServiceTypes(d.activeServiceTypes)
        }
        if (d?.hasDuo && d?.duoPartnerId && d?.duoPartnerName) {
          setDuoPartner({
            id: d.duoPartnerId,
            name: d.duoPartnerName,
            avatarUrl: d.duoPartnerAvatarUrl ?? null,
            price: d.duoPartnerPrice ?? 0,
          })
        }
      })
      .catch(() => {})
  }, [id])

  useEffect(() => {
    fetch(`/api/providers/${id}/availability`)
      .then(r => r.ok ? r.json() : { slots: [] })
      .then(d => { setAvailSlots(d.slots ?? []); setAvailLoaded(true) })
      .catch(() => setAvailLoaded(true))
  }, [id])

  useEffect(() => {
    fetch('/api/credits')
      .then(r => r.ok ? r.json() : { balance: 0 })
      .then(d => setCreditBalance(d.balance ?? 0))
      .catch(() => {})
  }, [])

  const hasAvailability = availSlots.length > 0

  const calDays = useMemo(() => {
    const year = calMonth.getFullYear()
    const month = calMonth.getMonth()
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    for (let i = 0; i < first.getDay(); i++) days.push(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }, [calMonth])

  const today = new Date(); today.setHours(0, 0, 0, 0)

  function isDayAvailable(d: Date) {
    if (d < today) return false
    if (!hasAvailability) return true
    return availSlots.some(s => s.dayOfWeek === d.getDay())
  }

  function selectDate(d: Date) {
    const iso = d.toISOString().split('T')[0]
    setDate(iso)
    const times = getTimeOptions(availSlots, d.getDay())
    if (times.length > 0 && !times.includes(startTime)) setStartTime(times[0])
  }

  const selectedDateObj = date ? new Date(date + 'T00:00:00') : null
  const timeOptions = selectedDateObj && hasAvailability
    ? getTimeOptions(availSlots, selectedDateObj.getDay())
    : null

  const duoPartnerRate = (isDuo && duoPartner) ? duoPartner.price : 0
  const combinedRate = pricePerHour + duoPartnerRate
  const platformFee = combinedRate * duration * 0.15
  const providerPrice = combinedRate * duration
  const creditApplied = useCredit ? Math.min(creditBalance, providerPrice + platformFee - promoDiscount) : 0
  const total = Math.max(0, providerPrice + platformFee - promoDiscount - creditApplied)

  async function applyPromo() {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    setPromoError(null)
    const res = await fetch('/api/promo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: promoInput, amount: providerPrice + platformFee }),
    })
    const data = await res.json()
    if (!res.ok) { setPromoError(data.message); setPromoLoading(false); return }
    setPromoDiscount(data.discount)
    setAppliedPromo(data.code)
    setPromoLoading(false)
  }

  function removePromo() {
    setPromoDiscount(0)
    setAppliedPromo('')
    setPromoInput('')
    setPromoError(null)
  }

  async function handleBook() {
    setLoading(true)
    setError(null)
    const code = generateBookingCode()

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
        recipientName: recipientName || undefined,
        providerPrice,
        platformFee,
        totalAmount: total,
        bookingCode: code,
        paymentMethod,
        promoCode: appliedPromo || undefined,
        discountAmount: promoDiscount,
        creditUsed: creditApplied,
        isDuo: isDuo && !!duoPartner,
        duoPartnerId: (isDuo && duoPartner) ? duoPartner.id : undefined,
        duoPartnerPrice: (isDuo && duoPartner) ? duoPartner.price * duration : undefined,
      }),
    })

    if (!bookingRes.ok) {
      const d = await bookingRes.json().catch(() => ({}))
      setError(d.message ?? t.bookingPage.processingCash)
      setLoading(false)
      return
    }

    const { id: bookingId } = await bookingRes.json()

    if (paymentMethod === 'cash') {
      router.push(`/booking/${bookingId}`)
      return
    }

    const payRes = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })

    if (!payRes.ok) {
      const d = await payRes.json().catch(() => ({}))
      setError(d.message ?? t.bookingPage.processingPay)
      setLoading(false)
      return
    }

    const { billUrl } = await payRes.json()
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
            <span className="font-bold text-[#6366F1]">SenioCare</span>
          </Link>
          <span className="text-sm text-gray-500 ml-2">{t.bookingPage.title}</span>
        </div>
      </nav>

      {scopeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setScopeModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900">{lang === 'en' ? SERVICE_TYPES.find(s => s.id === scopeModal)?.labelEn : SERVICE_TYPES.find(s => s.id === scopeModal)?.label}</h3>
              <button onClick={() => setScopeModal(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{SERVICE_SCOPE[scopeModal]?.desc}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t.bookingPage.scopeIncluded}</p>
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
              {t.bookingPage.scopeClose}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">{t.bookingPage.step1}</h2>
              <div className="space-y-2">
                {SERVICE_TYPES.filter(opt => {
                  if (opt.hidden) return false
                  if (opt.id === 'medical_care') return providerIsLocum
                  if (activeServiceTypes.length > 0) return activeServiceTypes.includes(opt.id)
                  return true
                }).map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button type="button" onClick={() => setServiceType(opt.id)}
                      className={`flex-1 text-left px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                        serviceType === opt.id ? 'border-[#6366F1] bg-[#EEF2FF] text-[#6366F1]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {lang === 'en' ? opt.labelEn : opt.label}
                    </button>
                    <button type="button" onClick={() => setScopeModal(opt.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-[#6366F1] hover:border-[#6366F1] transition-colors flex-shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Solo / Duo toggle */}
              {duoPartner && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === 'en' ? 'Number of Companions' : 'Bilangan Companion'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setIsDuo(false)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${!isDuo ? 'border-[#6366F1] bg-[#EEF2FF]' : 'border-gray-200 hover:border-gray-300'}`}>
                      <User className={`w-6 h-6 ${!isDuo ? 'text-[#6366F1]' : 'text-gray-400'}`} />
                      <span className={`text-sm font-semibold ${!isDuo ? 'text-[#6366F1]' : 'text-gray-600'}`}>
                        {lang === 'en' ? 'Solo' : 'Solo'}
                      </span>
                      <span className="text-xs text-gray-400">
                        RM{pricePerHour}/{lang === 'en' ? 'hr' : 'jam'}
                      </span>
                    </button>
                    <button type="button" onClick={() => setIsDuo(true)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${isDuo ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <Users className={`w-6 h-6 ${isDuo ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-semibold ${isDuo ? 'text-purple-600' : 'text-gray-600'}`}>
                        {lang === 'en' ? 'Duo — Dine as Trio' : 'Duo — Makan Bertiga'}
                      </span>
                      <span className="text-xs text-gray-400">
                        RM{pricePerHour + duoPartner.price}/{lang === 'en' ? 'hr' : 'jam'}
                      </span>
                    </button>
                  </div>
                  {isDuo && (
                    <div className="mt-2 flex items-center gap-2 bg-purple-50 rounded-xl px-3 py-2 border border-purple-100">
                      <Users className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <p className="text-xs text-purple-700">
                        {lang === 'en'
                          ? `${duoPartner.name} will join this session.`
                          : `${duoPartner.name} akan turut serta dalam sesi ini.`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Calendar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {t.bookingPage.date}</div>
                </label>
                {!availLoaded ? (
                  <div className="flex items-center justify-center py-6 text-gray-400 text-sm gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> {t.bookingPage.loadingAvail}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <button type="button" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                        className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="text-sm font-semibold text-gray-900">
                        {MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}
                      </span>
                      <button type="button" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                        className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 border-b border-gray-100">
                      {DAYS_SHORT.map(d => (
                        <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {calDays.map((d, i) => {
                        if (!d) return <div key={i} />
                        const iso = d.toISOString().split('T')[0]
                        const avail = isDayAvailable(d)
                        const selected = date === iso
                        const isPast = d < today
                        return (
                          <button key={iso} type="button"
                            onClick={() => avail && selectDate(d)}
                            disabled={!avail}
                            className={`aspect-square flex items-center justify-center text-sm m-0.5 rounded-lg transition-colors font-medium
                              ${selected ? 'bg-[#6366F1] text-white' : ''}
                              ${!selected && avail && !isPast ? 'hover:bg-[#EEF2FF] text-gray-900 cursor-pointer' : ''}
                              ${!avail || isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                              ${avail && !selected && hasAvailability ? 'ring-1 ring-inset ring-[#C7D2FE]' : ''}
                            `}>
                            {d.getDate()}
                          </button>
                        )
                      })}
                    </div>
                    {hasAvailability && (
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-sm ring-1 ring-[#C7D2FE] bg-white" />
                        {t.bookingPage.availDays}
                      </div>
                    )}
                  </div>
                )}
                {!hasAvailability && availLoaded && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                    {t.bookingPage.noSchedule}
                  </p>
                )}
                {!hasAvailability && availLoaded && (
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
                )}
              </div>

              {/* Time & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {t.bookingPage.startTime}</div>
                  </label>
                  {timeOptions && timeOptions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {timeOptions.map(tm => (
                        <button key={tm} type="button" onClick={() => setStartTime(tm)}
                          className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${startTime === tm ? 'bg-[#6366F1] text-white border-[#6366F1]' : 'border-gray-200 text-gray-600 hover:border-[#6366F1]'}`}>
                          {tm}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.bookingPage.duration}</label>
                  <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] bg-white">
                    {DURATION_OPTIONS.map((h) => (
                      <option key={h} value={h}>{h} {t.bookingPage.hours}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {t.bookingPage.address}</div>
                </label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)}
                  rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] resize-none"
                  placeholder={t.bookingPage.addressPlaceholder} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nama Penerima Perkhidmatan <span className="text-gray-400 font-normal text-xs">(Pilihan — untuk Pusat Penjagaan)</span>
                </label>
                <input
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="Cth: Mak Cik Ramlah (Bilik 3)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.bookingPage.requirements}</label>
                <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)}
                  rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] resize-none"
                  placeholder={t.bookingPage.requirementsPlaceholder} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.bookingPage.paymentMethod}</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['stripe', 'cash'] as const).map(m => (
                    <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                      className={`px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${paymentMethod === m ? 'border-[#6366F1] bg-[#EEF2FF] text-[#6366F1]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {m === 'stripe' ? t.bookingPage.paymentOnline : t.bookingPage.paymentCash}
                    </button>
                  ))}
                </div>
                {paymentMethod === 'cash' && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                    {t.bookingPage.cashWarning}
                  </p>
                )}
              </div>

              <button type="button" onClick={() => setStep(1)}
                disabled={!date || !address || !startTime}
                className="w-full bg-[#6366F1] text-white font-semibold py-3 rounded-xl hover:bg-[#4F46E5] transition-colors disabled:opacity-60">
                {t.bookingPage.nextStep}
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">{t.bookingPage.step2}</h2>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <Row label={t.bookingPage.serviceRow} value={(lang === 'en' ? SERVICE_TYPES.find((o) => o.id === serviceType)?.labelEn : SERVICE_TYPES.find((o) => o.id === serviceType)?.label) ?? serviceType} />
                <Row label={t.bookingPage.dateRow} value={new Date(date).toLocaleDateString(lang === 'en' ? 'en-MY' : 'ms-MY')} />
                <Row label={t.bookingPage.timeRow} value={`${startTime} (${duration} ${t.bookingPage.hours})`} />
                <Row label={t.bookingPage.addressRow} value={address} />
                {requirements && <Row label={t.bookingPage.requirementsRow} value={requirements} />}
              </div>

              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t.bookingPage.providerRow} ({duration} {t.bookingPage.hours} × RM{pricePerHour})</span>
                  <span className="font-medium">{formatRM(providerPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t.bookingPage.platformRow}</span>
                  <span className="font-medium">{formatRM(platformFee)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>{t.bookingPage.discountRow} ({appliedPromo})</span>
                    <span className="font-medium">-{formatRM(promoDiscount)}</span>
                  </div>
                )}
                {creditApplied > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>{t.bookingPage.creditRow}</span>
                    <span className="font-medium">-{formatRM(creditApplied)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                  <span>{t.bookingPage.totalRow}</span>
                  <span className="text-[#6366F1]">{formatRM(total)}</span>
                </div>
              </div>

              {creditBalance > 0 && (
                <button type="button" onClick={() => setUseCredit(v => !v)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${useCredit ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xl">🎁</span>
                    <div className="text-left">
                      <div className={`font-semibold ${useCredit ? 'text-emerald-700' : 'text-gray-700'}`}>{t.bookingPage.useCredit}</div>
                      <div className="text-xs text-gray-400">{t.bookingPage.creditBalance}: RM{creditBalance.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${useCredit ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                    {useCredit && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              )}

              {!appliedPromo ? (
                <div>
                  <div className="flex gap-2">
                    <input value={promoInput} onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      placeholder={t.bookingPage.promoPlaceholder}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
                    <button type="button" onClick={applyPromo} disabled={promoLoading || !promoInput.trim()}
                      className="px-4 py-2.5 bg-[#6366F1] text-white text-sm font-semibold rounded-xl hover:bg-[#4F46E5] disabled:opacity-50 transition-colors">
                      {promoLoading ? '...' : t.bookingPage.promoApply}
                    </button>
                  </div>
                  {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                  <span className="text-sm text-emerald-700 font-medium">✓ {appliedPromo} (-{formatRM(promoDiscount)})</span>
                  <button type="button" onClick={removePromo} className="text-xs text-emerald-500 hover:text-emerald-700">{t.bookingPage.promoRemove}</button>
                </div>
              )}

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
                🍽️ {t.bookingPage.diningRule}
              </div>

              {paymentMethod === 'stripe' ? (
                <div className="bg-[#FFF1F2] rounded-xl p-4 text-sm text-orange-800">{t.bookingPage.escrowNote}</div>
              ) : (
                <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800">{t.bookingPage.cashNote}</div>
              )}

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button type="button" onClick={handleBook} disabled={loading}
                className="w-full bg-[#6366F1] text-white font-semibold py-3 rounded-xl hover:bg-[#4F46E5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading
                  ? (paymentMethod === 'cash' ? t.bookingPage.processingCash : t.bookingPage.processingPay)
                  : (paymentMethod === 'cash' ? t.bookingPage.confirmCash : t.bookingPage.proceedPay)}
              </button>

              {paymentMethod === 'stripe' && (
                <p className="text-xs text-center text-gray-400">{t.bookingPage.cancelPolicy}</p>
              )}
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
