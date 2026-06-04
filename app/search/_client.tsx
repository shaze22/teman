'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Heart, Search, Star, MapPin, Clock, ArrowLeft, SlidersHorizontal,
  CheckCircle, X, ChevronDown, ChevronUp, Map,
} from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import LangToggle from '@/app/_lang-toggle'

const MY_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang',
  'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor',
  'Terengganu', 'W.P. Kuala Lumpur', 'W.P. Putrajaya', 'W.P. Labuan',
]

const BANGSA_OPTIONS = [
  { id: 'Melayu', label: 'Melayu' },
  { id: 'Cina', label: 'Cina' },
  { id: 'India', label: 'India' },
  { id: 'Iban', label: 'Iban' },
  { id: 'Kadazan', label: 'Kadazan/Dusun' },
  { id: 'Orang Asli', label: 'Orang Asli' },
  { id: 'Lain-lain', label: 'Lain-lain' },
]

const AGE_RANGE_OPTIONS = [
  '20-25', '26-30', '31-35', '36-40', '41-45', '46-50', '50+',
]

type Provider = {
  id: string
  fullName: string
  avatarUrl: string | null
  locationCity: string
  locationState: string
  ratingAvg: string
  totalReviews: number
  skills: { skillCategory: string }[]
  pricing: { price: string; pricingType: string; serviceType: string }[]
  bio: string | null
  verifiedByNgo: boolean
  icVerified: boolean
  isLocum: boolean
  locumVerified: boolean
  locumCertType: string | null
}

type Filters = {
  state: string
  minPrice: string
  maxPrice: string
  language: string
  transport: string
  skill: string
  bangsa: string
  ageRange: string
  verified: boolean
  locum: boolean
}

const EMPTY_FILTERS: Filters = {
  state: '',
  minPrice: '',
  maxPrice: '',
  language: '',
  transport: '',
  skill: '',
  bangsa: '',
  ageRange: '',
  verified: false,
  locum: false,
}

export default function SearchPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang, t } = useLang()

  const SERVICE_TYPES = [
    { id: 'all', label: lang === 'en' ? 'All' : 'Semua' },
    { id: 'job', label: t.services.job.title },
    { id: 'food', label: t.services.food.title },
    { id: 'learning', label: t.services.learning.title },
    { id: 'business', label: t.services.business.title },
    { id: 'ibadah', label: lang === 'en' ? 'Worship Companion' : 'Teman Ibadah' },
    { id: 'repair', label: lang === 'en' ? 'Repair Companion' : 'Teman Repair' },
    { id: 'riadah', label: lang === 'en' ? 'Wellness Companion' : 'Teman Riadah' },
    { id: 'kombo', label: lang === 'en' ? 'Combo Companion' : 'Teman Kombo' },
  ]

  const LANGUAGES = [
    { id: 'bm', label: 'Bahasa Melayu' },
    { id: 'en', label: 'English' },
    { id: 'cn', label: lang === 'en' ? 'Chinese (Mandarin)' : 'Cina (Mandarin)' },
    { id: 'ta', label: 'Tamil' },
  ]

  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [serviceType, setServiceType] = useState(searchParams.get('type') ?? 'all')
  const [sortBy, setSortBy] = useState('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [pendingFilters, setPendingFilters] = useState<Filters>(EMPTY_FILTERS)

  const activeFilterCount = Object.entries(filters).filter(([k, v]) =>
    k === 'verified' || k === 'locum' ? v === true : v !== ''
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
    if (filters.skill) params.set('skill', filters.skill)
    if (filters.bangsa) params.set('bangsa', filters.bangsa)
    if (filters.ageRange) params.set('ageRange', filters.ageRange)
    if (filters.verified) params.set('verified', '1')
    if (filters.locum) params.set('locum', '1')
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
            <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-[#0F0E17] hidden sm:block">SenioCare</span>
          </Link>
          <form onSubmit={(e) => { e.preventDefault(); fetchProviders() }} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:bg-white text-sm transition-all"
              placeholder={t.search.placeholder}
            />
          </form>
          <LangToggle />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Service type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {SERVICE_TYPES.map((st) => (
            <button
              key={st.id}
              onClick={() => setServiceType(st.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                serviceType === st.id
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#6366F1]'
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
                ? 'bg-[#EEF2FF] border-[#6366F1] text-[#6366F1]'
                : 'bg-white border-gray-200 text-gray-600 hover:border-[#6366F1]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t.search.filters}
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#6366F1] text-white text-xs rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:outline-none focus:border-[#6366F1] appearance-none cursor-pointer"
          >
            <option value="rating">{t.search.sortRating}</option>
            <option value="price_asc">{t.search.sortPrice}</option>
            <option value="newest">{t.search.sortNewest}</option>
            <option value="most_booked">{t.search.sortBooked}</option>
          </select>

          {activeFilterCount > 0 && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition-colors">
              <X className="w-3.5 h-3.5" /> {t.filterDrawer.reset}
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <Link
              href="/map"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
            >
              <Map className="w-4 h-4" />
              {t.search.map}
            </Link>
            <span className="text-sm text-gray-400 whitespace-nowrap">
              {loading ? '...' : `${providers.length} ${t.search.found}`}
            </span>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.state && <FilterChip label={`📍 ${filters.state}`} onRemove={() => setFilters(f => ({ ...f, state: '' }))} />}
            {filters.language && <FilterChip label={`🗣 ${LANGUAGES.find(l => l.id === filters.language)?.label}`} onRemove={() => setFilters(f => ({ ...f, language: '' }))} />}
            {filters.minPrice && <FilterChip label={`RM${filters.minPrice}+`} onRemove={() => setFilters(f => ({ ...f, minPrice: '' }))} />}
            {filters.maxPrice && <FilterChip label={`${lang === 'en' ? 'Max' : 'Maks'} RM${filters.maxPrice}`} onRemove={() => setFilters(f => ({ ...f, maxPrice: '' }))} />}
            {filters.transport && filters.transport !== 'all' && (
              <FilterChip
                label={
                  filters.transport === 'none'
                    ? (lang === 'en' ? '🚶 No vehicle' : '🚶 Tiada kenderaan')
                    : filters.transport === 'motorcycle'
                      ? '🛵 Motor'
                      : (lang === 'en' ? '🚗 Car' : '🚗 Kereta')
                }
                onRemove={() => setFilters(f => ({ ...f, transport: '' }))}
              />
            )}
            {filters.skill && <FilterChip label={`🛠 ${t.skills[filters.skill as keyof typeof t.skills] ?? filters.skill}`} onRemove={() => setFilters(f => ({ ...f, skill: '' }))} />}
            {filters.bangsa && <FilterChip label={`👤 ${filters.bangsa}`} onRemove={() => setFilters(f => ({ ...f, bangsa: '' }))} />}
            {filters.ageRange && <FilterChip label={`🎂 ${filters.ageRange} ${lang === 'en' ? 'yrs' : 'thn'}`} onRemove={() => setFilters(f => ({ ...f, ageRange: '' }))} />}
            {filters.verified && <FilterChip label={lang === 'en' ? '✓ Verified only' : '✓ Verified sahaja'} onRemove={() => setFilters(f => ({ ...f, verified: false }))} />}
            {filters.locum && <FilterChip label={lang === 'en' ? '🩺 Locum only' : '🩺 Locum sahaja'} onRemove={() => setFilters(f => ({ ...f, locum: false }))} />}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.search.notFound}</h3>
            <p className="text-gray-500 mb-4">{t.search.notFoundDesc}</p>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="px-4 py-2 bg-[#6366F1] text-white rounded-xl text-sm font-semibold hover:bg-[#4F46E5] transition-colors">
                {t.search.resetFilter}
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => <ProviderCard key={p.id} provider={p} />)}
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
              <h2 className="font-bold text-gray-900 text-lg">{t.filterDrawer.title}</h2>
              <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 p-5 space-y-6">
              {/* Negeri */}
              <FilterSection title={t.filterDrawer.location}>
                <select
                  value={pendingFilters.state}
                  onChange={(e) => setPendingFilters(f => ({ ...f, state: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6366F1] bg-white"
                >
                  <option value="">{t.filterDrawer.allStates}</option>
                  {MY_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FilterSection>

              {/* Harga */}
              <FilterSection title={t.filterDrawer.price}>
                <div className="flex gap-3 items-center">
                  <input
                    type="number"
                    value={pendingFilters.minPrice}
                    onChange={(e) => setPendingFilters(f => ({ ...f, minPrice: e.target.value }))}
                    placeholder="Min"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6366F1]"
                  />
                  <span className="text-gray-400 text-sm">—</span>
                  <input
                    type="number"
                    value={pendingFilters.maxPrice}
                    onChange={(e) => setPendingFilters(f => ({ ...f, maxPrice: e.target.value }))}
                    placeholder="Max"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6366F1]"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[20, 30, 50, 100].map(p => (
                    <button
                      key={p}
                      onClick={() => setPendingFilters(f => ({ ...f, maxPrice: String(p) }))}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${pendingFilters.maxPrice === String(p) ? 'bg-[#EEF2FF] border-[#6366F1] text-[#6366F1] font-semibold' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      RM{p}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Bahasa */}
              <FilterSection title={t.filterDrawer.language}>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.id}
                      onClick={() => setPendingFilters(f => ({ ...f, language: f.language === l.id ? '' : l.id }))}
                      className={`py-2.5 px-3 rounded-xl border text-sm transition-colors text-left ${pendingFilters.language === l.id ? 'bg-[#EEF2FF] border-[#6366F1] text-[#6366F1] font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Kenderaan */}
              <FilterSection title={t.filterDrawer.vehicle}>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '', label: lang === 'en' ? 'All' : 'Semua' },
                    { id: 'none', label: lang === 'en' ? '🚶 None' : '🚶 Tiada' },
                    { id: 'motorcycle', label: '🛵 Motor' },
                    { id: 'car', label: lang === 'en' ? '🚗 Car' : '🚗 Kereta' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setPendingFilters(f => ({ ...f, transport: opt.id }))}
                      className={`py-2.5 px-2 rounded-xl border text-xs transition-colors ${pendingFilters.transport === opt.id ? 'bg-[#EEF2FF] border-[#6366F1] text-[#6366F1] font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Kemahiran */}
              <FilterSection title={t.filterDrawer.skill}>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(t.skills) as (keyof typeof t.skills)[]).map(id => (
                    <button
                      key={id}
                      onClick={() => setPendingFilters(f => ({ ...f, skill: f.skill === id ? '' : id }))}
                      className={`py-2.5 px-3 rounded-xl border text-sm transition-colors text-left ${pendingFilters.skill === id ? 'bg-[#EEF2FF] border-[#6366F1] text-[#6366F1] font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {t.skills[id]}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Bangsa */}
              <FilterSection title={t.filterDrawer.race}>
                <div className="grid grid-cols-2 gap-2">
                  {BANGSA_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setPendingFilters(f => ({ ...f, bangsa: f.bangsa === opt.id ? '' : opt.id }))}
                      className={`py-2.5 px-3 rounded-xl border text-sm transition-colors text-left ${pendingFilters.bangsa === opt.id ? 'bg-[#EEF2FF] border-[#6366F1] text-[#6366F1] font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Umur */}
              <FilterSection title={t.filterDrawer.age}>
                <div className="grid grid-cols-4 gap-2">
                  {AGE_RANGE_OPTIONS.map(range => (
                    <button
                      key={range}
                      onClick={() => setPendingFilters(f => ({ ...f, ageRange: f.ageRange === range ? '' : range }))}
                      className={`py-2 px-1 rounded-xl border text-xs transition-colors text-center ${pendingFilters.ageRange === range ? 'bg-[#EEF2FF] border-[#6366F1] text-[#6366F1] font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Verified */}
              <FilterSection title={t.filterDrawer.verified}>
                <button
                  onClick={() => setPendingFilters(f => ({ ...f, verified: !f.verified }))}
                  className={`w-full flex items-center justify-between py-3 px-4 rounded-xl border transition-colors ${pendingFilters.verified ? 'bg-[#EEF2FF] border-[#6366F1]' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${pendingFilters.verified ? 'text-[#6366F1]' : 'text-gray-400'}`} />
                    <span className={pendingFilters.verified ? 'text-[#6366F1] font-semibold' : 'text-gray-600'}>
                      {t.filterDrawer.verifiedLabel}
                    </span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${pendingFilters.verified ? 'bg-[#6366F1] border-[#6366F1]' : 'border-gray-300'}`}>
                    {pendingFilters.verified && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              </FilterSection>

              {/* Locum */}
              <FilterSection title={lang === 'en' ? 'Locum Professional' : 'Locum Profesional'}>
                <button
                  onClick={() => setPendingFilters(f => ({ ...f, locum: !f.locum }))}
                  className={`w-full flex items-center justify-between py-3 px-4 rounded-xl border transition-colors ${pendingFilters.locum ? 'bg-emerald-50 border-emerald-500' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-base">🩺</span>
                    <div>
                      <span className={`block font-medium ${pendingFilters.locum ? 'text-emerald-700' : 'text-gray-700'}`}>
                        {lang === 'en' ? 'Locum verified only' : 'Locum disahkan sahaja'}
                      </span>
                      <span className="text-xs text-gray-400">{lang === 'en' ? 'Nurse, paramedic, certified caregiver' : 'Jururawat, paramedik, pengasuh bertauliah'}</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${pendingFilters.locum ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                    {pendingFilters.locum && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              </FilterSection>
            </div>

            {/* Footer buttons */}
            <div className="p-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={resetFilters}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t.filterDrawer.reset}
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 py-3 bg-[#6366F1] text-white rounded-xl text-sm font-semibold hover:bg-[#4F46E5] transition-colors"
              >
                {t.filterDrawer.apply}
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
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && children}
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string | undefined; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 bg-[#EEF2FF] text-[#6366F1] text-xs font-medium px-3 py-1.5 rounded-full">
      {label}
      <button onClick={onRemove} className="ml-1 hover:text-[#4F46E5]">
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

function ProviderCard({ provider: p }: { provider: Provider }) {
  const { lang, t } = useLang()
  const price = p.pricing[0]
  const initials = p.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Link href={`/carer/${p.id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {p.avatarUrl ? (
            <Image src={p.avatarUrl} alt={p.fullName} width={56} height={56} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#6366F1] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">{p.fullName}</h3>
              {p.verifiedByNgo && (
                <span className="text-xs bg-[#E0E7FF] text-[#6366F1] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">NGO ✓</span>
              )}
              {p.icVerified && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">IC ✓</span>
              )}
              {p.isLocum && p.locumVerified && (
                <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">🩺 Locum ✓</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{p.locationCity}, {p.locationState}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
            <span className="text-sm font-semibold text-gray-900">
              {parseFloat(p.ratingAvg) > 0 ? parseFloat(p.ratingAvg).toFixed(1) : t.search.new}
            </span>
          </div>
          {p.totalReviews > 0 && (
            <span className="text-xs text-gray-400">({p.totalReviews} {t.search.reviews})</span>
          )}
        </div>

        {p.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {p.skills.slice(0, 3).map((s) => (
              <span key={s.skillCategory} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {t.skills[s.skillCategory as keyof typeof t.skills] ?? s.skillCategory}
              </span>
            ))}
            {p.skills.length > 3 && <span className="text-xs text-gray-400 px-1 py-1">+{p.skills.length - 3}</span>}
          </div>
        )}

        {p.bio && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{p.bio}</p>}

        {price && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'hourly rate' : 'kadar sejam'}</span>
            </div>
            <span className="font-bold text-[#6366F1] text-lg">
              RM{parseFloat(price.price).toFixed(0)}<span className="text-sm font-normal text-gray-400"> / jam</span>
            </span>
          </div>
        )}
      </div>
      <div className="px-4 pb-4">
        <div className="w-full text-center py-2 bg-[#6366F1] text-white text-sm font-semibold rounded-xl group-hover:bg-[#4F46E5] transition-colors">
          {t.search.viewProfile}
        </div>
      </div>
    </Link>
  )
}
