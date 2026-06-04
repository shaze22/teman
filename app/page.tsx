import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  Heart, Shield, Star, Users, ChefHat, BookOpen,
  Briefcase, HandHeart, ArrowRight, CheckCircle, Sparkles,
} from 'lucide-react'
import FeaturedProviders from './_featured-providers'
import LangToggle from './_lang-toggle'
import { translations, type Lang } from '@/lib/i18n'

export default async function LandingPage() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'bm') as Lang
  const t = translations[lang]

  const stats = [
    { value: '500+', label: t.stats.providers },
    { value: '1,200+', label: t.stats.customers },
    { value: '10', label: t.stats.ngos },
    { value: '4.8★', label: t.stats.rating },
  ]

  const serviceIcons = [HandHeart, ChefHat, BookOpen, Briefcase]
  const serviceColors = [
    'bg-indigo-50 text-indigo-600',
    'bg-rose-50 text-rose-500',
    'bg-amber-50 text-amber-600',
    'bg-purple-50 text-purple-600',
  ]
  const services = (['job', 'food', 'learning', 'business'] as const).map((type, i) => ({
    icon: serviceIcons[i],
    title: t.services[type].title,
    desc: t.services[type].desc,
    color: serviceColors[i],
    href: `/search?type=${type}`,
  }))

  const safetyIcons = [Shield, Star, Users, CheckCircle, Heart, Shield]
  const safety = t.safety.items.map((item, i) => ({ icon: safetyIcons[i], ...item }))

  const steps = t.howItWorks.steps.map((step, i) => ({
    n: String(i + 1).padStart(2, '0'),
    ...step,
  }))

  const testimonials = lang === 'en' ? [
    { name: 'Makcik Rohani, 68', role: 'Senior · Damansara', text: 'Used to feel lonely at home alone. Now Kak Siti visits at noon, cooks, chats. I feel valued.', rating: 5 },
    { name: 'Cik Amy, 42', role: 'Family · Singapore', text: 'Can work peacefully knowing dad has someone. Daily updates from Teman are very helpful. Prices are reasonable.', rating: 5 },
    { name: 'Kak Siti, 35', role: 'Single Mother · Puchong', text: 'RM1,200 income monthly working part-time. Can care for kids and earn money. Thank you Teman!', rating: 5 },
  ] : [
    { name: 'Makcik Rohani, 68', role: 'Warga Emas · Damansara', text: 'Sebelum ni sunyi duduk rumah sorang. Sekarang ada Kak Siti datang tengahari, masak, bercerita. Saya rasa dihargai.', rating: 5 },
    { name: 'Cik Amy, 42', role: 'Waris · Singapura', text: 'Boleh kerja dengan tenang tahu ayah ada orang jaga. Update harian dari Teman sangat membantu. Harga pun berpatutan.', rating: 5 },
    { name: 'Kak Siti, 35', role: 'Ibu Tunggal · Puchong', text: 'Pendapatan RM1,200 sebulan kerja separuh masa. Boleh jaga anak, boleh cari duit. Terima kasih Teman!', rating: 5 },
  ]

  const ctaCustomerFeatures = lang === 'en'
    ? ['Filter by location & skills', 'Real ratings & reviews', 'Secure escrow payment']
    : ['Tapis mengikut lokasi & kemahiran', 'Rating & ulasan sebenar', 'Bayaran selamat escrow']

  const ctaProviderFeatures = lang === 'en'
    ? ['Work schedule on your terms', 'Earn RM20–50 per hour', 'Community & NGO support']
    : ['Jadual kerja mengikut keselesaan anda', 'Pendapatan RM20–50 sejam', 'Sokongan komuniti & NGO']

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#0F0E17]">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1] flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-[#0F0E17]">SenioCare</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/search" className="hover:text-[#6366F1] transition-colors">{t.nav.search}</Link>
            <Link href="/about" className="hover:text-[#6366F1] transition-colors">{t.nav.about}</Link>
          </div>
          <div className="flex items-center gap-3">
            <LangToggle />
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-[#6366F1] transition-colors">
              {t.nav.login}
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-[#6366F1] text-white px-5 py-2 rounded-full hover:bg-[#4F46E5] transition-colors shadow-sm">
              {t.nav.register}
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO — dark */}
      <section className="relative bg-[#0F0E17] overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#6366F1]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#F43F5E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-64 h-64 bg-purple-900/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 pt-24 pb-20 md:pt-36 md:pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/8 backdrop-blur-sm text-white/70 text-xs font-medium px-4 py-2 rounded-full border border-white/10 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[#818CF8]" />
            {t.hero.badge}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
            {t.hero.title}{' '}
            <span className="bg-gradient-to-r from-[#818CF8] via-[#A78BFA] to-[#F43F5E] bg-clip-text text-transparent">
              {t.hero.titleHighlight}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/search"
              className="inline-flex items-center justify-center gap-2 bg-[#6366F1] text-white font-semibold px-8 py-4 rounded-full hover:bg-[#4F46E5] transition-all shadow-xl shadow-indigo-500/30 text-base">
              {t.hero.cta} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register?role=provider"
              className="inline-flex items-center justify-center gap-2 bg-white/8 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-full hover:bg-white/15 transition-all border border-white/15 text-base">
              {t.hero.ctaSub}
            </Link>
          </div>

          {/* Floating preview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { label: 'Rohani Ismail', sub: 'Chow Kit · RM35/jam', badge: '★ 4.9', badgeColor: 'bg-[#6366F1]' },
              {
                label: lang === 'en' ? 'Booking Confirmed' : 'Booking Disahkan',
                sub: lang === 'en' ? 'Friday, 9:00 AM' : 'Sesi Jumaat, 9:00 pagi',
                badge: '✓ Aktif',
                badgeColor: 'bg-emerald-500',
              },
              {
                label: lang === 'en' ? "This Month's Earnings" : 'Pendapatan Bulan Ini',
                sub: 'RM1,260',
                badge: '+18%',
                badgeColor: 'bg-[#F43F5E]',
              },
            ].map((c) => (
              <div key={c.label} className="bg-white/6 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-left">
                <span className={`${c.badgeColor} text-white text-xs font-semibold px-2.5 py-1 rounded-full inline-block mb-3`}>{c.badge}</span>
                <div className="text-white font-semibold text-sm">{c.label}</div>
                <div className="text-gray-400 text-xs mt-1">{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-[#6366F1]">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest text-[#6366F1] uppercase">{t.services.heading}</span>
            <p className="text-gray-500 max-w-lg mx-auto mt-2">{t.services.subheading}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((s) => (
              <Link key={s.title} href={s.href}
                className="group bg-white rounded-3xl p-7 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border border-gray-50">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${s.color}`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[#0F0E17] mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{s.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#6366F1] group-hover:gap-2 transition-all">
                  {t.nav.search} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PROVIDERS */}
      <FeaturedProviders lang={lang} />

      {/* HOW IT WORKS */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest text-[#6366F1] uppercase">{t.howItWorks.heading}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F0E17] mt-2">{t.howItWorks.subheading}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.7%+2.5rem)] right-[calc(16.7%+2.5rem)] h-px bg-gradient-to-r from-transparent via-[#6366F1]/40 to-transparent" />
            {steps.map((item) => (
              <div key={item.n} className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center text-2xl font-bold mb-5 ring-1 ring-[#C7D2FE]">
                  {item.n}
                </div>
                <h3 className="text-lg font-bold text-[#0F0E17] mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAFETY "" dark */}
      <section className="py-24 px-4 bg-[#0F0E17] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6366F1]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F43F5E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest text-[#818CF8] uppercase">{t.safety.heading}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-3">{t.safety.subheading}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {safety.map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/8 rounded-2xl p-5 flex gap-4 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#6366F1]/20 text-[#818CF8] flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1 text-sm">{item.title}</div>
                  <div className="text-sm text-gray-500 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest text-[#6366F1] uppercase">{t.testimonials.heading}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F0E17] mt-2">{t.testimonials.subheading}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400" fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6 flex-1 text-sm">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#F43F5E] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-[#0F0E17] text-sm">{testimonial.name}</div>
                    <div className="text-xs text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DUAL CTA */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F0E17] mb-3">{t.cta.heading}</h2>
            <p className="text-gray-500">{t.cta.subheading}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative bg-[#EEF2FF] rounded-3xl p-8 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#6366F1]/15 rounded-full blur-2xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-[#6366F1] flex items-center justify-center mb-5">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0F0E17] mb-2">{t.nav.search}</h3>
                <p className="text-gray-600 mb-5 text-sm leading-relaxed">
                  {lang === 'en'
                    ? 'Verified profiles, affordable rates, trusted caregivers for your loved ones.'
                    : 'Profil terverifikasi, harga berpatutan, penjaga dipercayai untuk orang tersayang anda.'}
                </p>
                <div className="space-y-2 mb-7">
                  {ctaCustomerFeatures.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-[#6366F1] flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/register?role=customer"
                  className="inline-flex items-center gap-2 bg-[#6366F1] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#4F46E5] transition-colors text-sm shadow-md shadow-indigo-200">
                  {lang === 'en' ? 'Register as Customer' : 'Daftar Sebagai Pelanggan'} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="relative bg-[#FFF1F2] rounded-3xl p-8 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F43F5E]/15 rounded-full blur-2xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-[#F43F5E] flex items-center justify-center mb-5">
                  <Heart className="w-6 h-6 text-white" fill="currentColor" />
                </div>
                <h3 className="text-xl font-bold text-[#0F0E17] mb-2">
                  {lang === 'en' ? 'Become a Companion' : 'Jadi Teman'}
                </h3>
                <p className="text-gray-600 mb-5 text-sm leading-relaxed">
                  {lang === 'en'
                    ? 'Single mothers "" turn your skills into meaningful, flexible income.'
                    : 'Ibu tunggal "" jadikan kemahiran anda sumber pendapatan yang bermakna dan fleksibel.'}
                </p>
                <div className="space-y-2 mb-7">
                  {ctaProviderFeatures.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-[#F43F5E] flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/register?role=provider"
                  className="inline-flex items-center gap-2 bg-[#F43F5E] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#E11D48] transition-colors text-sm shadow-md shadow-rose-200">
                  {t.cta.becomeTeman} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0F0E17] text-gray-500 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-white text-base">SenioCare</span>
          </div>
          <p className="text-gray-600 text-xs text-center">
            © 2026 SenioCare · {lang === 'en' ? 'Connecting hearts, nurturing love.' : 'Menghubungkan hati, memelihara kasih.'}
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white transition-colors">
              {lang === 'en' ? 'Privacy' : 'Privasi'}
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              {lang === 'en' ? 'Terms' : 'Terma'}
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              {lang === 'en' ? 'About' : 'Tentang'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
