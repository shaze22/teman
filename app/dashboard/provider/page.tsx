import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  Heart, Star, Calendar, DollarSign, Settings,
  CheckCircle, Clock, AlertCircle, TrendingUp,
} from 'lucide-react'
import SignOutButton from '../_sign-out-button'
import BookingActions from './_booking-actions'
import NotificationBell from '../_notification-bell'
import PushSetup from '../_push-setup'
import DuoSection from './_duo-section'
import { translations, type Lang } from '@/lib/i18n'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-[#FFE4E6] text-[#BE123C]',
  completed: 'bg-[#E0E7FF] text-[#3730A3]',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function ProviderDashboard() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'bm') as Lang
  const t = translations[lang]
  const dc = t.dashCommon

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rawProfile } = await supabaseAdmin
    .from('single_mother_profiles')
    .select('id, bio, verified_by_ngo, rating_avg, users!inner(full_name, avatar_url)')
    .eq('user_id', user.id)
    .single()

  if (!rawProfile) redirect('/register/provider')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (rawProfile as any).users as { full_name: string; avatar_url: string | null }
  const profile = {
    id: rawProfile.id,
    bio: rawProfile.bio,
    verifiedByNgo: rawProfile.verified_by_ngo,
    ratingAvg: rawProfile.rating_avg,
    user: { fullName: u.full_name, avatarUrl: u.avatar_url },
  }

  const { data: rawBookings } = await supabaseAdmin
    .from('bookings')
    .select('id, status, scheduled_date, start_time, duration_hours, provider_price, is_duo, created_at, customer:users!bookings_customer_id_fkey(full_name, avatar_url)')
    .or(`provider_id.eq.${user.id},duo_partner_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(10)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookings = (rawBookings ?? []).map((b: any) => ({
    id: b.id,
    status: b.status as string,
    scheduledDate: b.scheduled_date as string,
    startTime: b.start_time as string,
    durationHours: b.duration_hours as number | null,
    providerPrice: b.provider_price as number,
    isDuo: b.is_duo as boolean,
    createdAt: new Date(b.created_at),
    customer: { fullName: b.customer?.full_name ?? '', avatarUrl: b.customer?.avatar_url ?? null },
  }))

  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const completedCount = bookings.filter((b) => b.status === 'completed').length
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const monthlyEarnings = bookings
    .filter((b) => b.status === 'completed' && b.createdAt > cutoff)
    .reduce((sum, b) => sum + parseFloat(String(b.providerPrice)), 0)

  const initials = profile.user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const dateLocale = lang === 'en' ? 'en-MY' : 'ms-MY'
  const ratingDisplay = parseFloat(String(profile.ratingAvg)) > 0
    ? parseFloat(String(profile.ratingAvg)).toFixed(1)
    : t.profilePage.newLabel

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-[#0F0E17]">SenioCare</span>
            <span className="text-xs text-gray-400 font-medium ml-1 hidden sm:block">{dc.providerNav}</span>
          </Link>
          <div className="flex items-center gap-2">
            <PushSetup />
            <NotificationBell userId={user.id} accentColor="#6366F1" />
            <Link href="/dashboard/provider/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
              <Settings className="w-5 h-5" />
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          {profile.user.avatarUrl ? (
            <Image src={profile.user.avatarUrl} alt={profile.user.fullName}
              width={56} height={56} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#6366F1] text-white flex items-center justify-center text-xl font-bold">
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{dc.welcome}, {profile.user.fullName.split(' ')[0]}!</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {profile.verifiedByNgo ? (
                <span className="flex items-center gap-1 text-xs text-[#6366F1] font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified NGO
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                  <Clock className="w-3.5 h-3.5" /> {dc.pendingNGO}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={DollarSign} label={dc.monthlyEarnings} value={`RM${monthlyEarnings.toFixed(0)}`} color="text-[#6366F1] bg-[#E0E7FF]" />
          <StatCard icon={Calendar} label={dc.bookingsPending} value={pendingCount.toString()} color="text-yellow-600 bg-yellow-100" />
          <StatCard icon={CheckCircle} label={dc.sessionsCompleted} value={completedCount.toString()} color="text-blue-600 bg-blue-100" />
          <StatCard icon={Star} label={dc.ratingLabel} value={ratingDisplay} color="text-yellow-500 bg-yellow-100" />
        </div>

        {!profile.bio && (
          <div className="bg-[#FFF1F2] border border-orange-200 rounded-xl p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">{dc.completeProfileTitle}</p>
              <p className="text-xs text-orange-600 mt-0.5">
                {dc.completeProfileDesc}{' '}
                <Link href="/dashboard/provider/profile" className="underline font-medium">{dc.editNow}</Link>
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{dc.recentBookings}</h2>
              <Link href="/dashboard/provider/bookings" className="text-sm text-[#6366F1] font-medium hover:underline">{dc.viewAll}</Link>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="font-semibold text-gray-900 mb-1">{dc.noBookings}</h3>
                <p className="text-sm text-gray-500">{dc.noBookingsProviderDesc}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500">
                          {b.customer.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{b.customer.fullName}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(b.scheduledDate).toLocaleDateString(dateLocale)} · {b.startTime}
                            {b.durationHours && ` · ${b.durationHours} ${dc.hours}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {b.isDuo && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">Duo</span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[b.status]}`}>
                          {t.status[b.status as keyof typeof t.status] ?? b.status}
                        </span>
                        <span className="text-sm font-bold text-[#6366F1]">
                          RM{parseFloat(String(b.providerPrice)).toFixed(0)}
                        </span>
                        <Link href={`/booking/${b.id}`} className="text-xs text-gray-400 hover:text-gray-600 underline">{dc.detail}</Link>
                      </div>
                    </div>
                    {b.status === 'pending' && <BookingActions bookingId={b.id} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <DuoSection lang={lang} />

            <h2 className="text-lg font-bold text-gray-900">{dc.quickActions}</h2>
            <div className="space-y-3">
              <QuickAction href="/dashboard/provider/profile" icon={Settings} label={dc.editProfile} desc={dc.editProfileDesc} />
              <QuickAction href="/dashboard/provider/availability" icon={Calendar} label={dc.setAvailability} desc={dc.setAvailDesc} />
              <QuickAction href="/dashboard/provider/earnings" icon={TrendingUp} label={dc.myEarnings} desc={dc.myEarningsDesc} />
              <QuickAction href={`/carer/${profile.id}`} icon={Star} label={dc.viewPublicProfile} desc={dc.viewPublicProfileDesc} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Star; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

function QuickAction({ href, icon: Icon, label, desc }: { href: string; icon: typeof Star; label: string; desc: string }) {
  return (
    <Link href={href}
      className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:border-[#6366F1] hover:shadow-sm transition-all group">
      <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center flex-shrink-0 group-hover:bg-[#6366F1] group-hover:text-white transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
    </Link>
  )
}
