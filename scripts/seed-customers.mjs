import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vhervzbbptbqhmebfspq.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZXJ2emJicHRicWhtZWJmc3BxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ5MDcxNCwiZXhwIjoyMDk1MDY2NzE0fQ.bMqkaaEbrU65nIHAgZZ9BGmSclV7fGD26oTYmISgn98'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const PASSWORD = 'Teman1234!'

// isForSelf: true  → warga emas daftar sendiri (role: customer)
// isForSelf: false → waris daftar bagi warga emas (role: waris, seniorFullName/Age required)
const customers = [
  {
    email: 'zahara.abdullah@teman.my',
    phone: '0123456901',
    fullName: 'Zahara binti Abdullah',
    isForSelf: true,
    locationCity: 'Kuala Lumpur',
    locationState: 'Wilayah Persekutuan',
    locationPostcode: '50460',
    mobilityStatus: 'independent',
    needs: ['companionship', 'elderly_care'],
    emergencyName: 'Azman bin Abdullah',
    emergencyRelation: 'Anak lelaki',
    emergencyPhone: '0112233445',
  },
  {
    email: 'tanpohsim@teman.my',
    phone: '0167890001',
    fullName: 'Tan Poh Sim',
    isForSelf: true,
    locationCity: 'Petaling Jaya',
    locationState: 'Selangor',
    locationPostcode: '47810',
    mobilityStatus: 'walking_stick',
    needs: ['companionship', 'cooking'],
    emergencyName: 'Tan Wei Jian',
    emergencyRelation: 'Anak lelaki',
    emergencyPhone: '0178901122',
  },
  {
    email: 'letchumi.subramaniam@teman.my',
    phone: '0112345001',
    fullName: 'Letchumi a/p Subramaniam',
    isForSelf: true,
    locationCity: 'Klang',
    locationState: 'Selangor',
    locationPostcode: '41000',
    mobilityStatus: 'independent',
    needs: ['companionship', 'elderly_care'],
    emergencyName: 'Rajan s/o Subramaniam',
    emergencyRelation: 'Anak lelaki',
    emergencyPhone: '0156789001',
  },
  {
    email: 'mariam.ismail@teman.my',
    phone: '0198760001',
    fullName: 'Mariam binti Ismail',
    isForSelf: true,
    locationCity: 'Shah Alam',
    locationState: 'Selangor',
    locationPostcode: '40150',
    mobilityStatus: 'independent',
    needs: ['learning', 'companionship'],
    emergencyName: 'Hafizi bin Razak',
    emergencyRelation: 'Suami',
    emergencyPhone: '0134560001',
  },
  {
    email: 'liewkimheoh@teman.my',
    phone: '0145670001',
    fullName: 'Liew Kim Heoh',
    isForSelf: true,
    locationCity: 'Cheras',
    locationState: 'Kuala Lumpur',
    locationPostcode: '56000',
    mobilityStatus: 'independent',
    needs: ['companionship', 'learning'],
    emergencyName: 'Liew Mei Ling',
    emergencyRelation: 'Anak perempuan',
    emergencyPhone: '0167890002',
  },
  {
    email: 'aminah.kassim@teman.my',
    phone: '0134560002',
    fullName: 'Aminah binti Kassim',
    isForSelf: true,
    locationCity: 'Ampang',
    locationState: 'Selangor',
    locationPostcode: '68000',
    mobilityStatus: 'independent',
    needs: ['companionship'],
    emergencyName: 'Razif bin Hashim',
    emergencyRelation: 'Anak lelaki',
    emergencyPhone: '0189010001',
  },
  // Registered by waris (daughter) — Meena terlalu tua untuk daftar sendiri
  {
    email: 'priya.vello@teman.my',
    phone: '0156780001',
    fullName: 'Priya a/p Vello',          // waris
    isForSelf: false,
    seniorFullName: 'Meena a/p Vello',
    seniorAge: '88',
    seniorPhone: '0134560003',
    locationCity: 'Subang Jaya',
    locationState: 'Selangor',
    locationPostcode: '47500',
    mobilityStatus: 'walking_stick',
    needs: ['elderly_care', 'cooking'],
    emergencyName: 'Priya a/p Vello',
    emergencyRelation: 'Anak perempuan',
    emergencyPhone: '0156780001',
  },
  {
    email: 'noraini.mohamed@teman.my',
    phone: '0178900001',
    fullName: 'Noraini binti Mohamed',
    isForSelf: true,
    locationCity: 'Wangsa Maju',
    locationState: 'Kuala Lumpur',
    locationPostcode: '53300',
    mobilityStatus: 'independent',
    needs: ['companionship'],
    emergencyName: 'Hairul bin Nordin',
    emergencyRelation: 'Anak lelaki',
    emergencyPhone: '0112340001',
  },
  // Registered by waris (son) — Chong tidak pandai guna teknologi
  {
    email: 'chong.weikeat@teman.my',
    phone: '0123450001',
    fullName: 'Chong Wei Keat',            // waris
    isForSelf: false,
    seniorFullName: 'Chong Siew Lan',
    seniorAge: '78',
    seniorPhone: '0145670002',
    locationCity: 'George Town',
    locationState: 'Pulau Pinang',
    locationPostcode: '10050',
    mobilityStatus: 'wheelchair',
    needs: ['elderly_care', 'companionship'],
    emergencyName: 'Chong Wei Keat',
    emergencyRelation: 'Anak lelaki',
    emergencyPhone: '0123450001',
  },
  // Registered by waris (daughter)
  {
    email: 'kavitha.krishnan@teman.my',
    phone: '0167890003',
    fullName: 'Kavitha a/p Krishnan',      // waris
    isForSelf: false,
    seniorFullName: 'Rajamani a/p Krishnan',
    seniorAge: '80',
    seniorPhone: '0156780002',
    locationCity: 'Johor Bahru',
    locationState: 'Johor',
    locationPostcode: '80000',
    mobilityStatus: 'walking_stick',
    needs: ['elderly_care', 'companionship'],
    emergencyName: 'Kavitha a/p Krishnan',
    emergencyRelation: 'Anak perempuan',
    emergencyPhone: '0167890003',
  },
]

const now = new Date().toISOString()

for (const c of customers) {
  const displayName = c.isForSelf ? c.fullName : `${c.seniorFullName} (waris: ${c.fullName})`
  console.log(`\nCreating customer: ${displayName}`)

  // 1. Auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: c.email,
    password: PASSWORD,
    email_confirm: true,
  })
  if (authErr) { console.error(`  Auth error: ${authErr.message}`); continue }
  const userId = authData.user.id
  console.log(`  Auth user: ${userId}`)

  // 2. Users row
  const { error: userErr } = await supabase.from('users').insert({
    id: userId,
    email: c.email,
    phone: c.phone,
    full_name: c.fullName,
    role: c.isForSelf ? 'customer' : 'waris',
    status: 'active',
    created_at: now,
    updated_at: now,
  })
  if (userErr) { console.error(`  Users row error: ${userErr.message}`); continue }

  // 3. Customer profile
  const profileId = crypto.randomUUID()
  const { error: profileErr } = await supabase.from('customer_profiles').insert({
    id: profileId,
    user_id: userId,
    is_for_self: c.isForSelf,
    senior_full_name: c.seniorFullName ?? null,
    senior_age: c.seniorAge ? parseInt(c.seniorAge) : null,
    senior_phone: c.seniorPhone ?? null,
    location_state: c.locationState,
    location_city: c.locationCity,
    location_postcode: c.locationPostcode,
    mobility_status: c.mobilityStatus,
    needs: c.needs,
    ngo_id: null,
    updated_at: now,
  })
  if (profileErr) { console.error(`  Profile error: ${profileErr.message}`); continue }

  // 4. Emergency contact
  const { error: ecErr } = await supabase.from('emergency_contacts').insert({
    id: crypto.randomUUID(),
    customer_profile_id: profileId,
    name: c.emergencyName,
    relationship: c.emergencyRelation ?? '',
    phone: c.emergencyPhone,
    is_primary: true,
  })
  if (ecErr) console.error(`  Emergency contact error: ${ecErr.message}`)

  console.log(`  ✓ Done — profile ID: ${profileId}`)
  console.log(`  Login: ${c.email} / ${PASSWORD}`)
}

console.log('\n✓ All 10 customers seeded.')
console.log('\nCredentials summary:')
for (const c of customers) {
  const label = c.isForSelf ? c.fullName : `${c.seniorFullName} (waris: ${c.fullName})`
  console.log(`  ${label.padEnd(45)} ${c.email} / ${PASSWORD}`)
}
