import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { Heart, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { translations, type Lang } from '@/lib/i18n'

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'bm') as Lang
  const t = translations[lang]
  const pr = t.paymentResult

  const sp = await searchParams
  const bookingId = sp['bookingId'] ?? null
  const sessionId = sp['session_id'] ?? null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify Stripe session status + update DB (fallback if webhook missed)
  let sessionPaid = false
  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      sessionPaid = session.payment_status === 'paid'

      if (sessionPaid && bookingId) {
        // Update booking & payment record (idempotent "" safe to run even if webhook already ran)
        await Promise.all([
          supabaseAdmin
            .from('bookings')
            .update({ payment_status: 'paid', payment_method: 'stripe', updated_at: new Date().toISOString() })
            .eq('id', bookingId)
            .eq('payment_status', 'pending'), // only update if still pending
          supabaseAdmin
            .from('payments')
            .update({ status: 'paid' })
            .eq('transaction_id', session.id)
            .eq('status', 'pending'),
        ])
      }
    } catch {
      // Session retrieval failed "" fall back to DB check
    }
  }

  let booking: {
    id: string
    booking_code: string
    payment_status: string
    total_amount: unknown
    status: string
  } | null = null

  if (bookingId) {
    const { data } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_code, payment_status, total_amount, status')
      .eq('id', bookingId)
      .eq('customer_id', user.id)
      .single()
    booking = data
  }

  const isPaid = sessionPaid || booking?.payment_status === 'paid'
  const total = booking ? parseFloat(String(booking.total_amount)).toFixed(2) : null

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard/customer" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-[#6366F1]" fill="currentColor" />
            <span className="font-bold text-[#6366F1]">SenioCare</span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 text-center">
          {isPaid ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{pr.success}</h1>
              {booking && (
                <p className="text-gray-400 text-sm mb-2">Booking #{booking.booking_code}</p>
              )}
              {total && (
                <p className="text-3xl font-bold text-[#6366F1] mb-4">RM{total}</p>
              )}
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                {pr.successDesc}
              </p>
              <Link
                href={bookingId ? `/booking/${bookingId}` : '/dashboard/customer'}
                className="block w-full bg-[#6366F1] text-white py-3 rounded-xl font-semibold hover:bg-[#4F46E5] transition-colors"
              >
                {pr.viewBooking}
              </Link>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{pr.failed}</h1>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                {pr.failedDesc}
              </p>
              <div className="flex gap-3">
                <Link
                  href="/dashboard/customer"
                  className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  Dashboard
                </Link>
                {bookingId && (
                  <Link
                    href={`/booking/${bookingId}`}
                    className="flex-1 bg-[#6366F1] text-white py-3 rounded-xl font-semibold hover:bg-[#4F46E5] transition-colors text-sm"
                  >
                    {pr.tryAgain}
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
