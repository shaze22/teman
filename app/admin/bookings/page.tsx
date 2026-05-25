import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Calendar, DollarSign } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-[#FFE4E6] text-[#BE123C]',
  completed: 'bg-[#E0E7FF] text-[#3730A3]',
  cancelled: 'bg-red-100 text-red-700',
  disputed: 'bg-orange-100 text-orange-700',
  refunded: 'bg-gray-100 text-gray-600',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu', confirmed: 'Disahkan', in_progress: 'Berjalan',
  completed: 'Selesai', cancelled: 'Dibatalkan', disputed: 'Dispute', refunded: 'Dikembalikan',
}
const STATUS_ORDER = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed', 'refunded']

export default async function AdminBookingsPage() {
  await requireAdmin()

  const { data: rawBookings } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, booking_code, status, scheduled_date, start_time, duration_hours,
      total_amount, platform_fee, provider_price, payment_status, created_at,
      customer:users!bookings_customer_id_fkey(full_name),
      provider:users!bookings_provider_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookings = (rawBookings ?? []).map((b: any) => ({
    id: b.id as string,
    bookingCode: b.booking_code as string,
    status: b.status as string,
    scheduledDate: b.scheduled_date as string,
    startTime: b.start_time as string,
    durationHours: b.duration_hours as number | null,
    totalAmount: parseFloat(String(b.total_amount)),
    platformFee: parseFloat(String(b.platform_fee)),
    providerPrice: parseFloat(String(b.provider_price)),
    paymentStatus: b.payment_status as string,
    customerName: b.customer?.full_name ?? '',
    providerName: b.provider?.full_name ?? '',
    createdAt: new Date(b.created_at as string),
  }))

  const grouped = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = bookings.filter(b => b.status === s)
    return acc
  }, {} as Record<string, typeof bookings>)

  const totalRevenue = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.platformFee, 0)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengurusan Booking</h1>
          <p className="text-sm text-gray-500 mt-1">{bookings.length} booking · RM{totalRevenue.toFixed(0)} hasil platform</p>
        </div>
        <div className="flex items-center gap-2">
          {STATUS_ORDER.filter(s => grouped[s].length > 0).map(s => (
            <span key={s} className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[s]}`}>
              {STATUS_LABELS[s]}: {grouped[s].length}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto_auto] gap-0 text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="w-28">Kod</div>
          <div>Pelanggan</div>
          <div>Provider</div>
          <div className="w-24 text-center">Tarikh</div>
          <div className="w-20 text-right">Jumlah</div>
          <div className="w-20 text-right">Fee</div>
          <div className="w-24 text-center">Status</div>
        </div>
        <div className="divide-y divide-gray-50">
          {bookings.map(b => (
            <Link key={b.id} href={`/booking/${b.id}`} className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto_auto] gap-0 px-4 py-3 items-center hover:bg-[#EEF2FF] transition-colors cursor-pointer">
              <div className="w-28 text-xs font-mono text-[#6366F1]">{b.bookingCode}</div>
              <div className="text-sm text-gray-900 truncate pr-2">{b.customerName}</div>
              <div className="text-sm text-gray-900 truncate pr-2">{b.providerName}</div>
              <div className="w-24 text-center">
                <div className="text-xs text-gray-600">{new Date(b.scheduledDate).toLocaleDateString('ms-MY')}</div>
                <div className="text-xs text-gray-400">{b.startTime}</div>
              </div>
              <div className="w-20 text-right text-sm font-semibold text-gray-900">RM{b.totalAmount.toFixed(0)}</div>
              <div className="w-20 text-right text-sm font-medium text-[#6366F1]">RM{b.platformFee.toFixed(0)}</div>
              <div className="w-24 text-center">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[b.status] ?? b.status}
                </span>
              </div>
            </Link>
          ))}
          {bookings.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">Tiada booking lagi</div>
          )}
        </div>
      </div>
    </div>
  )
}
