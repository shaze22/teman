import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { notifyNewBooking } from '@/lib/notifications'
import { sendBookingNewProvider } from '@/lib/email'

const schema = z.object({
  providerId: z.string(),
  serviceType: z.enum(['job', 'food', 'learning', 'business', 'ibadah', 'repair', 'riadah', 'locum', 'kombo', 'medical_care']),
  scheduledDate: z.string(),
  startTime: z.string(),
  durationHours: z.number().int().min(1),
  locationAddress: z.string().optional(),
  requirements: z.string().optional(),
  recipientName: z.string().optional(),
  providerPrice: z.number(),
  platformFee: z.number(),
  totalAmount: z.number(),
  bookingCode: z.string(),
  paymentMethod: z.enum(['stripe', 'cash']).default('stripe'),
  promoCode: z.string().optional(),
  discountAmount: z.number().default(0),
  creditUsed: z.number().default(0),
  isDuo: z.boolean().default(false),
  duoPartnerId: z.string().optional(),
  duoPartnerPrice: z.number().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 })

  const data = parsed.data

  const { data: providerProfile, error: ppError } = await supabaseAdmin
    .from('single_mother_profiles')
    .select('user_id')
    .eq('id', data.providerId)
    .single()

  if (ppError || !providerProfile) {
    return NextResponse.json({ message: 'Teman tidak dijumpai' }, { status: 404 })
  }

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .insert({
      id: crypto.randomUUID(),
      booking_code: data.bookingCode,
      customer_id: user.id,
      provider_id: providerProfile.user_id,
      service_type: data.serviceType,
      scheduled_date: data.scheduledDate,
      start_time: data.startTime,
      duration_hours: data.durationHours,
      location_address: data.locationAddress ?? null,
      requirements: data.requirements ?? null,
      recipient_name: data.recipientName ?? null,
      booked_by_care_center: !!(data.recipientName),
      provider_price: data.providerPrice,
      platform_fee: data.platformFee,
      total_amount: data.totalAmount,
      payment_method: data.paymentMethod,
      promo_code: data.promoCode ?? null,
      discount_amount: data.discountAmount,
      is_duo: data.isDuo,
      duo_partner_id: data.duoPartnerId ?? null,
      duo_partner_price: data.duoPartnerPrice ?? null,
      updated_at: new Date().toISOString(),
    })
    .select('id, booking_code')
    .single()

  if (bookingError || !booking) {
    console.error('[bookings POST]', bookingError)
    return NextResponse.json({ message: 'Gagal buat booking' }, { status: 500 })
  }

  // Deduct credit balance if used
  if (data.creditUsed > 0) {
    const { data: userRow } = await supabaseAdmin.from('users').select('credit_balance').eq('id', user.id).single()
    const current = parseFloat(String(userRow?.credit_balance ?? 0))
    const newBalance = Math.max(0, current - data.creditUsed)
    await supabaseAdmin.from('users').update({ credit_balance: newBalance }).eq('id', user.id)
  }

  // Increment promo uses_count
  if (data.promoCode) {
    const { data: promo } = await supabaseAdmin.from('promo_codes').select('uses_count').eq('code', data.promoCode).single()
    if (promo) await supabaseAdmin.from('promo_codes').update({ uses_count: (promo.uses_count ?? 0) + 1 }).eq('code', data.promoCode)
  }

  // Notify duo partner if this is a duo booking
  if (data.isDuo && data.duoPartnerId) {
    await supabaseAdmin.from('notifications').insert({
      user_id: data.duoPartnerId,
      type: 'duo_booking',
      title: 'Booking Duo Baru!',
      body: `Pasangan duo anda telah mendapat booking baru pada ${data.scheduledDate}. Sila semak dashboard anda.`,
      data: { bookingId: booking.id, bookingCode: booking.booking_code },
    })
  }

  // Notify provider of new booking (in-app + email)
  const [customerUser, providerAuth] = await Promise.all([
    supabaseAdmin.from('users').select('full_name').eq('id', user.id).single(),
    supabaseAdmin.auth.admin.getUserById(providerProfile.user_id),
  ])
  const customerName = customerUser.data?.full_name ?? ''
  notifyNewBooking({
    bookingId: booking.id,
    bookingCode: booking.booking_code,
    providerId: providerProfile.user_id,
    customerName,
    scheduledDate: data.scheduledDate,
  }).catch(() => {})
  const providerEmail = providerAuth.data?.user?.email ?? ''
  if (providerEmail) {
    sendBookingNewProvider({
      to: providerEmail,
      providerName: '',
      customerName,
      bookingCode: booking.booking_code,
      bookingId: booking.id,
      scheduledDate: data.scheduledDate,
      serviceType: data.serviceType,
      totalAmount: data.totalAmount,
    }).catch(() => {})
  }

  return NextResponse.json({ bookingCode: booking.booking_code, id: booking.id })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      customer:users!bookings_customer_id_fkey(full_name, avatar_url),
      provider:users!bookings_provider_id_fkey(full_name, avatar_url, single_mother_profiles(location_city))
    `)
    .or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[bookings GET]', error)
    return NextResponse.json([], { status: 200 })
  }

  return NextResponse.json(bookings ?? [])
}
