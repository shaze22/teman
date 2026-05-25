import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

const SUPABASE_URL = 'https://vhervzbbptbqhmebfspq.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZXJ2emJicHRicWhtZWJmc3BxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ5MDcxNCwiZXhwIjoyMDk1MDY2NzE0fQ.bMqkaaEbrU65nIHAgZZ9BGmSclV7fGD26oTYmISgn98'
const COLLAGE_PATH = String.raw`C:\Users\Acer\Downloads\Gemini_Generated_Image_8s4ney8s4ney8s4n.png`

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const uid = () => crypto.randomUUID()
const now = new Date().toISOString()

// 5 columns x 2 rows grid
// V boundaries at x≈282, 564, 844, 1128
// H boundary at y≈384
const CROPS = [
  // Row 1
  { x: 0,    y: 0,   w: 282, h: 384 },
  { x: 283,  y: 0,   w: 281, h: 384 },
  { x: 565,  y: 0,   w: 279, h: 384 },
  { x: 845,  y: 0,   w: 283, h: 384 },
  { x: 1129, y: 0,   w: 279, h: 384 },
  // Row 2
  { x: 0,    y: 386, w: 282, h: 382 },
  { x: 283,  y: 386, w: 281, h: 382 },
  { x: 565,  y: 386, w: 279, h: 382 },
  { x: 845,  y: 386, w: 283, h: 382 },
  { x: 1129, y: 386, w: 279, h: 382 },
]

const seniors = [
  // Row 1
  {
    email: 'ramlah.kamarudin@gmail.com', name: 'Hajah Ramlah Kamarudin',
    phone: '0123456801', age: 72, state: 'Kuala Lumpur', city: 'Chow Kit',
    mobility: 'walking_stick', needs: ['job', 'food', 'companionship'],
    conditions: ['hypertension', 'diabetes'], dietary: ['low_sugar', 'halal'],
    ec: { name: 'Ahmad Razif', phone: '0123456802', rel: 'Anak' },
  },
  {
    email: 'lily.tan.senior@gmail.com', name: 'Puan Lily Tan Ah Moi',
    phone: '0123456803', age: 68, state: 'Selangor', city: 'Subang Jaya',
    mobility: 'independent', needs: ['companionship', 'food'],
    conditions: ['arthritis'], dietary: ['low_sodium'],
    ec: { name: 'David Tan', phone: '0123456804', rel: 'Anak' },
  },
  {
    email: 'kamala.devi@gmail.com', name: 'Puan Kamala Devi Ramasamy',
    phone: '0123456805', age: 70, state: 'Kuala Lumpur', city: 'Brickfields',
    mobility: 'independent', needs: ['cooking', 'companionship'],
    conditions: ['knee_pain'], dietary: ['vegetarian', 'no_beef'],
    ec: { name: 'Rajan Ramasamy', phone: '0123456806', rel: 'Anak' },
  },
  {
    email: 'mariam.abdullah.senior@gmail.com', name: 'Puan Mariam Abdullah',
    phone: '0123456807', age: 65, state: 'Selangor', city: 'Shah Alam',
    mobility: 'independent', needs: ['companionship', 'shopping'],
    conditions: [], dietary: ['halal'],
    ec: { name: 'Farid Abdullah', phone: '0123456808', rel: 'Anak' },
  },
  {
    email: 'norsiah.mohdisa@gmail.com', name: 'Hajah Norsiah Mohd Isa',
    phone: '0123456809', age: 75, state: 'Selangor', city: 'Petaling Jaya',
    mobility: 'walking_stick', needs: ['job', 'food', 'companionship'],
    conditions: ['hypertension', 'back_pain'], dietary: ['halal', 'low_sodium'],
    ec: { name: 'Suraya Norsiah', phone: '0123456810', rel: 'Anak' },
  },
  // Row 2
  {
    email: 'helen.chong.senior@gmail.com', name: 'Puan Helen Chong Siew Lan',
    phone: '0123456811', age: 67, state: 'Selangor', city: 'Ampang',
    mobility: 'independent', needs: ['companionship', 'shopping'],
    conditions: ['diabetes'], dietary: ['low_sugar'],
    ec: { name: 'Michael Chong', phone: '0123456812', rel: 'Anak' },
  },
  {
    email: 'saraswathi.pillai@gmail.com', name: 'Puan Saraswathi Pillai',
    phone: '0123456813', age: 73, state: 'Kuala Lumpur', city: 'Sentul',
    mobility: 'walking_stick', needs: ['job', 'food'],
    conditions: ['hypertension', 'diabetes'], dietary: ['vegetarian', 'no_beef'],
    ec: { name: 'Priya Pillai', phone: '0123456814', rel: 'Anak' },
  },
  {
    email: 'susan.lee.senior@gmail.com', name: 'Puan Susan Lee Mei Ling',
    phone: '0123456815', age: 69, state: 'Kuala Lumpur', city: 'Taman Desa',
    mobility: 'independent', needs: ['companionship', 'teaching'],
    conditions: ['arthritis'], dietary: ['low_sodium'],
    ec: { name: 'Jason Lee', phone: '0123456816', rel: 'Anak' },
  },
  {
    email: 'rozita.ibrahim@gmail.com', name: 'Hajah Rozita Ibrahim',
    phone: '0123456817', age: 71, state: 'Selangor', city: 'Kajang',
    mobility: 'independent', needs: ['companionship', 'food'],
    conditions: ['hypertension'], dietary: ['halal', 'low_sodium'],
    ec: { name: 'Hafizuddin Rozita', phone: '0123456818', rel: 'Anak' },
  },
  {
    email: 'grace.yap.senior@gmail.com', name: 'Puan Grace Yap Soo Yin',
    phone: '0123456819', age: 78, state: 'Kuala Lumpur', city: 'Mont Kiara',
    mobility: 'wheelchair', needs: ['job', 'food', 'companionship'],
    conditions: ['osteoporosis', 'hypertension'], dietary: ['low_sodium', 'soft_food'],
    ec: { name: 'Christine Yap', phone: '0123456820', rel: 'Anak' },
  },
]

function cropImages() {
  const tmpDir = path.join(os.tmpdir(), 'teman_seniors')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

  const pyFile = path.join(os.tmpdir(), 'teman_crop_seniors.py')
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
    out = out_dir + '/senior_{:02d}.jpg'.format(i+1)
    region.save(out, 'JPEG', quality=90)
    paths.append(out)
print(json.dumps(paths))
`, 'utf8')

  const result = execSync(`python "${pyFile}"`, { encoding: 'utf8' })
  return JSON.parse(result.trim())
}

async function uploadAvatar(filePath, fileName) {
  const fileBuffer = fs.readFileSync(filePath)
  const { error } = await supabase.storage
    .from('avatars')
    .upload(`seniors/${fileName}`, fileBuffer, { contentType: 'image/jpeg', upsert: true })
  if (error) throw new Error(`Upload failed: ${error.message}`)
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`seniors/${fileName}`)
  return publicUrl
}

async function createAuthUser(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password: 'Teman1234!', email_confirm: true }),
  })
  const data = await res.json()
  if (!data.id) throw new Error(`Auth failed for ${email}: ${JSON.stringify(data)}`)
  return data.id
}

async function main() {
  console.log('=== Seeding 10 Warga Emas (Senior Citizens) ===\n')

  console.log('Cropping collage...')
  const imagePaths = cropImages()
  console.log(`  ✓ ${imagePaths.length} images cropped\n`)

  for (let i = 0; i < seniors.length; i++) {
    const s = seniors[i]
    console.log(`[${i + 1}/10] ${s.name}, ${s.age} tahun...`)

    // Upload avatar
    const fileName = `senior_${(i + 1).toString().padStart(2, '0')}.jpg`
    const avatarUrl = await uploadAvatar(imagePaths[i], fileName)
    console.log(`  ✓ Avatar uploaded`)

    // Create auth user
    const authId = await createAuthUser(s.email)

    // Insert user
    const { error: userErr } = await supabase.from('users').insert({
      id: authId, email: s.email, phone: s.phone,
      full_name: s.name, role: 'customer', status: 'active',
      avatar_url: avatarUrl, updated_at: now,
    })
    if (userErr) throw new Error(`User insert: ${userErr.message}`)

    // Insert customer profile (warga emas booking for themselves)
    const { data: profile, error: profErr } = await supabase
      .from('customer_profiles')
      .insert({
        id: uid(), user_id: authId,
        is_for_self: true,
        senior_full_name: s.name,
        senior_age: s.age,
        senior_phone: s.phone,
        senior_avatar_url: avatarUrl,
        location_state: s.state, location_city: s.city,
        mobility_status: s.mobility,
        needs: s.needs,
        health_conditions: s.conditions,
        dietary_requirements: s.dietary,
        updated_at: now,
      })
      .select('id')
      .single()
    if (profErr) throw new Error(`Profile insert: ${profErr.message}`)

    // Insert emergency contact
    await supabase.from('emergency_contacts').insert({
      id: uid(), customer_profile_id: profile.id,
      name: s.ec.name, relationship: s.ec.rel,
      phone: s.ec.phone, is_primary: true,
    })

    console.log(`  ✓ Done — ${s.email}`)
  }

  console.log('\n=== 10 warga emas seeded! Password: Teman1234! ===')
}

main().catch(e => { console.error(e); process.exit(1) })
