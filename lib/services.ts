export const SERVICE_TYPES = [
  { id: 'food',         label: 'Meal Companion',       labelEn: 'Meal Companion',         active: true,  hidden: false },
  { id: 'job',          label: 'Teman Kerja',           labelEn: 'Daily Companion',        active: false, hidden: false },
  { id: 'learning',     label: 'Teman Belajar',         labelEn: 'Learning Companion',     active: false, hidden: false },
  { id: 'ibadah',       label: 'Teman Ibadah',          labelEn: 'Worship Companion',      active: false, hidden: false },
  { id: 'riadah',       label: 'Teman Riadah',          labelEn: 'Wellness Companion',     active: false, hidden: false },
  { id: 'business',     label: 'Teman Bisnes',          labelEn: 'Errands Companion',      active: false, hidden: false },
  { id: 'repair',       label: 'Teman Repair',          labelEn: 'Home Repair Companion',  active: false, hidden: false },
  { id: 'locum',        label: 'Locum Profesional',     labelEn: 'Locum Professional',     active: false, hidden: false },
  { id: 'kombo',        label: 'Teman Kombo',           labelEn: 'Combo Companion',        active: false, hidden: true  },
  { id: 'medical_care', label: 'Penjagaan Perubatan',   labelEn: 'Medical Care',           active: false, hidden: true  },
]

export const SERVICE_LABELS: Record<string, string> = Object.fromEntries(
  SERVICE_TYPES.map(s => [s.id, s.label])
)

export const SERVICE_LABELS_EN: Record<string, string> = Object.fromEntries(
  SERVICE_TYPES.map(s => [s.id, s.labelEn])
)

export const ALL_SERVICE_IDS = SERVICE_TYPES.map(s => s.id)

export const SERVICE_SCOPE: Record<string, { desc: string; descEn: string; items: string[]; itemsEn: string[] }> = {
  food: {
    desc: 'Teman waktu makan — makan bersama di restoran, kafe, atau gerai.',
    descEn: 'A dining companion — eat together at restaurants, cafes, or food stalls.',
    items: [
      'Menemani waktu makan tengahari atau malam',
      'Teman ke restoran, kafe, atau gerai pilihan',
      'Perbualan mesra sepanjang waktu makan',
      'Pastikan warga emas makan dengan selesa dan teratur',
    ],
    itemsEn: [
      'Accompany for lunch or dinner',
      'Go together to preferred restaurants, cafes, or stalls',
      'Warm conversation throughout the meal',
      'Ensure senior eats comfortably and on schedule',
    ],
  },
  job: {
    desc: 'Penjagaan & teman harian di rumah atau luar rumah.',
    descEn: 'Daily care & companionship at home or outside.',
    items: [
      'Menemani warga emas di rumah sepanjang tempoh booking',
      'Membantu urusan harian: makan, ubat & pergerakan',
      'Menemani ke hospital, klinik atau janji temu',
      'Kerja ringan: kemas rumah, basuh pinggan, lipat baju',
    ],
    itemsEn: [
      'Accompany senior at home for the full booking period',
      'Assist with daily routines: meals, medication & mobility',
      'Accompany to hospital, clinic or appointments',
      'Light tasks: tidying, washing dishes, folding laundry',
    ],
  },
  learning: {
    desc: 'Belajar kemahiran baru atau bantu urusan digital.',
    descEn: 'Learn new skills or get help with digital tasks.',
    items: [
      'Mengajar penggunaan telefon & aplikasi',
      'Bantu urusan dalam talian: borang, e-Kerajaan, perbankan',
      'Kelas bahasa, kemahiran baru atau aktiviti intelek',
      'Permainan minda: catur, puzzle & kuiz',
    ],
    itemsEn: [
      'Teach phone & app usage',
      'Help with online tasks: forms, e-Government, banking',
      'Language classes, new skills or intellectual activities',
      'Mind games: chess, puzzles & quizzes',
    ],
  },
  business: {
    desc: 'Teman untuk urusan dan keperluan harian di luar rumah.',
    descEn: 'Companion for errands and daily needs outside the home.',
    items: [
      'Menemani ke bank, pejabat pos atau agensi kerajaan',
      'Teman ke pasar, farmasi, atau kedai',
      'Bantu urus perniagaan kecil atau jualan dalam talian',
      'Bantu surat-menyurat & dokumen rasmi',
    ],
    itemsEn: [
      'Accompany to bank, post office or government agencies',
      'Go together to markets, pharmacies or shops',
      'Help with small business or online selling',
      'Assist with correspondence & official documents',
    ],
  },
  ibadah: {
    desc: 'Teman untuk aktiviti keagamaan dan kerohanian.',
    descEn: 'Companion for religious and spiritual activities.',
    items: [
      'Menemani ke masjid, surau, tokong atau gereja',
      'Bantu persediaan solat atau upacara keagamaan',
      'Menemani kelas agama, pengajian atau majlis ilmu',
      'Membaca Al-Quran, teks agama atau doa bersama',
    ],
    itemsEn: [
      'Accompany to mosque, surau, temple or church',
      'Assist with prayer preparation or religious ceremonies',
      'Accompany to religious classes or knowledge sessions',
      'Read Quran, religious texts or prayers together',
    ],
  },
  repair: {
    desc: 'Bantu kerja-kerja baik pulih dan penyelenggaraan rumah.',
    descEn: 'Help with home repair and maintenance tasks.',
    items: [
      'Membantu kerja baik pulih ringan di rumah',
      'Menghubungi & menemani tukang',
      'Menukar mentol, bateri, penapis air & komponen kecil',
      'Mengemas & mengatur semula perabot dan barang rumah',
    ],
    itemsEn: [
      'Help with light repair work at home',
      'Contact and accompany tradespeople',
      'Replace bulbs, batteries, water filters & small parts',
      'Tidy and rearrange furniture and household items',
    ],
  },
  riadah: {
    desc: 'Teman untuk aktiviti senaman dan riadah.',
    descEn: 'Companion for exercise and wellness activities.',
    items: [
      'Menemani bersenam pagi atau petang di taman',
      'Aktiviti ringan: berjalan kaki, yoga, tai chi atau renang',
      'Memantau kesihatan & denyutan nadi semasa aktiviti',
      'Sukan santai: badminton ringan, bowling atau berbasikal',
    ],
    itemsEn: [
      'Accompany for morning or evening exercise in the park',
      'Light activities: walking, yoga, tai chi or swimming',
      'Monitor health & heart rate during activities',
      'Casual sports: light badminton, bowling or cycling',
    ],
  },
  locum: {
    desc: 'Penjaga bertauliah — jururawat, paramedik, atau pengasuh bersijil.',
    descEn: 'Certified caregiver — nurse, paramedic, or certified carer.',
    items: [
      'Pemantauan kesihatan & tekanan darah',
      'Pengurusan ubat dan dos harian',
      'Penjagaan luka, kateter atau tiub',
      'Sokongan mobiliti dan fisioterapi asas',
    ],
    itemsEn: [
      'Health monitoring & blood pressure checks',
      'Medication management and daily dosage',
      'Wound care, catheter or tube management',
      'Mobility support and basic physiotherapy',
    ],
  },
  kombo: {
    desc: 'Gabungan pelbagai perkhidmatan dalam satu tempahan.',
    descEn: 'Combination of multiple services in one booking.',
    items: [
      'Gabungan 2 atau lebih perkhidmatan dalam 1 tempahan',
      'Fleksibel mengikut keperluan & jadual hari tersebut',
    ],
    itemsEn: [
      'Combine 2 or more services in 1 booking',
      'Flexible based on needs and daily schedule',
    ],
  },
}
