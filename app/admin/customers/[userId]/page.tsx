import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ArrowLeft, MapPin, Calendar, ShoppingBag, Heart, Phone } from 'lucide-react'
import UserSuspendButton from '../_user-suspend-button'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', in_progress: 'In Progress',
  completed: 'Completed', cancelled: 'Cancelled',
}

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  await requireAdmin()
  const { userId } = await params

  const [{ data: user }, { data: profile }, { data: rawBookings }] = await Promise.all([
    supabaseAdmin.from('users').select('id, full_name, email, phone, status, created_at').eq('id', userId).single(),
    supabaseAdmin.from('customer_profiles').select('id, is_for_self, mobility_status, health_conditions, location_city, location_state').eq('user_id', userId).single(),
    supabaseAdmin
      .from('bookings')
      .select(`
        id, booking_code, status, scheduled_date, start_time, total_amount, payment_status, created_at,
        provider:users!bookings_provider_id_fkey(full_name)
      `)
      .eq('customer_id', userId)
      .order('created_at', { ascending: false }),
  ])

  if (!user) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookings = (rawBookings ?? []).map((b: any) => ({
    id: b.id as string,
    bookingCode: b.booking_code as string,
    status: b.status as string,
    scheduledDate: b.scheduled_date as string,
    startTime: b.start_time as string,
    totalAmount: parseFloat(String(b.total_amount)),
    paymentStatus: b.payment_status as string,
    providerName: b.provider?.full_name ?? '-',
    createdAt: new Date(b.created_at as string),
  }))

  const totalSpent = bookings.filter(b => b.status === 'completed' && b.paymentStatus === 'paid')
    .reduce((s, b) => s + b.totalAmount, 0)

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/customers" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <UserSuspendButton userId={userId} isActive={user.status !== 'suspended'} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">User Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Heart className="w-4 h-4 text-rose-500" /> {user.full_name}</div>
            {user.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" /> {user.phone}</div>}
            {profile?.location_city && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" /> {profile.location_city}, {profile.location_state}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" /> Registered: {new Date(user.created_at).toLocaleDateString('en-MY')}
            </div>
            {profile?.mobility_status && (
              <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full inline-block">
                {profile.mobility_status}
              </div>
            )}
            {user.status === 'suspended' && (
              <div className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full inline-block">Suspended</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Statistics</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total bookings</span>
              <span className="font-semibold">{bookings.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Completed bookings</span>
              <span className="font-semibold">{bookings.filter(b => b.status === 'completed').length}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <span className="text-gray-500">Total spent</span>
              <span className="font-bold text-teal-600">RM{totalSpent.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {profile?.health_conditions && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm">
          <p className="font-semibold text-amber-800 mb-1">Health Conditions</p>
          <p className="text-amber-700">{profile.health_conditions}</p>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" /> Booking History ({bookings.length})
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {bookings.map(b => (
            <Link key={b.id} href={`/booking/${b.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-teal-50 transition-colors">
              <div className="text-xs font-mono text-teal-600 w-28">{b.bookingCode}</div>
              <div className="flex-1 text-sm text-gray-900">{b.providerName}</div>
              <div className="text-xs text-gray-500">
                {new Date(b.scheduledDate).toLocaleDateString('en-MY')} · {b.startTime}
              </div>
              <div className="text-sm font-semibold text-gray-900 w-20 text-right">RM{b.totalAmount.toFixed(0)}</div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium w-24 text-center ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[b.status] ?? b.status}
              </span>
            </Link>
          ))}
          {bookings.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">No bookings yet</div>
          )}
        </div>
      </section>
    </div>
  )
}
