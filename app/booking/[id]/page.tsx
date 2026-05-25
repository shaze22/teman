import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-auth'
import { Heart, ArrowLeft, Calendar, Clock, MapPin, User, Phone, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import BookingDetailActions from './_booking-detail-actions'
import PayButton from './_pay-button'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending:     { label: 'Menunggu Pengesahan', color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: AlertCircle },
  confirmed:   { label: 'Disahkan',            color: 'text-blue-700 bg-blue-50 border-blue-200',       icon: CheckCircle },
  in_progress: { label: 'Sedang Berjalan',     color: 'text-[#BE123C] bg-[#FFF1F2] border-orange-200', icon: Clock },
  completed:   { label: 'Selesai',             color: 'text-[#3730A3] bg-[#EEF2FF] border-[#C7D2FE]',    icon: CheckCircle },
  cancelled:   { label: 'Dibatalkan',          color: 'text-red-700 bg-red-50 border-red-200',          icon: XCircle },
}

const SERVICE_LABELS: Record<string, string> = {
  job: 'Teman Kerja', food: 'Teman Makan', learning: 'Teman Belajar',
  business: 'Teman Bisnes', ibadah: 'Teman Ibadah', repair: 'Teman Repair',
  riadah: 'Teman Riadah', kombo: 'Teman Kombo',
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href={isCustomer ? '/dashboard/customer' : '/dashboard/provider'} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-[#6366F1]" fill="currentColor" />
            <span className="font-bold text-[#6366F1]">Teman</span>
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
            {isCustomer ? 'Teman Anda' : 'Pelanggan'}
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
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Maklumat Booking</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-[#6366F1] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">Tarikh</div>
                <div className="font-medium text-gray-900">{new Date(b.scheduled_date).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-[#6366F1] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">Masa</div>
                <div className="font-medium text-gray-900">{b.start_time}{b.duration_hours ? ` · ${b.duration_hours} jam` : ''}</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-[#6366F1] mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500">Jenis Perkhidmatan</div>
              <div className="font-medium text-gray-900">{SERVICE_LABELS[b.service_type] ?? b.service_type}</div>
            </div>
          </div>

          {b.location_address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#6366F1] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">Lokasi</div>
                <div className="font-medium text-gray-900">{b.location_address}</div>
              </div>
            </div>
          )}

          {b.requirements && (
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-1">Keperluan Khas</div>
              <div className="text-sm text-gray-700">{b.requirements}</div>
            </div>
          )}
        </div>

        {/* Payment summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ringkasan Bayaran</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Yuran Teman</span>
              <span>RM{parseFloat(String(b.provider_price)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Yuran Platform</span>
              <span>RM{parseFloat(String(b.platform_fee)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Jumlah</span>
              <span className="text-[#6366F1]">RM{parseFloat(String(b.total_amount)).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${b.payment_status === 'paid' ? 'bg-[#E0E7FF] text-[#3730A3]' : 'bg-yellow-100 text-yellow-700'}`}>
              {b.payment_status === 'paid' ? 'Dibayar' : 'Belum Dibayar'}
            </span>
            {b.payment_status === 'paid' && b.status === 'completed' && (
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${fundsReleased ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {fundsReleased ? '✓ Dana Dilepaskan' : '⏳ Dana Dalam Escrow'}
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
            <span>✅</span> Pembayaran telah diterima
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
          />
        )}

        {/* Contact & Chat */}
        {(b.status === 'confirmed' || b.status === 'in_progress') && (
          <div className="bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-[#6366F1] mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Hubungi {isCustomer ? 'Teman' : 'Pelanggan'}
            </h2>
            <p className="text-sm text-gray-600 mb-3">Booking telah disahkan. Anda boleh menghubungi terus atau hantar mesej.</p>
            <div className="flex items-center gap-3 flex-wrap">
              <a href={`tel:${isCustomer ? provider.phone : customer.phone}`}
                className="inline-flex items-center gap-2 bg-[#6366F1] text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-[#4F46E5] transition-colors">
                <Phone className="w-4 h-4" />
                {isCustomer ? provider.phone : customer.phone}
              </a>
              <Link href={`/booking/${b.id}/chat`}
                className="inline-flex items-center gap-2 border border-[#6366F1] text-[#6366F1] px-4 py-2 rounded-xl font-medium text-sm hover:bg-[#6366F1]/5 transition-colors">
                💬 Hantar Mesej
              </Link>
            </div>
          </div>
        )}

        {/* Chat link for pending/completed too */}
        {(b.status === 'pending' || b.status === 'completed') && (
          <div className="text-center">
            <Link href={`/booking/${b.id}/chat`}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#6366F1] transition-colors">
              💬 Lihat perbualan
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
