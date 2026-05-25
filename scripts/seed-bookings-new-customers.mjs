import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vhervzbbptbqhmebfspq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZXJ2emJicHRicWhtZWJmc3BxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ5MDcxNCwiZXhwIjoyMDk1MDY2NzE0fQ.bMqkaaEbrU65nIHAgZZ9BGmSclV7fGD26oTYmISgn98',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function bookingCode() { return 'TMN' + Math.random().toString(36).slice(2, 8).toUpperCase() }
function pastDate(daysAgo) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}
function futureDate(daysAhead) {
  const d = new Date(); d.setDate(d.getDate() + daysAhead)
  return d.toISOString().split('T')[0]
}

const NEW_CUSTOMER_EMAILS = [
  'zahara.abdullah@teman.my',
  'tanpohsim@teman.my',
  'letchumi.subramaniam@teman.my',
  'mariam.ismail@teman.my',
  'liewkimheoh@teman.my',
  'aminah.kassim@teman.my',
  'priya.vello@teman.my',
  'noraini.mohamed@teman.my',
  'chong.weikeat@teman.my',
  'kavitha.krishnan@teman.my',
]

const SERVICE_TYPES = ['job', 'food', 'learning', 'business']
const START_TIMES = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']
const ADDRESSES = [
  'No. 12, Jalan Ampang, Kuala Lumpur',
  'Blok B, Taman Sri Muda, Shah Alam',
  'No. 5, Lorong Mawar 3, Petaling Jaya',
  'Unit 3A, Residensi Lembah Subang, Subang Jaya',
  'No. 88, Jalan Duta, Kuala Lumpur',
  'Taman Melawati, Ampang',
  'No. 22, Jalan Wangsa 9, Wangsa Maju',
  'Batu 5, Jalan Ipoh, Kuala Lumpur',
  'No. 34, Jalan Bukit Bintang, Kuala Lumpur',
  'Kota Damansara, Petaling Jaya',
  'Bandar Baru Bangi, Selangor',
  'No. 7, Jalan Klang Lama, Kuala Lumpur',
]
const REQUIREMENTS = [
  'Tolong bawa bersama makanan ringan untuk warga emas.',
  'Perlu teman berbual dalam Bahasa Melayu sahaja.',
  'Nenek saya suka berjalan perlahan, harap bersabar.',
  'Sila datang 10 minit awal.',
  null, null, null,
]
const REVIEW_COMMENTS = [
  'Sangat baik dan mesra! Ibu saya sangat suka.',
  'Tepat masa dan profesional. Terima kasih!',
  'Perkhidmatan yang sangat memuaskan. Akan tempah lagi.',
  'Sangat sabar dengan ibu saya yang selalu bertanya soalan. Bagus!',
  'Teman yang amanah dan boleh dipercayai.',
  'Nenek saya kata dia rasa selesa. Terima kasih banyak-banyak.',
  'Excellent service! Will definitely book again.',
  'Baik hati dan penuh kesabaran. 5 bintang!',
  null,
]

// Fetch new customers
const { data: allCustomers } = await supabase
  .from('customer_profiles')
  .select('id, user_id, users!inner(full_name, email)')

const customers = (allCustomers ?? []).filter(c =>
  NEW_CUSTOMER_EMAILS.includes(c.users?.email)
)

// Fetch all active providers with pricing
const { data: providers } = await supabase
  .from('single_mother_profiles')
  .select('id, user_id, users!inner(full_name), provider_pricing(service_type, price)')
  .eq('is_active', true)

console.log(`Found ${customers.length} new customers, ${providers.length} providers`)
if (customers.length === 0) { console.error('No customers found — check emails'); process.exit(1) }

const now = new Date().toISOString()
const allBookings = []
const allReviews = []
const allWalletTx = []
const providerEarnings = {}

// For each new customer, create 3-5 bookings from random providers
for (const customer of customers) {
  const shuffled = [...providers].sort(() => Math.random() - 0.5)
  const numBookings = randInt(3, 5)
  const picks = shuffled.slice(0, numBookings)

  const statusPlan = ['completed_released', 'completed_released', 'completed_pending', 'confirmed']
  while (statusPlan.length < numBookings) {
    statusPlan.push(randItem(['pending', 'cancelled', 'confirmed', 'completed_released']))
  }
  statusPlan.sort(() => Math.random() - 0.5)

  for (let i = 0; i < picks.length; i++) {
    const provider = picks[i]
    const plan = statusPlan[i]
    const serviceType = randItem(SERVICE_TYPES)

    const pricing = provider.provider_pricing ?? []
    const priceEntry = pricing.find(x => x.service_type === serviceType)
    const pricePerHour = priceEntry ? parseFloat(priceEntry.price) : 40

    const duration = randInt(2, 6)
    const providerPrice = pricePerHour * duration
    const platformFee = Math.round(providerPrice * 0.15 * 100) / 100
    const totalAmount = providerPrice + platformFee

    let status, scheduledDate, paymentStatus, fundsReleased, fundsReleasedAt, cancelledReason

    if (plan === 'completed_released') {
      status = 'completed'; scheduledDate = pastDate(randInt(5, 60))
      paymentStatus = 'paid'; fundsReleased = true
      fundsReleasedAt = new Date(new Date(scheduledDate).getTime() + 86400000).toISOString()
    } else if (plan === 'completed_pending') {
      status = 'completed'; scheduledDate = pastDate(randInt(1, 7))
      paymentStatus = 'paid'; fundsReleased = false; fundsReleasedAt = null
    } else if (plan === 'confirmed') {
      status = 'confirmed'; scheduledDate = futureDate(randInt(1, 14))
      paymentStatus = 'pending'; fundsReleased = false; fundsReleasedAt = null
    } else if (plan === 'cancelled') {
      status = 'cancelled'; scheduledDate = pastDate(randInt(1, 30))
      paymentStatus = 'pending'; fundsReleased = false; fundsReleasedAt = null
      cancelledReason = 'Dibatalkan oleh pelanggan'
    } else {
      status = 'pending'; scheduledDate = futureDate(randInt(1, 7))
      paymentStatus = 'pending'; fundsReleased = false; fundsReleasedAt = null
    }

    const createdAt = new Date(scheduledDate)
    createdAt.setDate(createdAt.getDate() - randInt(1, 5))

    const bookingId = crypto.randomUUID()
    const code = bookingCode()

    allBookings.push({
      id: bookingId,
      booking_code: code,
      customer_id: customer.user_id,
      provider_id: provider.user_id,
      service_type: serviceType,
      status,
      scheduled_date: scheduledDate,
      start_time: randItem(START_TIMES),
      duration_hours: duration,
      location_address: randItem(ADDRESSES),
      requirements: randItem(REQUIREMENTS),
      provider_price: providerPrice,
      platform_fee: platformFee,
      total_amount: totalAmount,
      payment_status: paymentStatus,
      funds_released: fundsReleased,
      funds_released_at: fundsReleasedAt,
      cancellation_reason: cancelledReason ?? null,
      created_at: createdAt.toISOString(),
      updated_at: now,
    })

    if (plan === 'completed_released' && Math.random() > 0.2) {
      allReviews.push({
        id: crypto.randomUUID(),
        booking_id: bookingId,
        reviewer_id: customer.user_id,
        reviewee_id: provider.user_id,
        rating: randInt(3, 5),
        comment: randItem(REVIEW_COMMENTS),
        is_public: true,
        created_at: fundsReleasedAt ?? now,
      })
    }

    if (fundsReleased) {
      const net = Math.round(providerPrice * 0.85 * 100) / 100
      providerEarnings[provider.id] = (providerEarnings[provider.id] ?? 0) + net
      allWalletTx.push({
        id: crypto.randomUUID(),
        user_id: provider.user_id,
        type: 'credit',
        amount: net,
        balance_after: 0,
        description: `Bayaran sesi #${code}`,
        reference_id: bookingId,
        created_at: fundsReleasedAt ?? now,
      })
    }
  }
}

// Patch balance_after — running total per provider, sorted by date
const txByProvider = {}
for (const tx of allWalletTx) {
  if (!txByProvider[tx.user_id]) txByProvider[tx.user_id] = []
  txByProvider[tx.user_id].push(tx)
}
for (const txList of Object.values(txByProvider)) {
  txList.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  let running = 0
  for (const tx of txList) {
    running = Math.round((running + tx.amount) * 100) / 100
    tx.balance_after = running
  }
}

console.log(`Creating ${allBookings.length} bookings, ${allReviews.length} reviews, ${allWalletTx.length} wallet txs...`)

// Insert bookings in chunks
for (let i = 0; i < allBookings.length; i += 20) {
  const { error } = await supabase.from('bookings').insert(allBookings.slice(i, i + 20))
  if (error) { console.error('Bookings error:', error.message); process.exit(1) }
}
console.log('✓ Bookings inserted')

// Insert reviews
if (allReviews.length > 0) {
  const { error } = await supabase.from('reviews').insert(allReviews)
  if (error) console.error('Reviews error:', error.message)
  else console.log('✓ Reviews inserted')
}

// Insert wallet transactions
if (allWalletTx.length > 0) {
  for (let i = 0; i < allWalletTx.length; i += 20) {
    const { error } = await supabase.from('wallet_transactions').insert(allWalletTx.slice(i, i + 20))
    if (error) console.error('Wallet tx error:', error.message)
  }
  console.log('✓ Wallet transactions inserted')
}

// Update provider stats — add on top of existing counts
for (const [profileId, newEarnings] of Object.entries(providerEarnings)) {
  const provider = providers.find(p => p.id === profileId)
  if (!provider) continue

  // Fetch current stats
  const { data: current } = await supabase
    .from('single_mother_profiles')
    .select('total_bookings, total_reviews, rating_avg, earnings_total')
    .eq('id', profileId)
    .single()

  const newBookings = allBookings.filter(b => b.provider_id === provider.user_id)
  const newReviews = allReviews.filter(r => r.reviewee_id === provider.user_id)

  const existingBookings = current?.total_bookings ?? 0
  const existingReviews = current?.total_reviews ?? 0
  const existingRatingSum = (current?.rating_avg ?? 0) * existingReviews
  const newRatingSum = newReviews.reduce((s, r) => s + r.rating, 0)
  const totalReviews = existingReviews + newReviews.length
  const newRatingAvg = totalReviews > 0
    ? (existingRatingSum + newRatingSum) / totalReviews
    : 0

  await supabase.from('single_mother_profiles').update({
    total_bookings: existingBookings + newBookings.length,
    total_reviews: totalReviews,
    rating_avg: Math.round(newRatingAvg * 10) / 10,
    earnings_total: Math.round(((current?.earnings_total ?? 0) + newEarnings) * 100) / 100,
    updated_at: now,
  }).eq('id', profileId)
}
console.log('✓ Provider stats updated')

const byStatus = {}
for (const b of allBookings) byStatus[b.status] = (byStatus[b.status] ?? 0) + 1
console.log('\nSummary:')
console.log('Bookings by status:', byStatus)
console.log(`Total: ${allBookings.length} bookings, ${allReviews.length} reviews, ${allWalletTx.length} wallet txs`)
