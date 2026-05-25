import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { MapPin, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import UserSuspendButton from './_user-suspend-button'

export default async function AdminCustomersPage() {
  await requireAdmin()

  const { data: rawCustomers } = await supabaseAdmin
    .from('customer_profiles')
    .select(`
      id, is_for_self, location_city, location_state, mobility_status, created_at,
      users!inner(id, full_name, email, status)
    `)
    .order('created_at', { ascending: false })

  // Count bookings per customer separately
  const { data: bookingCounts } = await supabaseAdmin
    .from('bookings')
    .select('customer_id')

  const countMap: Record<string, number> = {}
  for (const b of bookingCounts ?? []) {
    countMap[b.customer_id] = (countMap[b.customer_id] ?? 0) + 1
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customers = (rawCustomers ?? []).map((c: any) => ({
    id: c.id,
    userId: c.users.id as string,
    fullName: c.users.full_name as string,
    email: c.users.email as string,
    status: c.users.status as string,
    isForSelf: c.is_for_self as boolean,
    locationCity: c.location_city as string,
    locationState: c.location_state as string,
    mobilityStatus: c.mobility_status as string | null,
    bookingCount: countMap[c.users.id] ?? 0,
    createdAt: new Date(c.created_at as string),
  }))

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengurusan Pelanggan</h1>
        <p className="text-sm text-gray-500 mt-1">{customers.length} pelanggan berdaftar</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {customers.map(c => (
          <div key={c.id} className="p-4 flex items-center gap-4">
            <Link href={`/admin/customers/${c.userId}`} className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-[#F43F5E] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {c.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{c.fullName}</span>
                  {c.isForSelf
                    ? <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Untuk Diri</span>
                    : <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">Waris</span>}
                  {c.status === 'suspended' && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Suspended</span>}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                  <span>{c.email}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.locationCity}</span>
                  <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{c.bookingCount} booking</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0 mr-4">
                {c.createdAt.toLocaleDateString('ms-MY')}
              </div>
            </Link>
            <UserSuspendButton userId={c.userId} isActive={c.status !== 'suspended'} />
          </div>
        ))}
        {customers.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-400">Tiada pelanggan lagi</div>
        )}
      </div>
    </div>
  )
}
