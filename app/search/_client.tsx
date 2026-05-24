'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Heart, Search, Filter, Star, MapPin, Clock, ChevronDown, ArrowLeft,
} from 'lucide-react'

const SERVICE_TYPES = [
  { id: 'all', label: 'Semua' },
  { id: 'job', label: 'Teman Kerja' },
  { id: 'food', label: 'Teman Makan' },
  { id: 'learning', label: 'Teman Belajar' },
  { id: 'business', label: 'Teman Bisnes' },
]

const SKILL_LABELS: Record<string, string> = {
  cooking: 'Masak',
  sewing: 'Jahit',
  massage: 'Urut',
  elderly_care: 'Jaga Orang Tua',
  cleaning: 'Bersih Rumah',
  teaching: 'Mengajar',
  companionship: 'Teman Berbual',
  shopping: 'Teman Membeli-belah',
}

type Provider = {
  id: string
  fullName: string
  avatarUrl: string | null
  locationCity: string
  locationState: string
  ratingAvg: string
  totalReviews: number
  skills: { skillCategory: string }[]
  pricing: { price: string; pricingType: string }[]
  bio: string | null
  verifiedByNgo: boolean
}

export default function SearchPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [serviceType, setServiceType] = useState(searchParams.get('type') ?? 'all')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('rating')

  const fetchProviders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (serviceType && serviceType !== 'all') params.set('type', serviceType)
    if (maxPrice) params.set('maxPrice', maxPrice)
    params.set('sort', sortBy)

    const res = await fetch(`/api/providers?${params}`)
    if (res.ok) {
      const data = await res.json()
      setProviders(data)
    }
    setLoading(false)
  }, [query, serviceType, maxPrice, sortBy])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchProviders()
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
            <span className="font-bold text-[#0F0E17] hidden sm:block">Teman</span>
          </Link>
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:bg-white text-sm transition-all"
              placeholder="Cari nama, bandar, atau kemahiran..."
            />
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Service type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {SERVICE_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setServiceType(type.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                serviceType === type.id
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#6366F1]'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Filter & Sort bar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-[#6366F1] transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:outline-none focus:border-[#6366F1] appearance-none pr-8 cursor-pointer"
          >
            <option value="rating">Rating Tertinggi</option>
            <option value="price_asc">Harga Terendah</option>
            <option value="newest">Paling Baru</option>
            <option value="most_booked">Paling Ramai Dipesan</option>
          </select>

          <span className="text-sm text-gray-400 ml-auto">
            {providers.length} Teman ditemui
          </span>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Harga Maksimum (RM/jam)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#6366F1]"
                  placeholder="100"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setMaxPrice(''); setQuery(''); setServiceType('all') }}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                  Set semula
                </button>
              </div>
            </div>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tiada Teman Dijumpai</h3>
            <p className="text-gray-500">Cuba ubah filter atau kawasan carian anda.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProviderCard({ provider: p }: { provider: Provider }) {
  const price = p.pricing[0]
  const initials = p.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Link href={`/teman/${p.id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {p.avatarUrl ? (
            <img src={p.avatarUrl} alt={p.fullName} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#6366F1] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">{p.fullName}</h3>
              {p.verifiedByNgo && (
                <span className="text-xs bg-[#E0E7FF] text-[#6366F1] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                  ✓ Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{p.locationCity}, {p.locationState}</span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
            <span className="text-sm font-semibold text-gray-900">
              {parseFloat(p.ratingAvg) > 0 ? parseFloat(p.ratingAvg).toFixed(1) : 'Baru'}
            </span>
          </div>
          {p.totalReviews > 0 && (
            <span className="text-xs text-gray-400">({p.totalReviews} ulasan)</span>
          )}
        </div>

        {/* Skills */}
        {p.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {p.skills.slice(0, 3).map((s) => (
              <span key={s.skillCategory} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {SKILL_LABELS[s.skillCategory] ?? s.skillCategory}
              </span>
            ))}
            {p.skills.length > 3 && (
              <span className="text-xs text-gray-400 px-1 py-1">+{p.skills.length - 3}</span>
            )}
          </div>
        )}

        {/* Bio */}
        {p.bio && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{p.bio}</p>
        )}

        {/* Price */}
        {price && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>per jam</span>
            </div>
            <span className="font-bold text-[#6366F1] text-lg">
              RM{parseFloat(price.price).toFixed(0)}
            </span>
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="w-full text-center py-2 bg-[#6366F1] text-white text-sm font-semibold rounded-xl group-hover:bg-[#4F46E5] transition-colors">
          Lihat Profil & Book
        </div>
      </div>
    </Link>
  )
}
