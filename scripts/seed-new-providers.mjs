import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

const SUPABASE_URL = 'https://vhervzbbptbqhmebfspq.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZXJ2emJicHRicWhtZWJmc3BxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ5MDcxNCwiZXhwIjoyMDk1MDY2NzE0fQ.bMqkaaEbrU65nIHAgZZ9BGmSclV7fGD26oTYmISgn98'
const COLLAGE_PATH = String.raw`C:\Users\Acer\Downloads\Gemini_Generated_Image_e8w0dhe8w0dhe8w0.png`

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const uid = () => crypto.randomUUID()
const now = new Date().toISOString()

// Crop regions: [x, y, width, height]
const CROPS = [
  // Row 1 (y=0-253), 3 columns
  { x: 0,    y: 0,   w: 468, h: 253 },
  { x: 470,  y: 0,   w: 469, h: 253 },
  { x: 941,  y: 0,   w: 467, h: 253 },
  // Row 2 (y=255-511), 3 columns
  { x: 0,    y: 255, w: 468, h: 256 },
  { x: 470,  y: 255, w: 469, h: 256 },
  { x: 941,  y: 255, w: 467, h: 256 },
  // Row 3 (y=514-767), 4 columns
  { x: 0,    y: 514, w: 352, h: 253 },
  { x: 356,  y: 514, w: 347, h: 253 },
  { x: 706,  y: 514, w: 349, h: 253 },
  { x: 1058, y: 514, w: 350, h: 253 },
]

const providers = [
  {
    email: 'nurul.izzah@teman.my', name: 'Nurul Izzah Ahmad',
    phone: '0112346001', state: 'Kuala Lumpur', city: 'Petaling Jaya',
    bio: 'Profesional yang berpengalaman. Penyayang dan bertanggungjawab dalam menjaga warga emas. Fasih berbahasa Melayu dan Inggeris.',
    skills: ['elderly_care', 'companionship'], price: 30, transport: 'car',
    languages: ['bm', 'en'], children: 2, rating: 4.9, reviews: 36, bookings: 48,
    verified: true,
  },
  {
    email: 'jenny.lim@teman.my', name: 'Jenny Lim Wei Ling',
    phone: '0112346002', state: 'Selangor', city: 'Subang Jaya',
    bio: 'Aktif dan ceria. Suka teman warga emas jalan-jalan, bercakap dan lakukan aktiviti ringan. Boleh masak masakan Cina dan Western.',
    skills: ['companionship', 'cooking'], price: 22, transport: 'car',
    languages: ['en', 'mandarin', 'bm'], children: 1, rating: 4.7, reviews: 21, bookings: 27,
  },
  {
    email: 'priya.krishnan@teman.my', name: 'Priya Krishnan',
    phone: '0112346003', state: 'Kuala Lumpur', city: 'Brickfields',
    bio: 'Terlatih dalam penjagaan pesakit dan boleh masak masakan India yang sihat. Sabar dan teliti dalam setiap tugas.',
    skills: ['elderly_care', 'cooking', 'cleaning'], price: 28, transport: 'motorcycle',
    languages: ['en', 'bm', 'tamil'], children: 2, rating: 4.8, reviews: 29, bookings: 38,
    verified: true,
  },
  {
    email: 'aishah.fadzil@teman.my', name: 'Aishah Mohd Fadzil',
    phone: '0112346004', state: 'Selangor', city: 'Shah Alam',
    bio: 'Cergas dan bersemangat. Sesuai teman warga emas berjalan, bersenam ringan dan aktiviti fizikal harian.',
    skills: ['elderly_care', 'shopping'], price: 20, transport: 'car',
    languages: ['bm', 'en'], children: 1, rating: 4.5, reviews: 14, bookings: 18,
  },
  {
    email: 'sara.hussin@teman.my', name: 'Sara Hussin',
    phone: '0112346005', state: 'Kuala Lumpur', city: 'Bangsar',
    bio: 'Kreatif dan artistik. Suka ajar warga emas melukis, kraftangan dan aktiviti seni yang menyeronokkan.',
    skills: ['teaching', 'companionship'], price: 25, transport: 'motorcycle',
    languages: ['bm', 'en'], children: 2, rating: 4.6, reviews: 17, bookings: 22,
  },
  {
    email: 'michelle.tan@teman.my', name: 'Michelle Tan Shu Min',
    phone: '0112346006', state: 'Selangor', city: 'Ampang',
    bio: 'Aktif dan sihat. Suka memasak masakan Cina tradisional dan membantu warga emas kekal aktif dengan aktiviti luar.',
    skills: ['cooking', 'elderly_care'], price: 24, transport: 'car',
    languages: ['mandarin', 'en', 'bm'], children: 1, rating: 4.7, reviews: 19, bookings: 25,
  },
  {
    email: 'fatimah.zahra@teman.my', name: 'Fatimah Zahra Ahmad',
    phone: '0112346007', state: 'Selangor', city: 'Kajang',
    bio: 'Ibu tunggal berpengalaman. Mesra, penyayang dan pandai masak. Rumah saya bersih dan selamat untuk warga emas.',
    skills: ['cooking', 'cleaning', 'companionship'], price: 18, transport: 'motorcycle',
    languages: ['bm'], children: 3, rating: 4.6, reviews: 22, bookings: 29,
  },
  {
    email: 'alice.wong@teman.my', name: 'Alice Wong Mei Fen',
    phone: '0112346008', state: 'Kuala Lumpur', city: 'Wangsa Maju',
    bio: 'Suka membaca dan belajar. Boleh teman warga emas membaca, mengira bil dan urusan perbankan mudah.',
    skills: ['teaching', 'companionship', 'shopping'], price: 20, transport: 'car',
    languages: ['mandarin', 'en', 'bm'], children: 2, rating: 4.5, reviews: 16, bookings: 20,
  },
  {
    email: 'vanessa.ng@teman.my', name: 'Vanessa Ng Pei Ling',
    phone: '0112346009', state: 'Kuala Lumpur', city: 'Chow Kit',
    bio: 'Muda, cergas dan biasa dengan teknologi. Boleh bantu warga emas guna smartphone dan teman ke pelbagai destinasi.',
    skills: ['companionship', 'shopping', 'elderly_care'], price: 22, transport: 'car',
    languages: ['mandarin', 'en', 'bm'], children: 1, rating: 4.4, reviews: 11, bookings: 14,
  },
  {
    email: 'nabilah.hashim@teman.my', name: 'Nabilah Hashim',
    phone: '0112346010', state: 'Selangor', city: 'Cyberjaya',
    bio: 'Mahir teknologi dan sangat sabar. Boleh bantu warga emas dengan telemedicine, janji temu online dan urusan harian.',
    skills: ['elderly_care', 'companionship', 'teaching'], price: 26, transport: 'car',
    languages: ['bm', 'en'], children: 2, rating: 4.8, reviews: 28, bookings: 35,
    verified: true,
  },
]

// Step 1: Crop images using Python
function cropImages() {
  const tmpDir = path.join(os.tmpdir(), 'teman_avatars')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

  const pyFile = path.join(os.tmpdir(), 'teman_crop.py')
  const cropsJson = JSON.stringify(CROPS)
  const collageEsc = COLLAGE_PATH.replace(/\\/g, '\\\\')
  const tmpDirEsc = tmpDir.replace(/\\/g, '\\\\')

  fs.writeFileSync(pyFile, `
from PIL import Image
import json

collage = Image.open(r'${collageEsc}')
crops = ${cropsJson}
out_dir = r'${tmpDirEsc}'
paths = []
for i, c in enumerate(crops):
    region = collage.crop((c['x'], c['y'], c['x']+c['w'], c['y']+c['h']))
    region = region.resize((400, 400), Image.LANCZOS)
    region = region.convert('RGB')
    out = out_dir + '/avatar_{:02d}.jpg'.format(i+1)
    region.save(out, 'JPEG', quality=90)
    paths.append(out)
print(json.dumps(paths))
`, 'utf8')

  const result = execSync(`python "${pyFile}"`, { encoding: 'utf8' })
  return JSON.parse(result.trim())
}

// Step 2: Upload image to Supabase storage
async function uploadAvatar(filePath, fileName) {
  const fileBuffer = fs.readFileSync(filePath)
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(`providers/${fileName}`, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) throw new Error(`Upload failed for ${fileName}: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(`providers/${fileName}`)

  return publicUrl
}

// Step 3: Ensure storage bucket exists
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === 'avatars')
  if (!exists) {
    const { error } = await supabase.storage.createBucket('avatars', { public: true })
    if (error) throw new Error(`Bucket creation failed: ${error.message}`)
    console.log('  Created "avatars" bucket')
  }
}

// Step 4: Create auth user
async function createAuthUser(email, password = 'Teman1234!') {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  const data = await res.json()
  if (!data.id) throw new Error(`Auth user creation failed for ${email}: ${JSON.stringify(data)}`)
  return data.id
}

async function main() {
  console.log('=== Seeding 10 New Providers with Avatars ===\n')

  // Crop images
  console.log('Cropping collage into 10 individual photos...')
  let imagePaths
  try {
    imagePaths = cropImages()
    console.log(`  ✓ Cropped ${imagePaths.length} images to ${imagePaths[0].split('/').slice(0, -1).join('/')}\n`)
  } catch (e) {
    console.error('Failed to crop images:', e.message)
    process.exit(1)
  }

  // Ensure bucket
  await ensureBucket()

  for (let i = 0; i < providers.length; i++) {
    const p = providers[i]
    console.log(`[${i + 1}/10] ${p.name}...`)

    // Upload avatar
    const avatarFileName = `provider_${(i + 1).toString().padStart(2, '0')}.jpg`
    let avatarUrl = null
    try {
      avatarUrl = await uploadAvatar(imagePaths[i], avatarFileName)
      console.log(`  ✓ Avatar uploaded`)
    } catch (e) {
      console.warn(`  ! Avatar upload failed: ${e.message}`)
    }

    // Create auth user
    const authId = await createAuthUser(p.email)

    // Insert user row with avatar
    const { error: userErr } = await supabase.from('users').insert({
      id: authId,
      email: p.email,
      phone: p.phone,
      full_name: p.name,
      role: 'single_mother',
      status: 'active',
      avatar_url: avatarUrl,
      updated_at: now,
    })
    if (userErr) throw new Error(`User insert failed: ${userErr.message}`)

    // Insert provider profile
    const { data: profile, error: profErr } = await supabase
      .from('single_mother_profiles')
      .insert({
        id: uid(),
        user_id: authId,
        location_state: p.state,
        location_city: p.city,
        bio: p.bio,
        languages: p.languages,
        has_transport: p.transport,
        children_count: p.children,
        can_bring_children: false,
        rating_avg: p.rating,
        total_reviews: p.reviews,
        total_bookings: p.bookings,
        verified_by_ngo: p.verified ?? false,
        is_active: true,
        updated_at: now,
      })
      .select('id')
      .single()
    if (profErr) throw new Error(`Profile insert failed: ${profErr.message}`)

    // Insert skills
    await supabase.from('provider_skills').insert(
      p.skills.map(s => ({ id: uid(), profile_id: profile.id, skill_name: s, skill_category: s }))
    )

    // Insert pricing
    await supabase.from('provider_pricing').insert({
      id: uid(),
      profile_id: profile.id,
      service_type: 'job',
      pricing_type: 'per_hour',
      price: p.price,
      updated_at: now,
    })

    console.log(`  ✓ Done — ${p.email}`)
  }

  console.log('\n=== All 10 providers seeded! Password: Teman1234! ===')
}

main().catch(e => { console.error(e); process.exit(1) })
