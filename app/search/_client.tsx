'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Heart, Search, Star, MapPin, ArrowLeft, SlidersHorizontal,
  CheckCircle, X, ChevronDown, ChevronUp, Map, ShieldCheck, Stethoscope,
} from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import LangToggle from '@/app/_lang-toggle'

const MY_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang',
  'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor',
  'Terengganu', 'W.P. Kuala Lumpur', 'W.P. Putrajaya', 'W.P. Labuan',
]

const LANGUAGES = [
  { id: 'bm', label: 'Bahasa Melayu' },
  { id: 'en', label: 'English' },
  { id: 'zh', label: 'Mandarin' },
  { id: 'ta', label: 'Tamil' },
]

const SERVICE_CHIPS = [
  { id: 'all', label: 'Semua' },
  { id: 'nursing', label: '🩺 Jururawat' },
  { id: 'physiotherapy', label: '🦾 Fisioterapi' },
  { id: 'home_care', label: '🏠 Penjagaan Rumah' },
  { id: 'medical_escort', label: '🚗 Pendamping Perubatan' },
  { id: 'riadah', label: '🏃 Riadah' },
  { id: 'ibadah', label: '🕌 Ibadah' },
  { id: 'makan', label: '🍽️ Makan' },
]

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  locum_nurse:     { label: 'Jururawat Berlesen', color: 'bg-blue-100 text-blue-700' },
  locum_physio:    { label: 'Fisioterapi', color: 'bg-purple-100 text-purple-700' },
  locum_care_aide: { label: 'Pembantu Penjagaan', color: 'bg-orange-100 text-orange-700' },
  medical_escort:  { label: 'Pendamping Perubatan', color: 'bg-red-100 text-red-700' },
  companion:       { label: 'Companion', color: 'bg-teal-100 text-teal-700' },
}

type Provider = {
  id: string
  userId: string
  fullName: string
  avatarUrl: string | null
  locationCity: string
  locationState: string
  ratingAvg: string
  totalReviews: number
  bio: string | null
  icVerified: boolean
  licenseVerified: boolean
  role: string | null
  lowestPrice: number | null
  pricing: { price: string; pricingType: string; serviceType: string }[]
}

type Filters = {
  state: string
  minPrice: string
  maxPrice: string
  language: string
  transport: string
  tier: string
  verified: boolean
  licenseVerified: boolean
}

const EMPTY_FILTERS: Filters = {
  state: '',
  minPrice: '',
  maxPrice: '',
  language: '',
  transport: '',
  tier: '',
  verified: false,
  licenseVerified: false,
}

export default function SearchPageClient() {
  const router = useRouter()
  const { lang } = useLang()

  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [serviceType, setServiceType] = useState('all')
  const [sortBy, setSortBy] = useState('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [pendingFilters, setPendingFilters] = useState<Filters>(EMPTY_FILTERS)

  const activeFilterCount = Object.entries(filters).filter(([k, v]) =>
    k === 'verified' || k === 'licenseVerified' ? v === true : v !== ''
  ).length

  const fetchProviders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (serviceType && serviceType !== 'all') params.set('type', serviceType)
    if (filters.state) params.set('state', filters.state)
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    if (filters.language) params.set('language', filters.language)
    if (filters.transport && filters.transport !== 'all') params.set('transport', filters.transport)
    if (filters.tier) params.set('tier', filters.tier)
    params.set('sort', sortBy)

    const res = await fetch(`/api/providers?${params}`)
    if (res.ok) setProviders(await res.json())
    setLoading(false)
  }, [query, serviceType, filters, sortBy])

  useEffect(() => { fetchProviders() }, [fetchProviders])

  function applyFilters() {
    setFilters(pendingFilters)
    setShowFilters(false)
  }

  function resetFilters() {
    setPendingFilters(EMPTY_FILTERS)
    setFilters(EMPTY_FILTERS)
    setShowFilters(false)
  }

  function openFilters() {
    setPendingFilters(filters)
    setShowFilters(true)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 mr-2">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">SenioCare</span>
          </Link>
          <form onSubmit={(e) => { e.preventDefault(); fetchProviders() }} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white text-sm transition-all"
              placeholder={lang === 'en' ? 'Search by name or city...' : 'Cari nama atau bandar...'}
            />
          </form>
          <LangToggle />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Service type chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {SERVICE_CHIPS.map((st) => (
            <button
              key={st.id}
              onClick={() => setServiceType(st.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                serviceType === st.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-500'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button
            onClick={openFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors relative ${
              activeFilterCount > 0
                ? 'bg-teal-50 border-teal-500 text-teal-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-teal-500'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {lang === 'en' ? 'Filters' : 'Penapis'}
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
          >
            <option value="rating">{lang === 'en' ? 'Highest Rated' : 'Rating Tertinggi'}</option>
            <option value="price_asc">{lang === 'en' ? 'Lowest Price' : 'Harga Terendah'}</option>
            <option value="newest">{lang === 'en' ? 'Newest' : 'Terbaru'}</option>
            <option value="most_booked">{lang === 'en' ? 'Most Booked' : 'Paling Popular'}</option>
          </select>

          {activeFilterCount > 0 && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition-colors">
              <X className="w-3.5 h-3.5" /> {lang === 'en' ? 'Reset' : 'Reset'}
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <Link
              href="/map"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors"
            >
              <Map className="w-4 h-4" />
              {lang === 'en' ? 'Map' : 'Peta'}
            </Link>
            <span className="text-sm text-gray-400 whitespace-nowrap">
              {loading ? '...' : `${providers.length} ${lang === 'en' ? 'found' : 'dijumpai'}`}
            </span>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.state && <FilterChip label={`📍 ${filters.state}`} onRemove={() => setFilters(f => ({ ...f, state: '' }))} />}
            {filters.language && <FilterChip label={`🗣 ${LANGUAGES.find(l => l.id === filters.language)?.label}`} onRemove={() => setFilters(f => ({ ...f, language: '' }))} />}
            {filters.minPrice && <FilterChip label={`RM${filters.minPrice}+`} onRemove={() => setFilters(f => ({ ...f, minPrice: '' }))} />}
            {filters.maxPrice && <FilterChip label={`Max RM${filters.maxPrice}`} onRemove={() => setFilters(f => ({ ...f, maxPrice: '' }))} />}
            {filters.transport && filters.transport !== 'all' && (
              <FilterChip
                label={filters.transport === 'car' ? '🚗 Kereta' : '🛵 Motor'}
                onRemove={() => setFilters(f => ({ ...f, transport: '' }))}
              />
            )}
            {filters.tier && <FilterChip label={filters.tier === 'locum' ? '🩺 Locum sahaja' : '🤝 Companion sahaja'} onRemove={() => setFilters(f => ({ ...f, tier: '' }))} />}
            {filters.verified && <FilterChip label="✓ IC Disahkan" onRemove={() => setFilters(f => ({ ...f, verified: false }))} />}
            {filters.licenseVerified && <FilterChip label="🛡 Sijil Disahkan" onRemove={() => setFilters(f => ({ ...f, licenseVerified: false }))} />}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {lang === 'en' ? 'No Providers Found' : 'Tiada Provider Dijumpai'}
            </h3>
            <p className="text-gray-500 mb-6 text-sm max-w-xs mx-auto">
              {lang === 'en'
                ? 'No providers in your area yet. Try broadening your search or check back soon.'
                : 'Belum ada provider di kawasan anda. Cuba perluas carian atau semak semula tidak lama lagi.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors">
                  {lang === 'en' ? 'Reset Filters' : 'Reset Penapis'}
                </button>
              )}
              <a href="/register" className="px-5 py-2.5 border border-teal-200 text-teal-700 rounded-xl text-sm font-semibold hover:bg-teal-50 transition-colors inline-block">
                {lang === 'en' ? 'Join as a Provider' : 'Daftar sebagai Provider'}
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-6">
              {lang === 'en' ? 'Are you a nurse, physio, or care aide? ' : 'Anda jururawat, fisioterapi, atau pembantu penjagaan? '}
              <a href="/register/locum" className="text-teal-600 font-medium hover:underline">
                {lang === 'en' ? 'Register as a Locum Professional →' : 'Daftar sebagai Locum Profesional →'}
              </a>
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => <ProviderCard key={p.id} provider={p} lang={lang} />)}
          </div>
        )}
      </div>

      {/* Filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowFilters(false)}>
          <div className="flex-1 bg-black/40" />
          <div
            className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900 text-lg">{lang === 'en' ? 'Filters' : 'Penapis'}</h2>
              <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 p-5 space-y-6">
              {/* Tier */}
              <FilterSection title={lang === 'en' ? 'Provider Type' : 'Jenis Provider'}>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '', label: lang === 'en' ? 'All' : 'Semua' },
                    { id: 'locum', label: '🩺 Locum' },
                    { id: 'companion', label: '🤝 Companion' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setPendingFilters(f => ({ ...f, tier: opt.id }))}
                      className={`py-2.5 px-2 rounded-xl border text-xs transition-colors ${pendingFilters.tier === opt.id ? 'bg-teal-50 border-teal-500 text-teal-700 font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Negeri */}
              <FilterSection title={lang === 'en' ? 'Location' : 'Lokasi'}>
                <select
                  value={pendingFilters.state}
                  onChange={(e) => setPendingFilters(f => ({ ...f, state: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="">{lang === 'en' ? 'All States' : 'Semua Negeri'}</option>
                  {MY_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FilterSection>

              {/* Harga */}
              <FilterSection title={lang === 'en' ? 'Price Range (RM)' : 'Julat Harga (RM)'}>
                <div className="flex gap-3 items-center">
                  <input
                    type="number"
                    value={pendingFilters.minPrice}
                    onChange={(e) => setPendingFilters(f => ({ ...f, minPrice: e.target.value }))}
                    placeholder="Min"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-gray-400 text-sm">–</span>
                  <input
                    type="number"
                    value={pendingFilters.maxPrice}
                    onChange={(e) => setPendingFilters(f => ({ ...f, maxPrice: e.target.value }))}
                    placeholder="Max"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[50, 80, 100, 150].map(p => (
                    <button
                      key={p}
                      onClick={() => setPendingFilters(f => ({ ...f, maxPrice: String(p) }))}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${pendingFilters.maxPrice === String(p) ? 'bg-teal-50 border-teal-500 text-teal-700 font-semibold' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      RM{p}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Bahasa */}
              <FilterSection title={lang === 'en' ? 'Language' : 'Bahasa'}>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.id}
                      onClick={() => setPendingFilters(f => ({ ...f, language: f.language === l.id ? '' : l.id }))}
                      className={`py-2.5 px-3 rounded-xl border text-sm transition-colors text-left ${pendingFilters.language === l.id ? 'bg-teal-50 border-teal-500 text-teal-700 font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Kenderaan */}
              <FilterSection title={lang === 'en' ? 'Transport' : 'Kenderaan'}>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '', label: lang === 'en' ? 'All' : 'Semua' },
                    { id: 'motorcycle', label: '🛵 Motor' },
                    { id: 'car', label: lang === 'en' ? '🚗 Car' : '🚗 Kereta' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setPendingFilters(f => ({ ...f, transport: opt.id }))}
                      className={`py-2.5 px-2 rounded-xl border text-xs transition-colors ${pendingFilters.transport === opt.id ? 'bg-teal-50 border-teal-500 text-teal-700 font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Pengesahan */}
              <FilterSection title={lang === 'en' ? 'Verification' : 'Pengesahan'}>
                <div className="space-y-2">
                  <button
                    onClick={() => setPendingFilters(f => ({ ...f, licenseVerified: !f.licenseVerified }))}
                    className={`w-full flex items-center justify-between py-3 px-4 rounded-xl border transition-colors ${pendingFilters.licenseVerified ? 'bg-blue-50 border-blue-400' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <ShieldCheck className={`w-4 h-4 ${pendingFilters.licenseVerified ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={pendingFilters.licenseVerified ? 'text-blue-700 font-semibold' : 'text-gray-600'}>
                        {lang === 'en' ? 'Professional cert verified' : 'Sijil profesional disahkan'}
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${pendingFilters.licenseVerified ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {pendingFilters.licenseVerified && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                  <button
                    onClick={() => setPendingFilters(f => ({ ...f, verified: !f.verified }))}
                    className={`w-full flex items-center justify-between py-3 px-4 rounded-xl border transition-colors ${pendingFilters.verified ? 'bg-teal-50 border-teal-400' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 ${pendingFilters.verified ? 'text-teal-600' : 'text-gray-400'}`} />
                      <span className={pendingFilters.verified ? 'text-teal-700 font-semibold' : 'text-gray-600'}>
                        {lang === 'en' ? 'IC verified only' : 'IC disahkan sahaja'}
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${pendingFilters.verified ? 'bg-teal-600 border-teal-600' : 'border-gray-300'}`}>
                      {pendingFilters.verified && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                </div>
              </FilterSection>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={resetFilters}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {lang === 'en' ? 'Reset' : 'Reset'}
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors"
              >
                {lang === 'en' ? 'Apply' : 'Guna'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button onClick={() => setOpen(v => !v)} className="flex items-center justify-between w-full mb-3">
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && children}
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string | undefined; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1.5 rounded-full">
      {label}
      <button onClick={onRemove} className="ml-1 hover:text-teal-900">
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

function ProviderCard({ provider: p, lang }: { provider: Provider; lang: string }) {
  const badge = ROLE_BADGE[p.role ?? '']
  const initials = p.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const avatarBg = ['bg-teal-600','bg-blue-600','bg-purple-600','bg-amber-500','bg-rose-500','bg-cyan-600'][
    p.fullName.charCodeAt(0) % 6
  ]

  return (
    <Link href={`/carer/${p.id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3">
          {p.avatarUrl ? (
            <Image src={p.avatarUrl} alt={p.fullName} width={48} height={48} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className={`w-12 h-12 rounded-full ${avatarBg} text-white flex items-center justify-center text-base font-bold flex-shrink-0`}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate text-sm">{p.fullName}</h3>
              {p.licenseVerified && <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
              {p.icVerified && !p.licenseVerified && <CheckCircle className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{p.locationCity}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />
                <span className="text-xs font-semibold text-gray-800">
                  {parseFloat(p.ratingAvg) > 0 ? parseFloat(p.ratingAvg).toFixed(1) : (lang === 'en' ? 'New' : 'Baru')}
                </span>
                {p.totalReviews > 0 && <span className="text-xs text-gray-400 ml-0.5">({p.totalReviews})</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${badge.color}`}>
              <Stethoscope className="w-3 h-3" />{badge.label}
            </span>
          )}
          {p.licenseVerified && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              ✓ {lang === 'en' ? 'Cert Verified' : 'Sijil Disahkan'}
            </span>
          )}
          {p.icVerified && !p.licenseVerified && (
            <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
              ✓ IC
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          {p.lowestPrice !== null ? (
            <div>
              <span className="font-bold text-teal-600 text-lg">RM{Math.round(p.lowestPrice)}</span>
              <span className="text-xs text-gray-400 ml-1">{lang === 'en' ? 'from' : 'dari'}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">{lang === 'en' ? 'Contact for price' : 'Hubungi untuk harga'}</span>
          )}
          <span className="bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full group-hover:bg-teal-700 transition-colors">
            {lang === 'en' ? 'View Profile' : 'Lihat Profil'} →
          </span>
        </div>
      </div>
    </Link>
  )
}
