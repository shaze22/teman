'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, MapPin, Clock, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react'
import ProviderActions from './_provider-actions'
import IcActions from './_ic-actions'

type Provider = {
  id: string
  userId: string
  fullName: string
  email: string
  userStatus: string
  verifiedByAdmin: boolean
  locationCity: string
  locationState: string
  ratingAvg: number
  totalReviews: number
  totalBookings: number
  isActive: boolean
  icNumber: string | null
  icSubmittedAt: string | null
  icVerified: boolean
  icFrontUrl: string | null
  icBackUrl: string | null
  icRejectedReason: string | null
  isLocum: boolean
  locumCertType: string | null
  locumCertUrl: string | null
  locumVerified: boolean
}

export default function ProvidersListClient({ providers }: { providers: Provider[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const pending = providers.filter(p => !p.verifiedByAdmin)
  const allIds = pending.map(p => p.id)
  const allPendingSelected = allIds.length > 0 && allIds.every(id => selected.has(id))

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allPendingSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
  }

  async function bulkVerify() {
    const ids = [...selected]
    if (ids.length === 0) return
    await fetch('/api/admin/providers/bulk-verify', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileIds: ids }),
    })
    setSelected(new Set())
    startTransition(() => router.refresh())
  }

  return (
    <div>
      {pending.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wider">
              Menunggu Pengesahan Admin ({pending.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAll}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {allPendingSelected ? 'Nyahpilih Semua' : 'Pilih Semua'}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={bulkVerify}
                  disabled={isPending}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-semibold"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Sahkan Dipilih ({selected.size})
                </button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {pending.map(p => (
              <ProviderRow
                key={p.id}
                provider={p}
                highlight
                checked={selected.has(p.id)}
                onToggle={() => toggleOne(p.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Semua Provider ({providers.length})
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {providers.map(p => (
            <ProviderRow key={p.id} provider={p} checked={selected.has(p.id)} onToggle={() => toggleOne(p.id)} />
          ))}
          {providers.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">Tiada provider lagi</div>
          )}
        </div>
      </section>
    </div>
  )
}

function ProviderRow({
  provider: p,
  highlight,
  checked,
  onToggle,
}: {
  provider: Provider
  highlight?: boolean
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div className={`p-4 rounded-2xl flex items-center gap-3 ${highlight ? 'bg-orange-50 border border-orange-100' : 'bg-white border border-gray-100'}`}>
      {!p.verifiedByAdmin && (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="w-4 h-4 rounded border-gray-300 text-emerald-600 cursor-pointer flex-shrink-0 accent-emerald-600"
        />
      )}
      <Link href={`/carer/${p.id}`} className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 rounded-full bg-[#6366F1] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {p.fullName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{p.fullName}</span>
            {p.verifiedByNgo && <span className="text-xs bg-[#E0E7FF] text-[#6366F1] px-1.5 py-0.5 rounded-full">NGO ✓</span>}
            {p.verifiedByAdmin && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Admin ✓</span>}
            {!p.isActive && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Suspended</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            <span>{p.email}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.locationCity}</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" fill="currentColor" />{p.ratingAvg > 0 ? p.ratingAvg.toFixed(1) : 'Baru'}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.totalBookings} booking</span>
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.bgCheck === 'approved' ? 'bg-emerald-100 text-emerald-700' : p.bgCheck === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
          BG: {p.bgCheck}
        </span>
        {p.icSubmittedAt && (
          <IcActions profileId={p.id} icVerified={p.icVerified} icFrontUrl={p.icFrontUrl} icBackUrl={p.icBackUrl} icNumber={p.icNumber} />
        )}
        {!p.icSubmittedAt && (
          <span className="text-xs text-gray-400 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> No IC</span>
        )}
        {p.isLocum && !p.locumVerified && p.locumCertUrl && (
          <LocumVerifyActions profileId={p.id} certType={p.locumCertType} certUrl={p.locumCertUrl} />
        )}
        {p.isLocum && p.locumVerified && (
          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-medium">🩺 Locum ✓</span>
        )}
        <ProviderActions profileId={p.id} userId={p.userId} verifiedByAdmin={p.verifiedByAdmin} isActive={p.isActive} bgCheck={p.bgCheck} />
      </div>
    </div>
  )
}

function LocumVerifyActions({ profileId, certType, certUrl }: { profileId: string; certType: string | null; certUrl: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function act(action: 'approve' | 'reject') {
    setLoading(true)
    await fetch('/api/admin/providers/verify-locum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, action }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-1">
      <a href={certUrl} target="_blank" rel="noreferrer"
        className="text-xs text-teal-600 underline hover:text-teal-800">{certType ?? 'Sijil'}</a>
      <button onClick={() => act('approve')} disabled={loading}
        className="flex items-center gap-1 px-2 py-1 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 disabled:opacity-60">
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Locum ✓
      </button>
      <button onClick={() => act('reject')} disabled={loading}
        className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-lg hover:bg-red-200 disabled:opacity-60">
        Tolak
      </button>
    </div>
  )
}
