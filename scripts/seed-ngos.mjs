import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vhervzbbptbqhmebfspq.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZXJ2emJicHRicWhtZWJmc3BxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ5MDcxNCwiZXhwIjoyMDk1MDY2NzE0fQ.bMqkaaEbrU65nIHAgZZ9BGmSclV7fGD26oTYmISgn98'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

function genCode(name) {
  const prefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}${suffix}`
}

const ngos = [
  {
    adminEmail: 'admin@pitm.org.my',
    adminName: 'Puan Rohani Binti Zakaria',
    adminPhone: '0123456701',
    ngoName: 'Persatuan Ibu Tunggal Malaysia (PITM)',
    regNumber: 'PPM-003-14-27012010',
    contactPerson: 'Puan Rohani Binti Zakaria',
    email: 'info@pitm.org.my',
    phone: '0342890011',
    address: 'No. 12, Jalan Semarak, Wangsa Maju',
    city: 'Kuala Lumpur',
    state: 'Wilayah Persekutuan',
  },
  {
    adminEmail: 'admin@yayasanweseha.org.my',
    adminName: 'Encik Lim Boon Keong',
    adminPhone: '0167892345',
    ngoName: 'Yayasan Warga Emas Sejahtera',
    regNumber: 'PPY-012-08-14032015',
    contactPerson: 'Encik Lim Boon Keong',
    email: 'contact@yayasanweseha.org.my',
    phone: '0378901122',
    address: '45, Jalan Utama, Georgetown',
    city: 'George Town',
    state: 'Pulau Pinang',
  },
  {
    adminEmail: 'admin@wanita-harapan.org.my',
    adminName: 'Dr. Indrani Rajasekaran',
    adminPhone: '0112345678',
    ngoName: 'Pertubuhan Kebajikan Wanita Harapan',
    regNumber: 'PPW-007-22-09082018',
    contactPerson: 'Dr. Indrani Rajasekaran',
    email: 'hello@wanita-harapan.org.my',
    phone: '0763456789',
    address: 'No. 8, Jalan Duta Kiara, Mont Kiara',
    city: 'Petaling Jaya',
    state: 'Selangor',
  },
]

const PASSWORD = 'Teman1234!'

for (const ngo of ngos) {
  console.log(`\nCreating NGO: ${ngo.ngoName}`)

  // Create auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: ngo.adminEmail,
    password: PASSWORD,
    email_confirm: true,
  })
  if (authErr) { console.error('Auth error:', authErr.message); continue }
  const userId = authData.user.id
  console.log(`  Auth user: ${userId}`)

  // Create users row
  const now = new Date().toISOString()
  const { error: userErr } = await supabase.from('users').insert({
    id: userId,
    full_name: ngo.adminName,
    email: ngo.adminEmail,
    phone: ngo.adminPhone,
    role: 'ngo_admin',
    status: 'active',
    created_at: now,
    updated_at: now,
  })
  if (userErr) { console.error('Users row error:', userErr.message); continue }

  // Create NGO record
  const referralCode = genCode(ngo.ngoName)
  const { error: ngoErr } = await supabase.from('ngos').insert({
    id: crypto.randomUUID(),
    name: ngo.ngoName,
    reg_number: ngo.regNumber,
    contact_person: ngo.contactPerson,
    email: ngo.email,
    phone: ngo.phone,
    address: ngo.address,
    city: ngo.city,
    state: ngo.state,
    admin_user_id: userId,
    status: 'active',
    referral_code: referralCode,
    total_members: 0,
    created_at: now,
    updated_at: now,
  })
  if (ngoErr) { console.error('NGO row error:', ngoErr.message); continue }

  console.log(`  NGO created. Referral code: ${referralCode}`)
  console.log(`  Login: ${ngo.adminEmail} / ${PASSWORD}`)
}

console.log('\nDone.')
