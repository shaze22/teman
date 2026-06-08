import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  Heart, Shield, Star, Users, ChefHat,
  HandHeart, ArrowRight, CheckCircle, Sparkles, Clock,
} from 'lucide-react'
import FeaturedProviders from './_featured-providers'
import LangToggle from './_lang-toggle'
import { translations, type Lang } from '@/lib/i18n'
import { SERVICE_TYPES } from '@/lib/services'

export default async function LandingPage() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'en') as Lang
  const t = translations[lang]

  const stats = [
    { value: '50+', label: t.stats.providers },
    { value: '200+', label: t.stats.customers },
    { value: '8', label: t.stats.ngos },
    { value: '4.8★', label: t.stats.rating },
  ]

  const comingSoonLabel = lang === 'en' ? 'Coming Soon' : 'Segera Hadir'

  const safetyIcons = [Shield, Star, Users, CheckCircle, Heart, Shield]
  const safety = t.safety.items.map((item, i) => ({ icon: safetyIcons[i], ...item }))

  const steps = t.howItWorks.steps.map((step, i) => ({
    n: String(i + 1).padStart(2, '0'),
    ...step,
  }))

  const testimonials = lang === 'en' ? [
    { name: 'Makcik Rohani, 68', role: 'Senior · Damansara', text: 'Used to eat alone every day. Now Kak Siti takes me out for lunch we dine together and chat. I feel so much more valued.', rating: 5 },
    { name: 'Cik Amy, 42', role: 'Family · Singapore', text: 'Can work peacefully knowing Dad has someone to dine with. SenioCare is affordable and the companion is so caring.', rating: 5 },
    { name: 'Kak Siti, 35', role: 'Meal Companion · Puchong', text: 'RM1,200 income monthly doing something I love dining with and chatting with seniors. Flexible hours too!', rating: 5 },
  ] : [
    { name: 'Makcik Rohani, 68', role: 'Warga Emas · Damansara', text: 'Dulu makan sorang-sorang setiap hari. Sekarang ada Kak Siti teman makan tengahari, berbual dan ketawa bersama. Rasa dihargai!', rating: 5 },
    { name: 'Cik Amy, 42', role: 'Waris · Singapura', text: 'Boleh kerja dengan tenang tahu ayah ada teman. SenioCare harga berpatutan dan Meal Companion sangat penyayang.', rating: 5 },
    { name: 'Kak Siti, 35', role: 'Meal Companion · Puchong', text: 'Pendapatan RM1,200 sebulan buat benda yang saya suka teman warga emas makan dan berbual. Masa pun fleksibel!', rating: 5 },
  ]

  const ctaCustomerFeatures = lang === 'en'
    ? ['Filter by location & availability', 'Real ratings & reviews', 'Secure escrow payment']
    : ['Tapis mengikut lokasi & ketersediaan', 'Rating & ulasan sebenar', 'Bayaran selamat escrow']

  const ctaProviderFeatures = lang === 'en'
    ? ['Work schedule on your terms', 'Earn RM30–80 per session', 'Open to all Malaysians 18+']
    : ['Jadual kerja mengikut keselesaan anda', 'Pendapatan RM30–80 per sesi', 'Terbuka untuk semua warganegara 18+']

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
            <Link href="/how-it-works" className="hover:text-[#6366F1] transition-colors">{t.nav.howItWorks}</Link>
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

      {/* HERO dark */}
      <section className="relative bg-[#0F0E17] overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#6366F1]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#F43F5E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-64 h-64 bg-purple-900/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-14 md:pt-36 md:pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/8 backdrop-blur-sm text-white/70 text-xs font-medium px-4 py-2 rounded-full border border-white/10 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[#818CF8]" />
            {t.hero.badge}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-5">
            {t.hero.title}{' '}
            <span className="bg-gradient-to-r from-[#818CF8] via-[#A78BFA] to-[#F43F5E] bg-clip-text text-transparent">
              {t.hero.titleHighlight}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col items-center gap-4 justify-center mb-16">
            <Link href="/search"
              className="inline-flex items-center justify-center gap-2 bg-[#6366F1] text-white font-semibold px-10 py-4 rounded-full hover:bg-[#4F46E5] transition-all shadow-xl shadow-indigo-500/30 text-base">
              {t.hero.cta} <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/register/companion"
                className="text-white/60 hover:text-white/90 transition-colors underline underline-offset-4">
                {t.hero.ctaSub}
              </Link>
              <span className="text-white/20">·</span>
              <Link href="/login"
                className="text-white/60 hover:text-white/90 transition-colors">
                {lang === 'en' ? 'Log In' : 'Log Masuk'} →
              </Link>
            </div>
          </div>

          {/* Floating preview cards */}
          <div className="flex gap-3 overflow-x-auto sm:grid sm:grid-cols-3 sm:overflow-visible max-w-2xl mx-auto pb-1 snap-x snap-mandatory scrollbar-none">
            {[
              {
                label: 'Kak Siti',
                sub: lang === 'en' ? 'Puchong · RM30/session' : 'Puchong · RM30/sesi',
                badge: '★ 4.9',
                badgeColor: 'bg-[#6366F1]',
              },
              {
                label: lang === 'en' ? 'Meal Session Today' : 'Sesi Makan Hari Ini',
                sub: lang === 'en' ? 'Lunch · 12:00 PM' : 'Tengahari · 12:00 tgh',
                badge: '✓',
                badgeColor: 'bg-emerald-500',
              },
              {
                label: lang === 'en' ? 'Makcik Rohani says:' : 'Makcik Rohani kata:',
                sub: lang === 'en' ? '"Finally, not eating alone"' : '"Tak makan sorang lagi"',
                badge: '❤',
                badgeColor: 'bg-[#F43F5E]',
              },
            ].map((c) => (
              <div key={c.label} className="bg-white/6 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-left flex-shrink-0 w-[70vw] sm:w-auto snap-start">
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
      <section className="py-14 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-14">
            <span className="text-xs font-semibold tracking-widest text-[#6366F1] uppercase">{t.services.heading}</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0F0E17] mt-2 mb-2">
              {lang === 'en' ? 'Starting with' : 'Bermula dengan'}{' '}
              <span className="text-[#6366F1]">Meal Companion</span>
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">{t.services.subheading}</p>
          </div>
          {/* Featured active service Meal Companion */}
          <Link href="/search?type=food"
            className="group block bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-3xl p-5 md:p-7 border-2 border-[#6366F1]/40 hover:border-[#6366F1] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-[#6366F1] flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                  <ChefHat className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-[#0F0E17]">Meal Companion</h3>
                    <span className="text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-full font-semibold">
                      {lang === 'en' ? '✓ Available Now' : '✓ Aktif Sekarang'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed max-w-lg">
                    {lang === 'en'
                      ? 'A friendly companion who dines with your senior at restaurants, cafes, or any favourite spot. No more eating alone.'
                      : 'Teman yang menemani warga emas semasa makan di restoran, kafe, atau tempat kegemaran mereka. Tak makan sorang lagi.'}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 bg-[#6366F1] text-white font-semibold px-6 py-3 rounded-full group-hover:bg-[#4F46E5] transition-colors text-sm flex-shrink-0 shadow-md shadow-indigo-200">
                {lang === 'en' ? 'Find Now' : 'Cari Sekarang'} <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

        </div>
      </section>

      {/* FEATURED PROVIDERS */}
      <FeaturedProviders lang={lang} />

      {/* HOW IT WORKS */}
      <section className="py-14 md:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-14">
            <span className="text-xs font-semibold tracking-widest text-[#6366F1] uppercase">{t.howItWorks.heading}</span>
            <h2 className="text-2xl md:text-4xl font-bold text-[#0F0E17] mt-2">{t.howItWorks.subheading}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-10 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.7%+2.5rem)] right-[calc(16.7%+2.5rem)] h-px bg-gradient-to-r from-transparent via-[#6366F1]/40 to-transparent" />
            {steps.map((item) => (
              <div key={item.n} className="flex md:flex-col items-start md:items-center gap-4 md:gap-0 text-left md:text-center">
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center text-xl md:text-2xl font-bold md:mb-5 ring-1 ring-[#C7D2FE] flex-shrink-0">
                  {item.n}
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-[#0F0E17] mb-1 md:mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAFETY "" dark */}
      <section className="py-14 md:py-24 px-4 bg-[#0F0E17] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6366F1]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F43F5E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest text-[#818CF8] uppercase">{t.safety.heading}</span>
            <h2 className="text-2xl md:text-4xl font-bold text-white mt-2 mb-3">{t.safety.subheading}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <h2 className="text-2xl md:text-4xl font-bold text-[#0F0E17] mt-2">{t.testimonials.subheading}</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto md:grid md:grid-cols-3 md:overflow-visible pb-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="bg-white rounded-3xl p-5 md:p-7 shadow-sm border border-gray-100 flex flex-col flex-shrink-0 w-[80vw] md:w-auto snap-start">
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
      <section className="py-14 md:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-bold text-[#0F0E17] mb-3">{t.cta.heading}</h2>
            <p className="text-gray-500">{t.cta.subheading}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative bg-[#EEF2FF] rounded-3xl p-6 md:p-8 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#6366F1]/15 rounded-full blur-2xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-[#6366F1] flex items-center justify-center mb-5">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0F0E17] mb-2">
                  {lang === 'en' ? 'Find a Meal Companion' : 'Cari Meal Companion'}
                </h3>
                <p className="text-gray-600 mb-5 text-sm leading-relaxed">
                  {lang === 'en'
                    ? 'Verified companions who dine with your loved one and bring warmth to every shared meal.'
                    : 'Meal Companion terverifikasi yang teman warga emas makan bersama mesra, boleh dipercayai, dan membawa semangat.'}
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

            <div className="relative bg-[#FFF1F2] rounded-3xl p-6 md:p-8 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F43F5E]/15 rounded-full blur-2xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-[#F43F5E] flex items-center justify-center mb-5">
                  <Heart className="w-6 h-6 text-white" fill="currentColor" />
                </div>
                <h3 className="text-xl font-bold text-[#0F0E17] mb-2">
                  {lang === 'en' ? 'Become a Meal Companion' : 'Jadi Meal Companion'}
                </h3>
                <p className="text-gray-600 mb-5 text-sm leading-relaxed">
                  {lang === 'en'
                    ? 'Malaysian 18+ turn your love for dining & companionship into flexible income.'
                    : 'Warganegara Malaysia 18+ jadikan minat menemani warga emas makan bersama sumber pendapatan fleksibel.'}
                </p>
                <div className="space-y-2 mb-7">
                  {ctaProviderFeatures.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-[#F43F5E] flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/register/companion"
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
            <Link href="/how-it-works" className="hover:text-white transition-colors">
              {lang === 'en' ? 'How It Works' : 'Cara Guna'}
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
