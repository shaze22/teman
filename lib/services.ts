export const SERVICE_TYPES = [
  { id: 'food',        label: 'Teman Makan',         active: true  },
  { id: 'job',         label: 'Teman Kerja',          active: false },
  { id: 'learning',    label: 'Teman Belajar',        active: false },
  { id: 'ibadah',      label: 'Teman Ibadah',         active: false },
  { id: 'riadah',      label: 'Teman Riadah',         active: false },
  { id: 'business',    label: 'Teman Bisnes',         active: false },
  { id: 'repair',      label: 'Teman Repair',         active: false },
  { id: 'kombo',       label: 'Teman Kombo',          active: false },
  { id: 'medical_care', label: 'Penjagaan Perubatan', active: false },
]

export const SERVICE_LABELS: Record<string, string> = Object.fromEntries(
  SERVICE_TYPES.map(s => [s.id, s.label])
)

export const ALL_SERVICE_IDS = SERVICE_TYPES.map(s => s.id)

export const SERVICE_SCOPE: Record<string, { desc: string; items: string[] }> = {
  job: {
    desc: 'Penjagaan & teman harian di rumah atau luar rumah.',
    items: [
      'Menemani warga emas di rumah sepanjang tempoh booking',
      'Membantu urusan harian: makan, ubat & pergerakan',
      'Menemani ke hospital, klinik atau janji temu',
      'Kerja ringan: kemas rumah, basuh pinggan, lipat baju',
    ],
  },
  food: {
    desc: 'Teman waktu makan atau masak bersama.',
    items: [
      'Memasak 1–2 hidangan pilihan mengikut selera',
      'Menemani waktu makan & memastikan pemakanan seimbang',
      'Teman ke restoran, gerai atau pasar untuk makan',
      'Menyediakan minuman & snek harian',
    ],
  },
  learning: {
    desc: 'Belajar kemahiran baru atau bantu urusan digital.',
    items: [
      'Mengajar penggunaan telefon & aplikasi (WhatsApp, MySejahtera dll)',
      'Bantu urusan dalam talian: borang, e-Kerajaan, perbankan',
      'Kelas bahasa, kemahiran baru atau aktiviti intelek',
      'Permainan minda: catur, puzzle & kuiz',
    ],
  },
  business: {
    desc: 'Teman untuk urusan perniagaan dan kewangan.',
    items: [
      'Menemani ke bank, pejabat pos atau agensi kerajaan',
      'Bantu urus perniagaan kecil atau jualan dalam talian',
      'Bantu surat-menyurat & dokumen rasmi',
      'Nasihat asas pengurusan kewangan peribadi',
    ],
  },
  ibadah: {
    desc: 'Teman untuk aktiviti keagamaan dan kerohanian.',
    items: [
      'Menemani ke masjid, surau, tokong atau gereja',
      'Bantu persediaan solat atau upacara keagamaan',
      'Menemani kelas agama, pengajian atau majlis ilmu',
      'Membaca Al-Quran, teks agama atau doa bersama',
    ],
  },
  repair: {
    desc: 'Bantu kerja-kerja baik pulih dan penyelenggaraan rumah.',
    items: [
      'Membantu kerja baik pulih ringan di rumah',
      'Menghubungi & menemani tukang paip, elektrik atau aircond',
      'Menukar mentol, bateri, penapis air & komponen kecil',
      'Mengemas & mengatur semula perabot dan barang rumah',
    ],
  },
  riadah: {
    desc: 'Teman untuk aktiviti senaman dan riadah.',
    items: [
      'Menemani bersenam pagi atau petang di taman',
      'Aktiviti ringan: berjalan kaki, yoga, tai chi atau renang',
      'Memantau kesihatan & denyutan nadi semasa aktiviti',
      'Sukan santai: badminton ringan, bowling atau berbasikal',
    ],
  },
  kombo: {
    desc: 'Gabungan pelbagai perkhidmatan dalam satu tempahan.',
    items: [
      'Gabungan 2 atau lebih perkhidmatan dalam 1 tempahan',
      'Fleksibel mengikut keperluan & jadual hari tersebut',
      'Kadar lebih berbaloi berbanding tempah berasingan',
      'Sesuai untuk penjagaan seharian atau sepanjang hari',
    ],
  },
}
