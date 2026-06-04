'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Users, Search, X, Check, UserMinus, Clock, Star, MapPin, Loader2, ShieldCheck } from 'lucide-react'

type Companion = {
  id: string
  fullName: string
  avatarUrl: string | null
  locationCity: string
  locationState: string
  icVerified: boolean
  ratingAvg: string
}

type Pair = {
  id: string
  status: 'pending' | 'active'
  isRequester: boolean
  createdAt: string
  partner: Companion
}

function Avatar({ c, size = 'md' }: { c: Companion; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  const initials = c.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-[#6366F1]', 'bg-[#F43F5E]', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500']
  const bg = colors[c.fullName.charCodeAt(0) % colors.length]
  return c.avatarUrl
    ? <Image src={c.avatarUrl} alt={c.fullName} width={40} height={40} className={`${sz} rounded-full object-cover flex-shrink-0`} />
    : <div className={`${sz} ${bg} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}>{initials}</div>
}

export default function DuoSection({ lang }: { lang: string }) {
  const bm = lang !== 'en'
  const [pair, setPair] = useState<Pair | null | undefined>(undefined)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Companion[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const fetchStatus = useCallback(async () => {
    const res = await fetch('/api/duo/status')
    const data = await res.json()
    setPair(data.pair ?? null)
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/duo/search?q=${encodeURIComponent(query)}`)
      setResults(await res.json())
      setSearching(false)
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  async function sendRequest(partnerId: string) {
    setLoading(true); setMsg(null)
    const res = await fetch('/api/duo/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg({ type: 'ok', text: bm ? 'Jemputan dihantar! Tunggu mereka terima.' : 'Invitation sent! Waiting for acceptance.' })
      setQuery(''); setResults([])
      await fetchStatus()
    } else {
      setMsg({ type: 'err', text: data.error })
    }
    setLoading(false)
  }

  async function respond(action: 'accept' | 'decline') {
    if (!pair) return
    setLoading(true); setMsg(null)
    const res = await fetch('/api/duo/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairId: pair.id, action }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg({ type: 'ok', text: action === 'accept'
        ? (bm ? 'Pasangan duo diterima! Selamat menjadi duo.' : 'Duo accepted! Welcome to the duo.')
        : (bm ? 'Jemputan ditolak.' : 'Invitation declined.')
      })
      await fetchStatus()
    } else {
      setMsg({ type: 'err', text: data.error })
    }
    setLoading(false)
  }

  async function dissolve() {
    if (!pair || !confirm(bm ? 'Bubar pasangan duo ini?' : 'Dissolve this duo pair?')) return
    setLoading(true); setMsg(null)
    const res = await fetch('/api/duo/dissolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairId: pair.id }),
    })
    if (res.ok) {
      setMsg({ type: 'ok', text: bm ? 'Pasangan duo dibubarkan.' : 'Duo pair dissolved.' })
      await fetchStatus()
    }
    setLoading(false)
  }

  if (pair === undefined) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="animate-pulse flex gap-3 items-center">
          <div className="w-10 h-10 bg-gray-100 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
            <Users className="w-4 h-4 text-[#6366F1]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {bm ? 'Duo Companion' : 'Duo Companion'}
            </h3>
            <p className="text-xs text-gray-400">
              {bm ? 'Makan bertiga — lebih meriah!' : 'Dine as a trio — more fun!'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {msg && (
          <div className={`text-xs px-3 py-2 rounded-lg mb-4 ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        {/* ACTIVE pair */}
        {pair?.status === 'active' && (
          <div>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl mb-3">
              <Avatar c={pair.partner} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{pair.partner.fullName}</span>
                  {pair.partner.icVerified && (
                    <span className="inline-flex items-center gap-0.5 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                      <ShieldCheck className="w-3 h-3" /> IC ✓
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{pair.partner.locationCity}, {pair.partner.locationState}</span>
                  {parseFloat(pair.partner.ratingAvg) > 0 && (
                    <>
                      <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                      <span>{parseFloat(pair.partner.ratingAvg).toFixed(1)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
                <Check className="w-3 h-3" />
                {bm ? 'Aktif' : 'Active'}
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              {bm
                ? 'Pasangan duo anda aktif. Customer boleh book anda berdua sekarang.'
                : 'Your duo pair is active. Customers can now book both of you.'}
            </p>
            <button onClick={dissolve} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
              {bm ? 'Bubar pasangan' : 'Dissolve pair'}
            </button>
          </div>
        )}

        {/* PENDING — current user is requester */}
        {pair?.status === 'pending' && pair.isRequester && (
          <div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl mb-3">
              <Avatar c={pair.partner} size="md" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-gray-900 text-sm block truncate">{pair.partner.fullName}</span>
                <span className="text-xs text-gray-500">{pair.partner.locationCity}, {pair.partner.locationState}</span>
              </div>
              <div className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
                <Clock className="w-3 h-3" />
                {bm ? 'Menunggu' : 'Pending'}
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              {bm ? 'Jemputan telah dihantar. Tunggu mereka terima.' : 'Invitation sent. Waiting for their response.'}
            </p>
            <button onClick={dissolve} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              {bm ? 'Tarik balik jemputan' : 'Cancel invitation'}
            </button>
          </div>
        )}

        {/* PENDING — current user is the invited partner */}
        {pair?.status === 'pending' && !pair.isRequester && (
          <div>
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl mb-3">
              <Avatar c={pair.partner} size="md" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-gray-900 text-sm block truncate">{pair.partner.fullName}</span>
                <span className="text-xs text-gray-500">{pair.partner.locationCity}, {pair.partner.locationState}</span>
              </div>
            </div>
            <p className="text-xs font-medium text-indigo-700 mb-3">
              {bm ? 'Anda dijemput untuk jadi pasangan duo!' : 'You have been invited to be a duo companion!'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => respond('accept')} disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#6366F1] text-white text-sm font-semibold py-2 rounded-xl hover:bg-[#4F46E5] transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {bm ? 'Terima' : 'Accept'}
              </button>
              <button onClick={() => respond('decline')} disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 text-sm font-semibold py-2 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">
                <X className="w-4 h-4" />
                {bm ? 'Tolak' : 'Decline'}
              </button>
            </div>
          </div>
        )}

        {/* NO pair — show search */}
        {pair === null && (
          <div>
            <p className="text-xs text-gray-500 mb-3">
              {bm
                ? 'Cari Meal Companion lain untuk jadi pasangan duo anda. Customer boleh book anda berdua sekali gus.'
                : 'Find another Meal Companion to pair with. Customers can book both of you at once.'}
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={bm ? 'Cari nama companion...' : 'Search companion name...'}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:bg-white transition-all"
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />}
            </div>

            {results.length > 0 && (
              <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                {results.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                    <Avatar c={c} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-900 truncate">{c.fullName}</span>
                        {c.icVerified && <ShieldCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
                      </div>
                      <span className="text-xs text-gray-400">{c.locationCity}, {c.locationState}</span>
                    </div>
                    <button
                      onClick={() => sendRequest(c.id)}
                      disabled={loading}
                      className="flex-shrink-0 text-xs bg-[#6366F1] text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-[#4F46E5] transition-colors disabled:opacity-50">
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (bm ? 'Jemput' : 'Invite')}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {query.length >= 2 && !searching && results.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-3">
                {bm ? 'Tiada companion ditemui.' : 'No companions found.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
