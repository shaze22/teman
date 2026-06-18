import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { AlertTriangle, CheckCircle, MapPin } from 'lucide-react'
import SosResolveButton from './_sos-resolve-button'

export default async function AdminSosPage() {
  await requireAdmin()

  const { data: rawSOS } = await supabaseAdmin
    .from('sos_events')
    .select(`
      id, status, lat, lng, reason, created_at, resolved_at,
      triggerer:users!sos_events_triggered_by_fkey(id, full_name, email),
      booking:bookings(booking_code, scheduled_date)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = (rawSOS ?? []).map((s: any) => ({
    id: s.id as string,
    status: s.status as string,
    lat: s.lat as number | null,
    lng: s.lng as number | null,
    reason: s.reason as string | null,
    createdAt: new Date(s.created_at as string),
    resolvedAt: s.resolved_at ? new Date(s.resolved_at as string) : null,
    triggererName: s.triggerer?.full_name ?? '',
    triggererEmail: s.triggerer?.email ?? '',
    triggererId: s.triggerer?.id ?? '',
    bookingCode: s.booking?.booking_code ?? null,
    scheduledDate: s.booking?.scheduled_date ?? null,
  }))

  const active = events.filter(e => e.status === 'active')
  const resolved = events.filter(e => e.status !== 'active')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SOS Events</h1>
        <p className="text-sm text-gray-500 mt-1">{active.length} active · {resolved.length} resolved</p>
      </div>

      {active.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider">Active SOS ({active.length})</h2>
          </div>
          <div className="space-y-3">
            {active.map(e => <SosCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {active.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center gap-3 mb-8">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
          <div>
            <div className="font-semibold text-emerald-800">No active SOS</div>
            <div className="text-sm text-emerald-600">All users are safe</div>
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">SOS History ({resolved.length})</h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {resolved.map(e => (
              <div key={e.id} className="p-4 flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${e.status === 'resolved' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  <CheckCircle className={`w-4 h-4 ${e.status === 'resolved' ? 'text-emerald-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{e.triggererName}</div>
                  <div className="text-xs text-gray-500">{e.createdAt.toLocaleString('en-MY')}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${e.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {e.status === 'resolved' ? 'Resolved' : 'False Alarm'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SosCard({ event: e }: { event: { id: string; triggererName: string; triggererEmail: string; reason: string | null; lat: number | null; lng: number | null; bookingCode: string | null; createdAt: Date } }) {
  const elapsed = Math.floor((Date.now() - e.createdAt.getTime()) / 60000)

  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="font-bold text-red-900">{e.triggererName}</div>
            <div className="text-sm text-red-700">{e.triggererEmail}</div>
            {e.bookingCode && (
              <div className="text-xs text-red-500 mt-0.5">Booking: {e.bookingCode}</div>
            )}
            {e.reason && (
              <div className="text-sm text-red-800 mt-2 bg-red-100 rounded-lg px-3 py-2">{e.reason}</div>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-red-500">
              <span>{elapsed < 1 ? 'Just now' : `${elapsed} min ago`}</span>
              {e.lat && e.lng && (
                <a
                  href={`https://maps.google.com/?q=${e.lat},${e.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 underline hover:text-red-700"
                >
                  <MapPin className="w-3 h-3" /> View location
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <SosResolveButton sosId={e.id} status="resolved" label="Resolve" />
          <SosResolveButton sosId={e.id} status="false_alarm" label="False Alarm" variant="ghost" />
        </div>
      </div>
    </div>
  )
}
