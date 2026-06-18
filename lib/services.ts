export type ServiceId =
  | 'nursing'
  | 'physiotherapy'
  | 'home_care'
  | 'medical_escort'
  | 'riadah'
  | 'ibadah'
  | 'makan'

export type ServiceTier = 'locum' | 'companion'

export interface ServiceType {
  id: ServiceId
  tier: ServiceTier
  label: string
  labelEn: string
  icon: string
  active: boolean
  professionalRequired: boolean  // true = kena license_verified, false = ic_verified cukup
  platformFeePct: number
  pricingType: 'per_hour' | 'per_session' | 'per_day'
  priceMin: number
  priceMax: number
  eligibleRoles: string[]  // which provider roles can offer this service
}

export const SERVICE_TYPES: ServiceType[] = [
  // ── LOCUM TIER ──────────────────────────────────────────────────
  {
    id: 'nursing',
    tier: 'locum',
    label: 'Jururawat Berlesen',
    labelEn: 'Licensed Nurse',
    icon: '🩺',
    active: true,
    professionalRequired: true,
    platformFeePct: 15,
    pricingType: 'per_hour',
    priceMin: 60,
    priceMax: 150,
    eligibleRoles: ['locum_nurse'],
  },
  {
    id: 'physiotherapy',
    tier: 'locum',
    label: 'Fisioterapi Berdaftar',
    labelEn: 'Registered Physiotherapy',
    icon: '🦾',
    active: true,
    professionalRequired: true,
    platformFeePct: 15,
    pricingType: 'per_session',
    priceMin: 80,
    priceMax: 200,
    eligibleRoles: ['locum_physio'],
  },
  {
    id: 'home_care',
    tier: 'locum',
    label: 'Pembantu Penjagaan',
    labelEn: 'Home Care Aide',
    icon: '🏠',
    active: true,
    professionalRequired: true,
    platformFeePct: 15,
    pricingType: 'per_hour',
    priceMin: 40,
    priceMax: 80,
    eligibleRoles: ['locum_care_aide'],
  },
  {
    id: 'medical_escort',
    tier: 'locum',
    label: 'Pendamping Perubatan',
    labelEn: 'Medical Escort',
    icon: '🚗',
    active: true,
    professionalRequired: false,
    platformFeePct: 20,
    pricingType: 'per_session',
    priceMin: 50,
    priceMax: 100,
    eligibleRoles: ['medical_escort', 'locum_nurse', 'locum_physio', 'locum_care_aide'],
  },

  // ── COMPANION TIER ──────────────────────────────────────────────
  {
    id: 'riadah',
    tier: 'companion',
    label: 'Riadah Bersama',
    labelEn: 'Wellness Companion',
    icon: '🏃',
    active: true,
    professionalRequired: false,
    platformFeePct: 20,
    pricingType: 'per_session',
    priceMin: 30,
    priceMax: 80,
    eligibleRoles: ['companion', 'medical_escort', 'locum_nurse', 'locum_physio', 'locum_care_aide'],
  },
  {
    id: 'ibadah',
    tier: 'companion',
    label: 'Ibadah Bersama',
    labelEn: 'Worship Companion',
    icon: '🕌',
    active: true,
    professionalRequired: false,
    platformFeePct: 20,
    pricingType: 'per_session',
    priceMin: 30,
    priceMax: 80,
    eligibleRoles: ['companion', 'medical_escort', 'locum_nurse', 'locum_physio', 'locum_care_aide'],
  },
  {
    id: 'makan',
    tier: 'companion',
    label: 'Makan Bersama',
    labelEn: 'Dining Companion',
    icon: '🍽️',
    active: true,
    professionalRequired: false,
    platformFeePct: 20,
    pricingType: 'per_session',
    priceMin: 30,
    priceMax: 80,
    eligibleRoles: ['companion', 'medical_escort', 'locum_nurse', 'locum_physio', 'locum_care_aide'],
  },
]

export const LOCUM_SERVICES = SERVICE_TYPES.filter(s => s.tier === 'locum')
export const COMPANION_SERVICES = SERVICE_TYPES.filter(s => s.tier === 'companion')
export const ACTIVE_SERVICES = SERVICE_TYPES.filter(s => s.active)

// Service IDs that require license_verified = true before accepting bookings
export const LOCUM_TYPES: ServiceId[] = ['nursing', 'physiotherapy', 'home_care']

export const SERVICE_MAP = Object.fromEntries(SERVICE_TYPES.map(s => [s.id, s])) as Record<ServiceId, ServiceType>

export function getServiceLabel(id: string, lang: 'bm' | 'en' = 'en'): string {
  const svc = SERVICE_MAP[id as ServiceId]
  if (!svc) return id
  return lang === 'en' ? svc.labelEn : svc.label
}

export function getPlatformFee(serviceId: string, amount: number): number {
  const svc = SERVICE_MAP[serviceId as ServiceId]
  const pct = svc?.platformFeePct ?? 20
  return Math.round(amount * pct) / 100
}

export function getProviderAmount(serviceId: string, amount: number): number {
  return amount - getPlatformFee(serviceId, amount)
}

export function canProviderOfferService(providerRole: string, serviceId: string): boolean {
  const svc = SERVICE_MAP[serviceId as ServiceId]
  return svc?.eligibleRoles.includes(providerRole) ?? false
}

export const SERVICE_SCOPE: Record<ServiceId, { desc: string; descEn: string; items: string[]; itemsEn: string[] }> = {
  nursing: {
    desc: 'Penjagaan klinikal di rumah oleh jururawat berdaftar dengan Lembaga Jururawat Malaysia.',
    descEn: 'Clinical home care by a nurse registered with the Malaysian Nursing Board (LJM).',
    items: [
      'Pemantauan tekanan darah, gula darah & tanda vital',
      'Pengurusan ubat dan dos harian',
      'Penjagaan luka, kateter atau tiub perubatan',
      'Pencatatan rekod kesihatan & laporan kepada keluarga',
    ],
    itemsEn: [
      'Blood pressure, blood sugar & vital sign monitoring',
      'Medication management and daily dosage',
      'Wound care, catheter or medical tube management',
      'Health record documentation & family reporting',
    ],
  },
  physiotherapy: {
    desc: 'Sesi fisioterapi di rumah oleh ahli fisioterapi berdaftar dengan Lembaga Fisioterapi Malaysia.',
    descEn: 'Home physiotherapy by a physiotherapist registered with the Malaysian Physiotherapy Board.',
    items: [
      'Penilaian mobiliti dan pergerakan',
      'Latihan fisioterapi berpandu',
      'Pengurusan kesakitan (sakit sendi, otot, tulang)',
      'Rehabilitasi pasca pembedahan atau strok',
    ],
    itemsEn: [
      'Mobility and movement assessment',
      'Guided physiotherapy exercises',
      'Pain management (joints, muscles, bones)',
      'Post-surgery or stroke rehabilitation',
    ],
  },
  home_care: {
    desc: 'Penjagaan harian di rumah oleh pembantu penjagaan bertauliah (sijil Homecare IHRAM atau setaraf).',
    descEn: 'Daily home care by a certified home care aide (IHRAM Homecare certificate or equivalent).',
    items: [
      'Mandikan, pakaian & kebersihan diri warga emas',
      'Penyediaan makanan mengikut diet preskripsi',
      'Teman dan bantu pergerakan (berjalan, kerusi roda)',
      'Aktiviti harian dan senaman ringan berpandu',
    ],
    itemsEn: [
      'Bathing, dressing & personal hygiene assistance',
      'Meal preparation per prescribed diet',
      'Mobility assistance (walking, wheelchair)',
      'Daily activities and guided light exercise',
    ],
  },
  medical_escort: {
    desc: 'Pendamping ke hospital, klinik atau pusat dialisis. Bukan perkhidmatan klinikal.',
    descEn: 'Escort to hospital, clinic or dialysis centre. Not a clinical service.',
    items: [
      'Teman ke temujanji hospital, klinik atau spesialis',
      'Bantu urus pendaftaran & tempoh menunggu',
      'Catat maklumat doktor & penerangan rawatan',
      'Hantar balik ke rumah dengan selamat',
    ],
    itemsEn: [
      'Accompany to hospital, clinic or specialist appointments',
      'Assist with registration and waiting period',
      'Note doctor\'s instructions and treatment details',
      'Safe transport home after appointment',
    ],
  },
  riadah: {
    desc: 'Teman aktiviti senaman dan riadah ringan untuk warga emas.',
    descEn: 'Companion for light exercise and wellness activities for seniors.',
    items: [
      'Berjalan kaki di taman atau kawasan perumahan',
      'Senaman ringan, yoga atau tai chi berpandu',
      'Pantau keselesaan semasa aktiviti',
      'Badminton ringan, bowling atau berbasikal',
    ],
    itemsEn: [
      'Walking in the park or neighbourhood',
      'Light exercise, yoga or guided tai chi',
      'Monitor comfort and wellbeing during activity',
      'Light badminton, bowling or cycling',
    ],
  },
  ibadah: {
    desc: 'Teman untuk aktiviti keagamaan dan kerohanian.',
    descEn: 'Companion for religious and spiritual activities.',
    items: [
      'Teman ke masjid, surau, tokong atau gereja',
      'Bantu persediaan solat atau upacara keagamaan',
      'Teman kelas agama atau pengajian',
      'Membaca Al-Quran atau teks agama bersama',
    ],
    itemsEn: [
      'Accompany to mosque, surau, temple or church',
      'Assist with prayer or religious ceremony preparation',
      'Accompany to religious classes or study sessions',
      'Read Quran or religious texts together',
    ],
  },
  makan: {
    desc: 'Teman makan untuk warga emas di restoran, kafe atau kedai makan.',
    descEn: 'Dining companion for seniors at restaurants, cafes or food outlets.',
    items: [
      'Teman waktu makan tengahari atau malam',
      'Pastikan warga emas makan dengan selesa',
      'Perbualan mesra sepanjang waktu makan',
      'Bantu pilih menu mengikut keperluan diet',
    ],
    itemsEn: [
      'Accompany for lunch or dinner',
      'Ensure senior eats comfortably',
      'Warm conversation throughout the meal',
      'Assist with menu selection per dietary needs',
    ],
  },
}

export const LICENSE_TYPES: Record<string, { label: string; issuedBy: string; checkUrl: string }> = {
  LJM_SRN: {
    label: 'Jururawat Berdaftar (SRN)',
    issuedBy: 'Lembaga Jururawat Malaysia',
    checkUrl: 'https://www.ljm.gov.my',
  },
  LJM_SEM: {
    label: 'Jururawat Enrolled (SEM)',
    issuedBy: 'Lembaga Jururawat Malaysia',
    checkUrl: 'https://www.ljm.gov.my',
  },
  LFM: {
    label: 'Ahli Fisioterapi Berdaftar',
    issuedBy: 'Lembaga Fisioterapi Malaysia',
    checkUrl: 'https://www.lfm.gov.my',
  },
  IHRAM_HOMECARE: {
    label: 'Sijil Homecare IHRAM',
    issuedBy: 'Institut Homecare Malaysia (IHRAM)',
    checkUrl: 'https://www.ihram.com.my',
  },
  KKM_PARAMEDIC: {
    label: 'Paramedik / Pembantu Perubatan KKM',
    issuedBy: 'Kementerian Kesihatan Malaysia',
    checkUrl: 'https://www.moh.gov.my',
  },
}
