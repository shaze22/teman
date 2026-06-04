import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Heart, ArrowLeft, Calendar, Clock } from 'lucide-react'
import { translations, type Lang } from '@/lib/i18n'

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-700',
  confirmed:   'bg-blue-100 text-blue-700',
  in_progress: 'bg-[#FFE4E6] text-[#BE123C]',
  completed:   'bg-[#E0E7FF] text-[#3730A3]',
  cancelled:   'bg-red-100 text-red-700',
}

const STATUS_ORDER = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']

export default async function ProviderBookingsPage() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'bm') as Lang
  const t = translations[lang]
  const dc = t.dashCommon

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawBookings } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, booking_code, status, scheduled_date, start_time, duration_hours,
      service_type, provider_price, total_amount, created_at,
      customer:users!bookings_customer_id_fkey(full_name, phone)
    `)
    .eq('provider_id', user.id)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookings = (rawBookings ?? []).map((b: any) => ({
    id: b.id as string,
    bookingCode: b.booking_code as string,
    status: b.status as string,
    scheduledDate: b.scheduled_date as string,
    startTime: b.start_time as string,
    durationHours: b.duration_hours as number | null,
    serviceType: b.service_type as string,
    providerPrice: parseFloat(String(b.provider_price)),
    createdAt: b.created_at as string,
    customer: { fullName: b.customer?.full_name ?? '', phone: b.customer?.phone ?? '' },
  }))

  const grouped = STATUS_ORDER.reduce<Record<string, typeof bookings>>((acc, s) => {
    acc[s] = bookings.filter(b => b.status === s)
    return acc
  }, {})

  const activeStatuses = STATUS_ORDER.filter(s => grouped[s].length > 0)
  const dateLocale = lang === 'en' ? 'en-MY' : 'ms-MY'

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard/provider" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-[#6366F1]" fill="currentColor" />
            <span className="font-bold text-[#6366F1]">SenioCare</span>
          </Link>
          <span className="font-semibold text-gray-900 ml-2">{dc.allBookings}</span>
          <span className="ml-auto text-sm text-gray-400">{bookings.length} {dc.bookingCount}</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">ðŸ"‹</div>
            <h3 className="font-semibold text-gray-900 mb-2">{dc.noBookings}</h3>
            <p className="text-sm text-gray-500">{dc.bookingsFromCustomer}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeStatuses.map(status => (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[status]}`}>
                    {t.status[status as keyof typeof t.status] ?? status}
                  </span>
                  <span className="text-sm text-gray-400">{grouped[status].length}</span>
                </div>
                <div className="space-y-2">
                  {grouped[status].map(b => (
                    <Link key={b.id} href={`/booking/${b.id}`}
                      className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-[#6366F1] hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                            {b.customer.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{b.customer.fullName}</div>
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(b.scheduledDate).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {b.startTime}{b.durationHours ? ` · ${b.durationHours}${lang === 'en' ? 'h' : 'j'}` : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-[#6366F1]">RM{b.providerPrice.toFixed(0)}</div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{b.bookingCode}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
