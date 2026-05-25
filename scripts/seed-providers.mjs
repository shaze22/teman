import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vhervzbbptbqhmebfspq.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZXJ2emJicHRicWhtZWJmc3BxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ5MDcxNCwiZXhwIjoyMDk1MDY2NzE0fQ.bMqkaaEbrU65nIHAgZZ9BGmSclV7fGD26oTYmISgn98'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const PASSWORD = 'Teman1234!'

const providers = [
  {
    email: 'aishah.rahman@teman.my',
    phone: '0123456810',
    fullName: 'Dr. Aishah Binti Abdul Rahman',
    locationCity: 'Kuala Lumpur',
    locationState: 'Wilayah Persekutuan',
    locationPostcode: '50480',
    bio: 'Doktor perubatan dengan 10 tahun pengalaman klinikal. Mahir dalam penjagaan warga emas, pemantauan ubat, dan memberi nasihat kesihatan. Ibu tunggal kepada 2 orang anak, penuh semangat dan penyayang.',
    skills: ['elderly_care', 'companionship'],
    pricePerHour: 65,
    languages: ['Melayu', 'Inggeris'],
    hasTransport: 'car',
    childrenCount: 2,
    canBringChildren: false,
    availabilities: [1, 2, 4, 6], // Isnin, Selasa, Khamis, Sabtu
  },
  {
    email: 'nurulain.zainuddin@teman.my',
    phone: '0167891234',
    fullName: 'Nurul Ain Binti Zainuddin',
    locationCity: 'Shah Alam',
    locationState: 'Selangor',
    locationPostcode: '40150',
    bio: 'Jurulatih kecergasan berlesen yang aktif dan ceria. Suka menemani warga emas bersenam ringan, berjalan pagi, dan menjalani gaya hidup sihat. Percaya bahawa tubuh sihat adalah anugerah terbesar.',
    skills: ['companionship', 'other'],
    pricePerHour: 45,
    languages: ['Melayu', 'Inggeris'],
    hasTransport: 'motorcycle',
    childrenCount: 1,
    canBringChildren: true,
    availabilities: [1, 3, 5, 6], // Isnin, Rabu, Jumaat, Sabtu
  },
  {
    email: 'faridah.yusof@teman.my',
    phone: '0112345679',
    fullName: 'Faridah Binti Yusof',
    locationCity: 'Petaling Jaya',
    locationState: 'Selangor',
    locationPostcode: '47810',
    bio: 'Pakar masakan Melayu tradisional dengan pengalaman 15 tahun. Boleh memasak pelbagai hidangan untuk warga emas, mengajar resipi kegemaran, dan menemani waktu makan dengan suasana keluarga yang mesra.',
    skills: ['cooking', 'companionship'],
    pricePerHour: 40,
    languages: ['Melayu'],
    hasTransport: 'car',
    childrenCount: 3,
    canBringChildren: false,
    availabilities: [1, 2, 3, 4, 5], // Isnin–Jumaat
  },
  {
    email: 'norhayati.kamaruddin@teman.my',
    phone: '0198765432',
    fullName: 'Norhayati Binti Kamaruddin',
    locationCity: 'Kuala Lumpur',
    locationState: 'Wilayah Persekutuan',
    locationPostcode: '50088',
    bio: 'Konsultan perniagaan bertauliah dengan MBA dari UM. Membantu warga emas menguruskan perniagaan kecil, pelaburan, dan urusan kewangan harian. Berpengalaman sebagai penceramah dan fasilitator.',
    skills: ['teaching', 'companionship'],
    pricePerHour: 80,
    languages: ['Melayu', 'Inggeris', 'Mandarin'],
    hasTransport: 'car',
    childrenCount: 2,
    canBringChildren: false,
    availabilities: [2, 3, 4], // Selasa, Rabu, Khamis
  },
  {
    email: 'sitizubaidah.hashim@teman.my',
    phone: '0145678901',
    fullName: 'Siti Zubaidah Binti Hashim',
    locationCity: 'Ampang',
    locationState: 'Selangor',
    locationPostcode: '68000',
    bio: 'Pencinta alam semula jadi yang aktif dan cergas. Suka menemani warga emas berjalan di taman, taman botani, atau lawatan ke tempat menarik. Percaya aktiviti luar rumah sangat baik untuk kesejahteraan mental.',
    skills: ['companionship', 'other'],
    pricePerHour: 50,
    languages: ['Melayu', 'Inggeris'],
    hasTransport: 'motorcycle',
    childrenCount: 1,
    canBringChildren: true,
    availabilities: [6, 0], // Sabtu, Ahad
  },
  {
    email: 'rosnah.ibrahim@teman.my',
    phone: '0134567890',
    fullName: 'Rosnah Binti Ibrahim',
    locationCity: 'Subang Jaya',
    locationState: 'Selangor',
    locationPostcode: '47500',
    bio: 'Ibu yang penyayang dengan jiwa berkebun. Suka meluangkan masa bersama warga emas di taman, mengajar berkebun sayuran dan bunga, serta berbual santai. Sabar, lembut, dan sangat suka kanak-kanak.',
    skills: ['companionship', 'elderly_care'],
    pricePerHour: 35,
    languages: ['Melayu'],
    hasTransport: 'none',
    childrenCount: 2,
    canBringChildren: true,
    availabilities: [1, 3, 5, 6, 0],
  },
  {
    email: 'norazlina.mustafa@teman.my',
    phone: '0156789012',
    fullName: 'Nor Azlina Binti Mustafa',
    locationCity: 'Klang',
    locationState: 'Selangor',
    locationPostcode: '41000',
    bio: 'Paramedik berlesen dengan 8 tahun pengalaman di lapangan. Mahir dalam pertolongan cemas, pemantauan tekanan darah dan gula, serta penjagaan pesakit kronik. Tenang dalam situasi kecemasan.',
    skills: ['elderly_care', 'companionship'],
    pricePerHour: 60,
    languages: ['Melayu', 'Inggeris'],
    hasTransport: 'car',
    childrenCount: 1,
    canBringChildren: false,
    availabilities: [2, 4, 6, 0],
  },
  {
    email: 'zuraidah.othman@teman.my',
    phone: '0178901234',
    fullName: 'Zuraidah Binti Othman',
    locationCity: 'Kuala Lumpur',
    locationState: 'Wilayah Persekutuan',
    locationPostcode: '55100',
    bio: 'Perancang majlis berpengalaman dengan imej profesional. Boleh menemani warga emas ke majlis perkahwinan, acara keluarga, mesyuarat, atau sekadar berjalan-jalan di pusat beli-belah. Ramah dan bijak bergaul.',
    skills: ['companionship', 'other'],
    pricePerHour: 70,
    languages: ['Melayu', 'Inggeris'],
    hasTransport: 'car',
    childrenCount: 1,
    canBringChildren: false,
    availabilities: [5, 6, 0],
  },
  {
    email: 'nabilah.aziz@teman.my',
    phone: '0189012345',
    fullName: 'Nabilah Binti Aziz',
    locationCity: 'Cheras',
    locationState: 'Kuala Lumpur',
    locationPostcode: '56000',
    bio: 'Pelukis dan guru seni yang kreatif dan sabar. Menggunakan seni lukis sebagai terapi untuk warga emas — mewarna, melukis, dan menghasilkan kraftangan. Percaya kreativiti menjaga kesihatan minda.',
    skills: ['teaching', 'companionship'],
    pricePerHour: 45,
    languages: ['Melayu', 'Inggeris'],
    hasTransport: 'motorcycle',
    childrenCount: 2,
    canBringChildren: true,
    availabilities: [1, 3, 5, 6],
  },
  {
    email: 'hafizah.ismail@teman.my',
    phone: '0190123456',
    fullName: 'Hafizah Binti Ismail',
    locationCity: 'Wangsa Maju',
    locationState: 'Kuala Lumpur',
    locationPostcode: '53300',
    bio: 'Graduan Sarjana Pendidikan dari UKM. Sabar mengajar warga emas menggunakan telefon pintar, WhatsApp, aplikasi kerajaan, dan aktiviti intelek lain. Ibu muda yang bersemangat dan dedikasi tinggi.',
    skills: ['teaching', 'elderly_care'],
    pricePerHour: 50,
    languages: ['Melayu', 'Inggeris'],
    hasTransport: 'car',
    childrenCount: 1,
    canBringChildren: true,
    availabilities: [1, 2, 3, 4, 5],
  },
]

const now = new Date().toISOString()

for (const p of providers) {
  console.log(`\nCreating provider: ${p.fullName}`)

  // 1. Create auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: p.email,
    password: PASSWORD,
    email_confirm: true,
  })
  if (authErr) {
    console.error(`  Auth error: ${authErr.message}`)
    continue
  }
  const userId = authData.user.id
  console.log(`  Auth user: ${userId}`)

  // 2. Create users row
  const { error: userErr } = await supabase.from('users').insert({
    id: userId,
    email: p.email,
    phone: p.phone,
    full_name: p.fullName,
    role: 'single_mother',
    status: 'active',
    created_at: now,
    updated_at: now,
  })
  if (userErr) { console.error(`  Users row error: ${userErr.message}`); continue }

  // 3. Create profile
  const profileId = crypto.randomUUID()
  const { error: profileErr } = await supabase.from('single_mother_profiles').insert({
    id: profileId,
    user_id: userId,
    ngo_id: null,
    referral_code: null,
    location_state: p.locationState,
    location_city: p.locationCity,
    location_postcode: p.locationPostcode,
    languages: p.languages,
    has_transport: p.hasTransport,
    bio: p.bio,
    children_count: p.childrenCount,
    can_bring_children: p.canBringChildren,
    verified_by_ngo: false,
    verified_by_admin: false,
    is_active: true,
    rating_avg: 0,
    total_reviews: 0,
    total_bookings: 0,
    earnings_total: 0,
    created_at: now,
    updated_at: now,
  })
  if (profileErr) { console.error(`  Profile error: ${profileErr.message}`); continue }

  // 4. Create skills
  const { error: skillsErr } = await supabase.from('provider_skills').insert(
    p.skills.map(s => ({
      id: crypto.randomUUID(),
      profile_id: profileId,
      skill_name: s,
      skill_category: s,
    }))
  )
  if (skillsErr) console.error(`  Skills error: ${skillsErr.message}`)

  // 5. Create pricing for all 4 service types
  const { error: pricingErr } = await supabase.from('provider_pricing').insert(
    ['job', 'food', 'learning', 'business'].map(type => ({
      id: crypto.randomUUID(),
      profile_id: profileId,
      service_type: type,
      pricing_type: 'per_hour',
      price: p.pricePerHour,
      is_active: true,
      updated_at: now,
    }))
  )
  if (pricingErr) console.error(`  Pricing error: ${pricingErr.message}`)

  // 6. Create availabilities
  const { error: availErr } = await supabase.from('provider_availabilities').insert(
    p.availabilities.map(day => ({
      id: crypto.randomUUID(),
      profile_id: profileId,
      day_of_week: day,
      start_time: '09:00',
      end_time: '18:00',
      is_available: true,
    }))
  )
  if (availErr) console.error(`  Availability error: ${availErr.message}`)

  console.log(`  ✓ Done — profile ID: ${profileId}`)
  console.log(`  Login: ${p.email} / ${PASSWORD}`)
}

console.log('\n✓ All 10 providers seeded.')
console.log('\nCredentials summary:')
for (const p of providers) {
  console.log(`  ${p.fullName.padEnd(35)} ${p.email} / ${PASSWORD}`)
}
