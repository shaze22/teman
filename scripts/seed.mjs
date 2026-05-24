import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vhervzbbptbqhmebfspq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZXJ2emJicHRicWhtZWJmc3BxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ5MDcxNCwiZXhwIjoyMDk1MDY2NzE0fQ.bMqkaaEbrU65nIHAgZZ9BGmSclV7fGD26oTYmISgn98',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const now = new Date().toISOString()
const uid = () => crypto.randomUUID()

const providers = [
  {
    email: 'siti.aminah@teman.my', name: 'Siti Aminah binti Kassim',
    phone: '0112345001', state: 'Kuala Lumpur', city: 'Chow Kit',
    bio: 'Ibu tunggal 3 anak berpengalaman jaga warga emas. Saya sabar, penyayang dan boleh masak pelbagai masakan Melayu.',
    skills: ['cooking', 'elderly_care'], price: 25, transport: 'motorcycle',
    languages: ['bm', 'en'], children: 3, rating: 4.8, reviews: 24, bookings: 31,
  },
  {
    email: 'nur.fadhilah@teman.my', name: 'Nur Fadhilah Mohd Nor',
    phone: '0112345002', state: 'Selangor', city: 'Shah Alam',
    bio: 'Suka membantu orang tua dan ada pengalaman 2 tahun jaga ibu mertua. Rajin dan boleh dipercayai.',
    skills: ['cooking', 'cleaning'], price: 20, transport: 'car',
    languages: ['bm'], children: 2, rating: 4.6, reviews: 18, bookings: 22,
  },
  {
    email: 'rohani.ismail@teman.my', name: 'Rohani Ismail',
    phone: '0112345003', state: 'Johor', city: 'Johor Bahru',
    bio: 'Berkelulusan jururawat pembantu dan ada sijil urut tradisional. Boleh jaga pesakit kronik dan orang tua.',
    skills: ['massage', 'elderly_care'], price: 35, transport: 'car',
    languages: ['bm', 'en'], children: 1, rating: 4.9, reviews: 42, bookings: 58,
    verified: true,
  },
  {
    email: 'zarina.mahmud@teman.my', name: 'Zarina Mahmud',
    phone: '0112345004', state: 'Pulau Pinang', city: 'Georgetown',
    bio: 'Guru pencen yang ingin terus memberi manfaat. Boleh ajar mengaji, bacaan doa dan teman berbual.',
    skills: ['teaching', 'companionship'], price: 22, transport: 'motorcycle',
    languages: ['bm', 'en', 'mandarin'], children: 4, rating: 4.7, reviews: 33, bookings: 44,
    verified: true,
  },
  {
    email: 'halimah.yusof@teman.my', name: 'Halimah Yusof',
    phone: '0112345005', state: 'Melaka', city: 'Ayer Keroh',
    bio: 'Pakar masak masakan kampung. Ada kemahiran jahit dan boleh teman warga emas ke pasar atau klinik.',
    skills: ['cooking', 'sewing', 'shopping'], price: 18, transport: 'motorcycle',
    languages: ['bm'], children: 5, rating: 4.5, reviews: 12, bookings: 15,
  },
  {
    email: 'syazwani.ali@teman.my', name: 'Nor Syazwani Ali',
    phone: '0112345006', state: 'Perak', city: 'Ipoh',
    bio: 'Muda, cergas dan suka berkhidmat. Boleh teman ke hospital, pasar raya dan jadi rakan berbual.',
    skills: ['shopping', 'companionship'], price: 22, transport: 'car',
    languages: ['bm', 'en'], children: 1, rating: 4.4, reviews: 8, bookings: 10,
  },
]

const customers = [
  {
    email: 'ahmad.razif@gmail.com', name: 'Ahmad Razif Kamarudin',
    phone: '0123456701', role: 'waris', state: 'Kuala Lumpur', city: 'Ampang',
    senior: 'Puan Ramlah Kamarudin', seniorAge: 74,
    ecName: 'Siti Hawa', ecPhone: '0123456702', ecRel: 'Kakak',
    needs: ['job', 'food'], mobility: 'walking_stick',
  },
  {
    email: 'lily.tan@gmail.com', name: 'Lily Tan Wei Ling',
    phone: '0123456703', role: 'waris', state: 'Selangor', city: 'Subang Jaya',
    senior: 'Tan Ah Kow', seniorAge: 81,
    ecName: 'David Tan', ecPhone: '0123456704', ecRel: 'Abang',
    needs: ['food', 'companionship'], mobility: 'wheelchair',
  },
  {
    email: 'hajah.mariam@gmail.com', name: 'Hajah Mariam Othman',
    phone: '0123456705', role: 'customer', state: 'Johor', city: 'Muar',
    senior: null, seniorAge: null,
    ecName: 'Kamariah Othman', ecPhone: '0123456706', ecRel: 'Anak',
    needs: ['job', 'food'], mobility: 'independent',
  },
  {
    email: 'ramlan.darus@gmail.com', name: 'Encik Ramlan Darus',
    phone: '0123456707', role: 'customer', state: 'Pulau Pinang', city: 'Bayan Lepas',
    senior: null, seniorAge: null,
    ecName: 'Faridah Ramlan', ecPhone: '0123456708', ecRel: 'Anak',
    needs: ['food', 'companionship'], mobility: 'walking_stick',
  },
]

async function createAuthUser(email, password = 'Teman1234!') {
  const res = await fetch('https://vhervzbbptbqhmebfspq.supabase.co/auth/v1/admin/users', {
    method: 'POST',
    headers: {
      apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZXJ2emJicHRicWhtZWJmc3BxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ5MDcxNCwiZXhwIjoyMDk1MDY2NzE0fQ.bMqkaaEbrU65nIHAgZZ9BGmSclV7fGD26oTYmISgn98',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZXJ2emJicHRicWhtZWJmc3BxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ5MDcxNCwiZXhwIjoyMDk1MDY2NzE0fQ.bMqkaaEbrU65nIHAgZZ9BGmSclV7fGD26oTYmISgn98',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  const data = await res.json()
  return data.id
}

async function seedProviders() {
  for (const p of providers) {
    console.log(`Creating provider: ${p.name}...`)
    const authId = await createAuthUser(p.email)

    await supabase.from('users').insert({
      id: authId, email: p.email, phone: p.phone,
      full_name: p.name, role: 'single_mother', status: 'active', updated_at: now,
    })

    const { data: profile } = await supabase.from('single_mother_profiles').insert({
      id: uid(), user_id: authId,
      location_state: p.state, location_city: p.city,
      bio: p.bio, languages: p.languages,
      has_transport: p.transport,
      children_count: p.children, can_bring_children: false,
      rating_avg: p.rating, total_reviews: p.reviews, total_bookings: p.bookings,
      verified_by_ngo: p.verified ?? false,
      is_active: true, updated_at: now,
    }).select('id').single()

    await supabase.from('provider_skills').insert(
      p.skills.map(s => ({ id: uid(), profile_id: profile.id, skill_name: s, skill_category: s }))
    )

    await supabase.from('provider_pricing').insert({
      id: uid(), profile_id: profile.id,
      service_type: 'job', pricing_type: 'per_hour',
      price: p.price, updated_at: now,
    })

    console.log(`  ✓ ${p.name} created`)
  }
}

async function seedCustomers() {
  for (const c of customers) {
    console.log(`Creating customer: ${c.name}...`)
    const authId = await createAuthUser(c.email)

    await supabase.from('users').insert({
      id: authId, email: c.email, phone: c.phone,
      full_name: c.name, role: c.role, status: 'active', updated_at: now,
    })

    const { data: profile } = await supabase.from('customer_profiles').insert({
      id: uid(), user_id: authId,
      is_for_self: c.role === 'customer',
      senior_full_name: c.senior,
      senior_age: c.seniorAge,
      location_state: c.state, location_city: c.city,
      mobility_status: c.mobility,
      needs: c.needs, updated_at: now,
    }).select('id').single()

    await supabase.from('emergency_contacts').insert({
      id: uid(), customer_profile_id: profile.id,
      name: c.ecName, relationship: c.ecRel,
      phone: c.ecPhone, is_primary: true,
    })

    console.log(`  ✓ ${c.name} created`)
  }
}

console.log('=== Seeding Teman Database ===\n')
await seedProviders()
await seedCustomers()
console.log('\n=== Done! All accounts use password: Teman1234! ===')
