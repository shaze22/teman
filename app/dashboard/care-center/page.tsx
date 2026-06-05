import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Heart, Building2, Search, Clock, CheckCircle2, AlertCircle, CalendarPlus } from 'lucide-react'
import SignOutButton from '../_sign-out-button'
import { translations, type Lang } from '@/lib/i18n'

export default async function CareCenterDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'en') as Lang
  const t = translations[lang]

  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (!dbUser || dbUser.role !== 'care_center') redirect('/dashboard')

  const { data: profile } = await supabaseAdmin
    .from('care_center_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/register/care-center')

  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, booking_code, status, scheduled_date, start_time, duration_hours,
      total_amount, service_type, recipient_name,
      single_mother_profiles!inner(users!inner(full_name))
    `)
    .eq('customer_id', user.id)
    .order('scheduled_date', { ascending: false })
    .limit(10)

  const isPending = dbUser.status === 'pending'
  const activeCount = bookings?.filter(b => ['confirmed', 'in_progress'].includes(b.status)).length ?? 0
  const completedCount = bookings?.filter(b => b.status === 'completed').length ?? 0

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-[#0F0E17]">SenioCare</span>
          </Link>
          <SignOutButton />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {isPending && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Akaun Dalam Semakan</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Pasukan SenioCare sedang mengesahkan maklumat pusat anda. Proses ini mengambil masa 1–2 hari bekerja.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile.center_name}</h1>
            <p className="text-sm text-gray-500">{profile.city}, {profile.state} · {profile.pic_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Aktif', value: activeCount, icon: Clock, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Selesai', value: completedCount, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Kapasiti', value: profile.resident_capacity ?? '—', icon: Building2, color: 'text-amber-600 bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Tempah Pengasuh</h2>
          <Link
            href={isPending ? '#' : '/search'}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isPending
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#6366F1] text-white hover:bg-[#4F46E5]'
            }`}
          >
            <CalendarPlus className="w-4 h-4" />
            Tempah Sekarang
          </Link>
        </div>

        {isPending ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Anda boleh mula membuat tempahan selepas akaun disahkan.</p>
          </div>
        ) : !bookings?.length ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">Belum ada tempahan</p>
            <p className="text-xs text-gray-400 mb-4">Cari pengasuh yang sesuai untuk penghuni anda</p>
            <Link href="/search" className="inline-flex items-center gap-2 bg-[#6366F1] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#4F46E5] transition-colors">
              <Search className="w-4 h-4" /> Cari Pengasuh
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const providerName = (b.single_mother_profiles as any)?.users?.full_name ?? '—'
              const statusMap: Record<string, { label: string; cls: string }> = {
                pending: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700' },
                confirmed: { label: 'Disahkan', cls: 'bg-blue-100 text-blue-700' },
                in_progress: { label: 'Sedang Berjalan', cls: 'bg-indigo-100 text-indigo-700' },
                completed: { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-700' },
                cancelled: { label: 'Dibatalkan', cls: 'bg-gray-100 text-gray-500' },
              }
              const st = statusMap[b.status] ?? { label: b.status, cls: 'bg-gray-100 text-gray-500' }
              return (
                <Link key={b.id} href={`/booking/${b.id}`} className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm text-gray-900">
                      {b.recipient_name ? `Penghuni: ${b.recipient_name}` : 'Booking #' + b.booking_code}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {providerName} · {b.scheduled_date} · {b.start_time} · {b.duration_hours}j
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">RM{Number(b.total_amount).toFixed(2)}</div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
