import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import DisputeActions from './_dispute-actions'

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  investigating: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-100 text-gray-500',
}
const STATUS_LABELS: Record<string, string> = {
  open: 'Baru', investigating: 'Disiasat', resolved: 'Selesai', closed: 'Ditutup',
}

export default async function AdminDisputesPage() {
  await requireAdmin()

  const { data: disputes } = await supabaseAdmin
    .from('disputes')
    .select('id, booking_id, raised_by, reason, status, resolution, admin_notes, created_at, resolved_at')
    .order('created_at', { ascending: false })

  const enriched = await Promise.all((disputes ?? []).map(async (d) => {
    const [{ data: booking }, { data: raiser }] = await Promise.all([
      supabaseAdmin.from('bookings').select('booking_code, total_amount').eq('id', d.booking_id).single(),
      supabaseAdmin.from('users').select('full_name').eq('id', d.raised_by).single(),
    ])
    return {
      ...d,
      bookingCode: booking?.booking_code ?? '',
      totalAmount: parseFloat(String(booking?.total_amount ?? 0)),
      raiserName: raiser?.full_name ?? '',
    }
  }))

  const open = enriched.filter(d => d.status === 'open' || d.status === 'investigating')
  const closed = enriched.filter(d => d.status === 'resolved' || d.status === 'closed')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Aduan / Dispute</h1>
        <p className="text-sm text-gray-500 mt-1">{open.length} aktif · {closed.length} selesai</p>
      </div>

      {open.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-3">Memerlukan Tindakan ({open.length})</h2>
          <div className="space-y-3">
            {open.map(d => <DisputeRow key={d.id} dispute={d} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Selesai / Ditutup ({closed.length})</h2>
        <div className="space-y-3">
          {closed.map(d => <DisputeRow key={d.id} dispute={d} />)}
          {closed.length === 0 && <p className="text-sm text-gray-400">Tiada lagi.</p>}
        </div>
      </section>
    </div>
  )
}

function DisputeRow({ dispute: d }: { dispute: Awaited<ReturnType<typeof Promise.resolve<{
  id: string; booking_id: string; reason: string; status: string; resolution: string | null;
  admin_notes: string | null; created_at: string; resolved_at: string | null;
  bookingCode: string; totalAmount: number; raiserName: string;
}>>> }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[d.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[d.status] ?? d.status}
            </span>
            <Link href={`/booking/${d.booking_id}`} className="text-xs font-mono text-[#6366F1] hover:underline">
              #{d.bookingCode}
            </Link>
            <span className="text-xs text-gray-400">RM{d.totalAmount.toFixed(0)}</span>
          </div>
          <p className="text-sm font-medium text-gray-900">Oleh: {d.raiserName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{new Date(d.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 mb-3">
        <p className="text-xs font-medium text-gray-500 mb-1">Sebab Aduan:</p>
        <p className="text-sm text-gray-700">{d.reason}</p>
      </div>

      {d.resolution && (
        <div className="bg-emerald-50 rounded-xl p-3 mb-3">
          <p className="text-xs font-medium text-emerald-600 mb-1">Resolusi:</p>
          <p className="text-sm text-emerald-800">{d.resolution}</p>
        </div>
      )}

      <DisputeActions disputeId={d.id} currentStatus={d.status} />
    </div>
  )
}
