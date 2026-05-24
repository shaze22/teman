import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  Heart, Settings, Search, Calendar,
  AlertTriangle, Clock,
} from 'lucide-react'
import SignOutButton from '../_sign-out-button'
import NotificationBell from '../_notification-bell'
import SosButton from './_sos-button'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-[#FFE4E6] text-[#BE123C]',
  completed: 'bg-[#E0E7FF] text-[#3730A3]',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  confirmed: 'Disahkan',
  in_progress: 'Sedang Berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

export default async function CustomerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rawProfile } = await supabaseAdmin
    .from('customer_profiles')
    .select('id, is_for_self, senior_full_name, location_city, mobility_status, users!inner(full_name, avatar_url), emergency_contacts(*)')
    .eq('user_id', user.id)
    .single()

  if (!rawProfile) redirect('/register/customer')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (rawProfile as any).users as { full_name: string; avatar_url: string | null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emergencyContacts = ((rawProfile as any).emergency_contacts ?? []) as Array<{ id: string; name: string; relationship: string; phone: string }>

  const profile = {
    id: rawProfile.id,
    isForSelf: rawProfile.is_for_self,
    seniorFullName: rawProfile.senior_full_name as string | null,
    locationCity: rawProfile.location_city,
    mobilityStatus: rawProfile.mobility_status as string | null,
    user: { fullName: u.full_name, avatarUrl: u.avatar_url },
    emergencyContacts,
  }

  const { data: rawBookings } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, status, payment_status, scheduled_date, start_time, duration_hours, total_amount,
      provider:users!bookings_provider_id_fkey(full_name, avatar_url, single_mother_profiles(location_city))
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookings = (rawBookings ?? []).map((b: any) => ({
    id: b.id,
    status: b.status as string,
    paymentStatus: b.payment_status as string,
    scheduledDate: b.scheduled_date as string,
    startTime: b.start_time as string,
    durationHours: b.duration_hours as number | null,
    totalAmount: b.total_amount as number,
    provider: {
      fullName: b.provider?.full_name ?? '',
      avatarUrl: b.provider?.avatar_url ?? null,
      singleMotherProfile: {
        locationCity: b.provider?.single_mother_profiles?.[0]?.location_city ?? null,
      },
    },
  }))

  const activeBookings = bookings.filter((b) => ['pending', 'confirmed', 'in_progress'].includes(b.status))
  const displayName = profile.isForSelf ? profile.user.fullName : (profile.seniorFullName ?? profile.user.fullName)
  const initials = profile.user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F43F5E] flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-[#0F0E17]">Teman</span>
            <span className="text-xs text-gray-400 font-medium ml-1 hidden sm:block">· Pelanggan</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell userId={user.id} accentColor="#F43F5E" />
            <Link href="/dashboard/customer/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
              <Settings className="w-5 h-5" />
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-[#F43F5E] text-white flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {profile.isForSelf ? `Hai, ${displayName.split(' ')[0]}!` : `Pantau ${displayName.split(' ')[0]}`}
            </h1>
            <p className="text-sm text-gray-500">
              {profile.isForSelf ? 'Dashboard Pelanggan' : 'Dashboard Waris'}
            </p>
          </div>
        </div>

        <SosButton />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {activeBookings.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Booking Aktif</h2>
                <div className="space-y-3">
                  {activeBookings.map((b) => (
                    <div key={b.id} className="bg-white rounded-xl border-2 border-[#F43F5E]/30 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#6366F1] text-white flex items-center justify-center text-sm font-bold">
                            {b.provider.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{b.provider.fullName}</div>
                            <div className="text-xs text-gray-500">{b.provider.singleMotherProfile.locationCity}</div>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[b.status]}`}>
                          {STATUS_LABELS[b.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(b.scheduledDate).toLocaleDateString('ms-MY')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {b.startTime}{b.durationHours && ` · ${b.durationHours} jam`}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#6366F1]">RM{parseFloat(String(b.totalAmount)).toFixed(0)}</span>
                          {b.paymentStatus === 'pending' && b.status === 'confirmed' && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">Perlu Bayar</span>
                          )}
                          {b.paymentStatus === 'paid' && (
                            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Dibayar</span>
                          )}
                        </div>
                        <Link href={`/booking/${b.id}`} className="text-sm text-[#F43F5E] font-medium hover:underline">Lihat Detail</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">Semua Booking</h2>
              </div>
              {bookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <div className="text-4xl mb-3">🤝</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Belum ada booking</h3>
                  <p className="text-sm text-gray-500 mb-4">Cari Teman yang sesuai dan buat booking pertama anda.</p>
                  <Link href="/search"
                    className="inline-flex items-center gap-2 bg-[#F43F5E] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#E11D48] transition-colors">
                    <Search className="w-4 h-4" /> Cari Teman Sekarang
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookings.map((b) => (
                    <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#6366F1] text-white flex items-center justify-center text-sm font-bold">
                          {b.provider.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{b.provider.fullName}</div>
                          <div className="text-xs text-gray-500">{new Date(b.scheduledDate).toLocaleDateString('ms-MY')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[b.status]}`}>
                          {STATUS_LABELS[b.status]}
                        </span>
                        <span className="text-sm font-bold text-gray-900">RM{parseFloat(String(b.totalAmount)).toFixed(0)}</span>
                        <Link href={`/booking/${b.id}`} className="text-xs text-[#F43F5E] hover:underline">Detail</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Link href="/search"
              className="flex items-center gap-3 bg-[#F43F5E] text-white p-4 rounded-xl hover:bg-[#E11D48] transition-colors font-semibold">
              <Search className="w-5 h-5" />
              Cari Teman Baru
            </Link>

            {emergencyContacts.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Kenalan Kecemasan
                </h3>
                {emergencyContacts.map((c) => (
                  <div key={c.id}>
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-sm text-gray-500">{c.relationship}</div>
                    <a href={`tel:${c.phone}`} className="text-sm text-[#F43F5E] font-medium hover:underline">{c.phone}</a>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Maklumat</h3>
              <div className="space-y-2 text-sm">
                {!profile.isForSelf && profile.seniorFullName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Warga Emas</span>
                    <span className="font-medium">{profile.seniorFullName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Lokasi</span>
                  <span className="font-medium">{profile.locationCity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mobiliti</span>
                  <span className="font-medium capitalize">{profile.mobilityStatus?.replace('_', ' ')}</span>
                </div>
              </div>
              <Link href="/dashboard/customer/profile"
                className="mt-3 block text-center text-sm text-[#F43F5E] font-medium hover:underline">
                Edit Profil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
