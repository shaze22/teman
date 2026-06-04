import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-auth'
import { Heart, ArrowLeft, Calendar, Clock, MapPin, User, Phone, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import BookingDetailActions from './_booking-detail-actions'
import PayButton from './_pay-button'
import { formatWAPhone } from '@/lib/utils'
import { translations, type Lang } from '@/lib/i18n'

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'bm') as Lang
  const t = translations[lang]
  const bd = t.bookingDetail

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    pending:     { label: bd.statusPending,     color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: AlertCircle },
    confirmed:   { label: bd.statusConfirmed,   color: 'text-blue-700 bg-blue-50 border-blue-200',       icon: CheckCircle },
    in_progress: { label: bd.statusInProgress,  color: 'text-[#BE123C] bg-[#FFF1F2] border-orange-200', icon: Clock },
    completed:   { label: bd.statusCompleted,   color: 'text-[#3730A3] bg-[#EEF2FF] border-[#C7D2FE]',  icon: CheckCircle },
    cancelled:   { label: bd.statusCancelled,   color: 'text-red-700 bg-red-50 border-red-200',          icon: XCircle },
  }

  const SERVICE_LABELS: Record<string, string> = {
    job: bd.serviceJob, food: bd.serviceFood, learning: bd.serviceLearning,
    business: bd.serviceBusiness, ibadah: bd.serviceIbadah, repair: bd.serviceRepair,
    riadah: bd.serviceRiadah, kombo: bd.serviceKombo,
  }

  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: b } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      customer:users!bookings_customer_id_fkey(full_name, phone),
      provider:users!bookings_provider_id_fkey(full_name, phone, single_mother_profiles(location_city, location_state))
    `)
    .eq('id', id)
    .single()

  if (!b) notFound()

  const adminUser = await isAdmin(user.id)
  if (!adminUser && b.customer_id !== user.id && b.provider_id !== user.id) notFound()

  const { data: existingReview } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('booking_id', id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customer = (b as any).customer as { full_name: string; phone: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = (b as any).provider as { full_name: string; phone: string; single_mother_profiles: { location_city: string; location_state: string }[] }
  const status = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending
  const StatusIcon = status.icon
  const isCustomer = b.customer_id === user.id
  const isProvider = b.provider_id === user.id
  const fundsReleased = (b as any).funds_released ?? false
  const fundsReleasedAt = (b as any).funds_released_at ?? null
  const providerId = (b as any).single_mother_profile_id ?? null

  const { data: existingDispute } = await supabaseAdmin
    .from('disputes')
    .select('id')
    .eq('booking_id', id)
    .single()

  const { data: providerProfile } = await supabaseAdmin
    .from('single_mother_profiles')
    .select('id')
    .eq('user_id', b.provider_id)
    .single()

  const dateLocale = bd.dateLocale as string

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href={isCustomer ? '/dashboard/customer' : '/dashboard/provider'} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-[#6366F1]" fill="currentColor" />
            <span className="font-bold text-[#6366F1]">SenioCare</span>
          </Link>
          <span className="text-gray-400 text-sm ml-auto font-mono">{b.booking_code}</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {/* Status */}
        <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${status.color}`}>
          <StatusIcon className="w-6 h-6 flex-shrink-0" />
          <div>
            <div className="font-bold text-lg">{status.label}</div>
            <div className="text-sm opacity-75">Booking #{b.booking_code}</div>
          </div>
        </div>

        {/* Provider / Customer info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {isCustomer ? bd.yourTeman : bd.customer}
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#6366F1] text-white flex items-center justify-center font-bold text-lg">
              {isCustomer ? provider.full_name.charAt(0) : customer.full_name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{isCustomer ? provider.full_name : customer.full_name}</div>
              {isCustomer && provider.single_mother_profiles?.[0] && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  {provider.single_mother_profiles[0].location_city}, {provider.single_mother_profiles[0].location_state}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{bd.infoTitle}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-[#6366F1] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">{bd.dateLabel}</div>
                <div className="font-medium text-gray-900">{new Date(b.scheduled_date).toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-[#6366F1] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">{bd.timeLabel}</div>
                <div className="font-medium text-gray-900">{b.start_time}{b.duration_hours ? ` · ${b.duration_hours} ${bd.jam}` : ''}</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-[#6366F1] mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500">{bd.serviceType}</div>
              <div className="font-medium text-gray-900">{SERVICE_LABELS[b.service_type] ?? b.service_type}</div>
            </div>
          </div>

          {b.location_address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#6366F1] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">{bd.location}</div>
                <div className="font-medium text-gray-900">{b.location_address}</div>
              </div>
            </div>
          )}

          {b.requirements && (
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-1">{bd.requirements}</div>
              <div className="text-sm text-gray-700">{b.requirements}</div>
            </div>
          )}
        </div>

        {/* Payment summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{bd.paymentSummary}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{bd.providerFee}</span>
              <span>RM{parseFloat(String(b.provider_price)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{bd.platformFee}</span>
              <span>RM{parseFloat(String(b.platform_fee)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>{bd.total}</span>
              <span className="text-[#6366F1]">RM{parseFloat(String(b.total_amount)).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${b.payment_status === 'paid' ? 'bg-[#E0E7FF] text-[#3730A3]' : 'bg-yellow-100 text-yellow-700'}`}>
              {b.payment_status === 'paid' ? bd.paid : bd.unpaid}
            </span>
            {b.payment_status === 'paid' && b.status === 'completed' && (
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${fundsReleased ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {fundsReleased ? bd.fundsReleased : bd.fundsEscrow}
              </span>
            )}
          </div>
        </div>

        {/* Pay Now — shown to customer when booking confirmed/in_progress and not yet paid */}
        {isCustomer && b.payment_status === 'pending' && ['confirmed', 'in_progress'].includes(b.status) && (
          <PayButton bookingId={b.id} totalAmount={parseFloat(String(b.total_amount))} />
        )}

        {/* Paid badge */}
        {isCustomer && b.payment_status === 'paid' && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-sm text-green-700 font-medium">
            <span>✅</span> {bd.paymentReceived}
          </div>
        )}

        {/* Actions */}
        {b.status !== 'cancelled' && (
          <BookingDetailActions
            bookingId={b.id}
            status={b.status}
            isProvider={isProvider}
            hasReview={!!existingReview}
            fundsReleased={fundsReleased}
            paymentStatus={b.payment_status}
            fundsReleasedAt={fundsReleasedAt}
            hasDispute={!!existingDispute}
          />
        )}

        {/* Receipt + Repeat booking */}
        {isCustomer && (b.status === 'completed' || b.payment_status === 'paid') && (
          <div className="flex gap-3 flex-wrap">
            <a href={`/booking/${b.id}/receipt`} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:border-[#6366F1] hover:text-[#6366F1] transition-colors">
              🧾 {bd.downloadReceipt}
            </a>
            {providerProfile && (
              <a href={`/book/${providerProfile.id}`}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:border-[#6366F1] hover:text-[#6366F1] transition-colors">
                🔁 {bd.rebookg}
              </a>
            )}
          </div>
        )}

        {/* Contact & Chat */}
        {(b.status === 'confirmed' || b.status === 'in_progress') && (() => {
          const contactPhone = isCustomer ? provider.phone : customer.phone
          const contactName = isCustomer ? provider.full_name : customer.full_name
          const waPhone = formatWAPhone(contactPhone)
          const waMsg = encodeURIComponent(
            `Hai ${contactName.split(' ')[0]}! Saya menghubungi berkenaan booking SenioCare #${b.booking_code} pada ${new Date(b.scheduled_date).toLocaleDateString(dateLocale)}. 😊`
          )
          return (
            <div className="bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-[#6366F1] mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" /> {isCustomer ? bd.contactTeman : bd.contactCustomer}
              </h2>
              <p className="text-sm text-gray-600 mb-3">{bd.contactDesc}</p>
              <div className="flex flex-wrap gap-2">
                <a href={`tel:${contactPhone}`}
                  className="inline-flex items-center gap-2 bg-[#6366F1] text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-[#4F46E5] transition-colors">
                  <Phone className="w-4 h-4" />
                  {contactPhone}
                </a>
                <a href={`https://wa.me/${waPhone}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-[#1DA851] transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
                <Link href={`/booking/${b.id}/chat`}
                  className="inline-flex items-center gap-2 border border-[#6366F1] text-[#6366F1] px-4 py-2 rounded-xl font-medium text-sm hover:bg-[#6366F1]/5 transition-colors">
                  💬 {bd.inAppMsg}
                </Link>
              </div>
            </div>
          )
        })()}

        {/* Chat link for pending/completed too */}
        {(b.status === 'pending' || b.status === 'completed') && (
          <div className="text-center">
            <Link href={`/booking/${b.id}/chat`}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#6366F1] transition-colors">
              💬 {bd.viewChat}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
