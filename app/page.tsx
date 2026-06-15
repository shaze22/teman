import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  Heart, Shield, Star, Users, ArrowRight, CheckCircle,
  Clock, Award, Stethoscope, Activity, Home, Car,
  ChevronRight, Phone,
} from 'lucide-react'
import LangToggle from './_lang-toggle'
import FeaturedProviders from './_featured-providers'
import { type Lang } from '@/lib/i18n'

const content = {
  en: {
    nav: {
      search: 'Find Care',
      howItWorks: 'How It Works',
      about: 'About',
      login: 'Log In',
      register: 'Get Started',
    },
    hero: {
      badge: 'Professional Home Care for Malaysian Seniors',
      title: 'Expert Care,',
      titleHighlight: 'At Your Parent\'s Home',
      subtitle: 'Book licensed nurses, registered physiotherapists, certified home care aides, and companions for your elderly loved ones. Verified professionals, transparent pricing, secure payments.',
      cta: 'Find a Professional',
      ctaSub: 'Register as a Care Professional',
      disclaimer: 'SenioCare connects families with care professionals. We do not provide medical advice. For emergencies, call 999.',
    },
    stats: [
      { value: '50+', label: 'Care Professionals' },
      { value: '200+', label: 'Families Served' },
      { value: '4.8★', label: 'Average Rating' },
      { value: '100%', label: 'Verified Professionals' },
    ],
    services: {
      heading: 'Our Services',
      subheading: 'Professional care at home — from licensed nurses to caring companions',
      locumTitle: 'Professional Care',
      locumDesc: 'Certified professionals verified against official registries',
      companionTitle: 'Social Companion',
      companionDesc: 'Caring companions for daily activities',
    },
    howItWorks: {
      heading: 'How It Works',
      subheading: '3 simple steps to quality care',
      steps: [
        { n: '01', title: 'Search & Filter', desc: 'Browse verified professionals by service, location, and availability. Read genuine reviews from other families.' },
        { n: '02', title: 'Book & Pay Securely', desc: 'Choose your date and time. Payment held in escrow until care is delivered. Card, FPX, or GrabPay accepted.' },
        { n: '03', title: 'Care Delivered', desc: 'Professional arrives at your home. Family receives updates. Funds released only when care is complete.' },
      ],
    },
    compliance: {
      heading: 'Verified. Certified. Trusted.',
      items: [
        { icon: Award, title: 'LJM Registered Nurses', desc: 'All nurses verified against Lembaga Jururawat Malaysia registry' },
        { icon: Activity, title: 'LFM Physiotherapists', desc: 'Physiotherapists verified with Lembaga Fisioterapi Malaysia' },
        { icon: Home, title: 'IHRAM-Certified Aides', desc: 'Home care aides with recognised Homecare certification' },
        { icon: Shield, title: 'IC + Biometric Verified', desc: 'Every professional verified with IC and live selfie match via AI' },
      ],
    },
    cta: {
      familyTitle: 'For Families',
      familySubtitle: 'Quality care for your elderly parents',
      familyFeatures: ['Filter by location & availability', 'Read verified reviews', 'Secure escrow payment'],
      familyCta: 'Find Care Now',
      proTitle: 'For Professionals',
      proSubtitle: 'Grow your practice with SenioCare',
      proFeatures: ['Licensed nurses, physios & aides welcome', 'Earn on your own schedule', 'Transparent commission structure'],
      proCta: 'Join as a Professional',
    },
    testimonials: [
      { name: 'Cik Amy, 42', role: 'Family Member · Singapore', text: 'Dad had a stroke last year. The nurse from SenioCare is professional, gentle, and keeps us updated. Worth every sen.', rating: 5, initials: 'CA' },
      { name: 'Puan Zaiton, 71', role: 'Senior · Petaling Jaya', text: 'The physiotherapist comes every week. My knee is much better now and I can walk without pain. Very grateful.', rating: 5, initials: 'PZ' },
      { name: 'Nurse Faridah', role: 'Licensed Nurse (SRN) · Selangor', text: 'SenioCare lets me take locum cases near my home. My schedule is flexible and payments are always on time.', rating: 5, initials: 'NF' },
    ],
    footer: {
      tagline: 'Professional home care for Malaysian seniors.',
      links: ['Privacy Policy', 'Terms of Service', 'How It Works', 'About Us'],
    },
  },
  bm: {
    nav: {
      search: 'Cari Penjaga',
      howItWorks: 'Cara Guna',
      about: 'Tentang',
      login: 'Log Masuk',
      register: 'Mulakan',
    },
    hero: {
      badge: 'Penjagaan Profesional untuk Warga Emas Malaysia',
      title: 'Penjagaan Pakar,',
      titleHighlight: 'Di Rumah Ibu Bapa Anda',
      subtitle: 'Tempah jururawat berlesen, fisioterapi berdaftar, pembantu penjagaan bertauliah dan pendamping untuk warga emas anda. Profesional disahkan, harga telus, bayaran selamat.',
      cta: 'Cari Profesional Penjagaan',
      ctaSub: 'Daftar sebagai Profesional',
      disclaimer: 'SenioCare adalah platform penghubung sahaja. Kami tidak memberi nasihat perubatan. Dalam kecemasan, hubungi 999.',
    },
    stats: [
      { value: '50+', label: 'Profesional Penjagaan' },
      { value: '200+', label: 'Keluarga Dilayan' },
      { value: '4.8★', label: 'Purata Rating' },
      { value: '100%', label: 'Profesional Disahkan' },
    ],
    services: {
      heading: 'Perkhidmatan Kami',
      subheading: 'Penjagaan profesional di rumah — dari jururawat berlesen hingga pendamping yang penyayang',
      locumTitle: 'Penjagaan Profesional',
      locumDesc: 'Profesional bertauliah disahkan melalui daftar rasmi',
      companionTitle: 'Pendamping Sosial',
      companionDesc: 'Pendamping penyayang untuk aktiviti harian',
    },
    howItWorks: {
      heading: 'Cara Ia Berfungsi',
      subheading: '3 langkah mudah untuk penjagaan berkualiti',
      steps: [
        { n: '01', title: 'Cari & Tapis', desc: 'Semak profesional disahkan mengikut perkhidmatan, lokasi dan ketersediaan. Baca ulasan sebenar dari keluarga lain.' },
        { n: '02', title: 'Tempah & Bayar Selamat', desc: 'Pilih tarikh dan masa. Bayaran ditahan dalam escrow sehingga penjagaan selesai. Terima kad, FPX atau GrabPay.' },
        { n: '03', title: 'Penjagaan Dihantar', desc: 'Profesional tiba di rumah anda. Keluarga terima kemas kini. Dana dilepaskan hanya apabila penjagaan selesai.' },
      ],
    },
    compliance: {
      heading: 'Disahkan. Bertauliah. Dipercayai.',
      items: [
        { icon: Award, title: 'Jururawat Berdaftar LJM', desc: 'Semua jururawat disahkan melalui daftar Lembaga Jururawat Malaysia' },
        { icon: Activity, title: 'Fisioterapi Berdaftar LFM', desc: 'Ahli fisioterapi disahkan dengan Lembaga Fisioterapi Malaysia' },
        { icon: Home, title: 'Pembantu Bertauliah IHRAM', desc: 'Pembantu penjagaan dengan sijil Homecare yang diiktiraf' },
        { icon: Shield, title: 'IC + Pengesahan Biometrik', desc: 'Setiap profesional disahkan dengan IC dan padanan selfie langsung melalui AI' },
      ],
    },
    cta: {
      familyTitle: 'Untuk Keluarga',
      familySubtitle: 'Penjagaan berkualiti untuk ibu bapa warga emas anda',
      familyFeatures: ['Tapis mengikut lokasi & ketersediaan', 'Baca ulasan yang disahkan', 'Bayaran escrow yang selamat'],
      familyCta: 'Cari Penjagaan Sekarang',
      proTitle: 'Untuk Profesional',
      proSubtitle: 'Kembangkan amalan anda bersama SenioCare',
      proFeatures: ['Jururawat, fisioterapi & pembantu penjagaan diterima', 'Jana pendapatan mengikut jadual anda', 'Struktur komisyen yang telus'],
      proCta: 'Sertai sebagai Profesional',
    },
    testimonials: [
      { name: 'Cik Amy, 42', role: 'Waris · Singapura', text: 'Ayah kena strok tahun lepas. Jururawat dari SenioCare sangat profesional, lembut dan sentiasa bagi kemas kini. Berbaloi.', rating: 5, initials: 'CA' },
      { name: 'Puan Zaiton, 71', role: 'Warga Emas · Petaling Jaya', text: 'Ahli fisioterapi datang setiap minggu. Lutut saya jauh lebih baik sekarang dan boleh berjalan tanpa sakit. Sangat bersyukur.', rating: 5, initials: 'PZ' },
      { name: 'Nurse Faridah', role: 'Jururawat Berlesen (SRN) · Selangor', text: 'SenioCare bagi saya ambil kes locum berdekatan rumah. Jadual fleksibel dan bayaran sentiasa tepat masa.', rating: 5, initials: 'NF' },
    ],
    footer: {
      tagline: 'Penjagaan profesional di rumah untuk warga emas Malaysia.',
      links: ['Dasar Privasi', 'Terma Perkhidmatan', 'Cara Guna', 'Tentang Kami'],
    },
  },
}

const locumServices = [
  { icon: Stethoscope, id: 'nursing',       labelEn: 'Licensed Nurse',       labelBm: 'Jururawat Berlesen',      badge: 'LJM Verified',   priceEn: 'from RM60/hr',     priceBm: 'dari RM60/jam',   color: 'bg-teal-50 border-teal-200 text-teal-700' },
  { icon: Activity,    id: 'physiotherapy', labelEn: 'Physiotherapy',         labelBm: 'Fisioterapi',              badge: 'LFM Verified',   priceEn: 'from RM80/session', priceBm: 'dari RM80/sesi',  color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { icon: Home,        id: 'home_care',     labelEn: 'Home Care Aide',        labelBm: 'Pembantu Penjagaan',      badge: 'IHRAM Certified', priceEn: 'from RM40/hr',     priceBm: 'dari RM40/jam',   color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { icon: Car,         id: 'medical_escort',labelEn: 'Medical Escort',        labelBm: 'Pendamping Perubatan',     badge: 'IC Verified',    priceEn: 'from RM50/trip',   priceBm: 'dari RM50/perjalanan', color: 'bg-purple-50 border-purple-200 text-purple-700' },
]

const companionServices = [
  { icon: Activity, id: 'riadah', labelEn: 'Wellness Companion', labelBm: 'Riadah Bersama',  descEn: 'Exercise & outdoor walks', descBm: 'Senaman & jalan-jalan' },
  { icon: Heart,    id: 'ibadah', labelEn: 'Worship Companion',  labelBm: 'Ibadah Bersama',  descEn: 'Mosque, church & prayers', descBm: 'Masjid, gereja & solat' },
  { icon: Users,    id: 'makan',  labelEn: 'Dining Companion',   labelBm: 'Makan Bersama',   descEn: 'Lunch & dinner at eateries', descBm: 'Makan tengahari & malam' },
]

export default async function LandingPage() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'en') as Lang
  const t = content[lang]
  const isEn = lang === 'en'

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-slate-900">SenioCare</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
            <Link href="/search" className="hover:text-teal-600 transition-colors">{t.nav.search}</Link>
            <Link href="/how-it-works" className="hover:text-teal-600 transition-colors">{t.nav.howItWorks}</Link>
            <Link href="/about" className="hover:text-teal-600 transition-colors">{t.nav.about}</Link>
          </div>
          <div className="flex items-center gap-3">
            <LangToggle />
            <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors whitespace-nowrap">
              {t.nav.login}
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-teal-600 text-white px-5 py-2 rounded-full hover:bg-teal-700 transition-colors shadow-sm">
              {t.nav.register}
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">

        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 text-white">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Shield className="w-3.5 h-3.5" />
                {t.hero.badge}
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
                {t.hero.title}
                <br />
                <span className="text-emerald-300">{t.hero.titleHighlight}</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
                {t.hero.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/search" className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 font-semibold px-6 py-3 rounded-xl hover:bg-teal-50 transition-colors shadow-lg">
                  {t.hero.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/register/locum" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm">
                  {t.hero.ctaSub}
                </Link>
              </div>
              <p className="mt-6 text-xs text-white/50 max-w-xl">{t.hero.disclaimer}</p>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {t.stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold text-teal-600">{stat.value}</div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">{t.services.heading}</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">{t.services.subheading}</p>
            </div>

            {/* Locum Services */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{t.services.locumTitle}</h3>
                  <p className="text-sm text-slate-500">{t.services.locumDesc}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {locumServices.map(svc => {
                  const Icon = svc.icon
                  return (
                    <Link key={svc.id} href={`/search?service=${svc.id}`}
                      className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-300 hover:shadow-md transition-all">
                      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-4 ${svc.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="font-semibold text-slate-900 mb-1">
                        {isEn ? svc.labelEn : svc.labelBm}
                      </div>
                      <div className="text-xs font-medium text-teal-600 bg-teal-50 rounded-full px-2 py-0.5 inline-block mb-2">
                        {svc.badge}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center justify-between mt-2">
                        <span>{isEn ? svc.priceEn : svc.priceBm}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Companion Services */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{t.services.companionTitle}</h3>
                  <p className="text-sm text-slate-500">{t.services.companionDesc}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {companionServices.map(svc => {
                  const Icon = svc.icon
                  return (
                    <Link key={svc.id} href={`/search?service=${svc.id}`}
                      className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-rose-200 hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center mb-3">
                        <Icon className="w-5 h-5 text-rose-500" />
                      </div>
                      <div className="font-semibold text-slate-900">{isEn ? svc.labelEn : svc.labelBm}</div>
                      <div className="text-sm text-slate-500 mt-1">{isEn ? svc.descEn : svc.descBm}</div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* COMPLIANCE / TRUST */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">{t.compliance.heading}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.compliance.items.map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex flex-col items-center text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-teal-700" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">{t.howItWorks.heading}</h2>
              <p className="text-slate-500">{t.howItWorks.subheading}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {t.howItWorks.steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                    {step.n}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED PROVIDERS */}
        <FeaturedProviders />

        {/* TESTIMONIALS */}
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
              {isEn ? 'What Families Say' : 'Apa Kata Keluarga'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {t.testimonials.map((t, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-5 text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DUAL CTA */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Family CTA */}
              <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">{t.cta.familyTitle}</h3>
                <p className="text-teal-100 mb-6">{t.cta.familySubtitle}</p>
                <ul className="space-y-2 mb-8">
                  {t.cta.familyFeatures.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-teal-100">
                      <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/search"
                  className="inline-flex items-center gap-2 bg-white text-teal-700 font-semibold px-6 py-3 rounded-xl hover:bg-teal-50 transition-colors shadow">
                  {t.cta.familyCta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Professional CTA */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">{t.cta.proTitle}</h3>
                <p className="text-slate-300 mb-6">{t.cta.proSubtitle}</p>
                <ul className="space-y-2 mb-8">
                  {t.cta.proFeatures.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register/locum"
                  className="inline-flex items-center gap-2 bg-teal-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-teal-400 transition-colors shadow">
                  {t.cta.proCta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* EMERGENCY BANNER */}
        <section className="bg-amber-50 border-y border-amber-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-3 text-amber-800">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm text-center">
                {isEn
                  ? 'SenioCare is a care marketplace, not a medical provider. For medical emergencies, call 999. For health inquiries, consult a registered doctor.'
                  : 'SenioCare adalah pasaran penjagaan, bukan penyedia perubatan. Dalam kecemasan perubatan, hubungi 999. Untuk soalan kesihatan, rujuk doktor berdaftar.'}
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
                  <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
                </div>
                <span className="text-white font-bold">SenioCare</span>
              </div>
              <p className="text-sm max-w-xs">{t.footer.tagline}</p>
              <p className="text-xs mt-2 text-slate-500">© {new Date().getFullYear()} SenioCare. Malaysia.</p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">{isEn ? 'Privacy Policy' : 'Dasar Privasi'}</Link>
              <Link href="/terms" className="hover:text-white transition-colors">{isEn ? 'Terms of Service' : 'Terma Perkhidmatan'}</Link>
              <Link href="/how-it-works" className="hover:text-white transition-colors">{isEn ? 'How It Works' : 'Cara Guna'}</Link>
              <Link href="/about" className="hover:text-white transition-colors">{isEn ? 'About Us' : 'Tentang Kami'}</Link>
              <Link href="/search" className="hover:text-white transition-colors">{isEn ? 'Find Care' : 'Cari Penjagaan'}</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
