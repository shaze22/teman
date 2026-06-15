'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Heart, Search, Calendar, Star,
  UserCheck, Settings, Bell, Wallet,
  ChevronDown, ArrowRight, Shield, Zap,
  Stethoscope, CheckCircle, CreditCard, AlertCircle,
} from 'lucide-react'
import { useLang } from '@/lib/lang-context'

const ICONS: Record<string, React.ElementType> = {
  Search, Calendar, Star,
  UserCheck, Settings, Bell, Wallet,
}

export default function HowItWorksPage() {
  const { t, lang } = useLang()
  const h = t.hiw
  const [tab, setTab] = useState<'customer' | 'companion'>('customer')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const platformRules = lang === 'en' ? [
    {
      Icon: Stethoscope,
      color: 'bg-blue-50 text-blue-600',
      title: 'Professional credentials verified',
      desc: 'Locum providers (nurses, physiotherapists, care aides) must submit their professional registration number and certificate. Admin manually verifies before they can accept bookings.',
    },
    {
      Icon: CheckCircle,
      color: 'bg-teal-50 text-teal-600',
      title: 'IC verification for all providers',
      desc: 'Every provider — locum or companion — must pass Gemini AI IC + selfie face-match verification before going live on the platform.',
    },
    {
      Icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-600',
      title: 'Escrow payment protection',
      desc: 'Your payment is held in escrow. Funds are only released to the provider after the session is marked complete. If anything goes wrong, contact support within 24 hours.',
    },
    {
      Icon: AlertCircle,
      color: 'bg-amber-50 text-amber-600',
      title: 'No medical advice from platform',
      desc: 'SenioCare connects families with professional providers. Providers are independent contractors. The platform does not prescribe treatment or give medical advice. In an emergency, call 999.',
    },
  ] : [
    {
      Icon: Stethoscope,
      color: 'bg-blue-50 text-blue-600',
      title: 'Sijil profesional disahkan',
      desc: 'Provider locum (jururawat, fisioterapi, pembantu penjagaan) mesti hantar nombor pendaftaran profesional dan sijil. Admin sahkan secara manual sebelum mereka boleh terima booking.',
    },
    {
      Icon: CheckCircle,
      color: 'bg-teal-50 text-teal-600',
      title: 'Pengesahan IC untuk semua provider',
      desc: 'Setiap provider — locum atau companion — mesti lulus pengesahan IC + selfie Gemini AI sebelum profil mereka aktif di platform.',
    },
    {
      Icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-600',
      title: 'Perlindungan bayaran escrow',
      desc: 'Bayaran anda disimpan dalam escrow. Dana hanya dilepaskan kepada provider selepas sesi ditandakan selesai. Jika ada masalah, hubungi sokongan dalam 24 jam.',
    },
    {
      Icon: AlertCircle,
      color: 'bg-amber-50 text-amber-600',
      title: 'Platform tidak memberi nasihat perubatan',
      desc: 'SenioCare menghubungkan keluarga dengan provider profesional. Provider adalah kontraktor bebas. Platform tidak menetapkan rawatan atau memberi nasihat perubatan. Dalam kecemasan, hubungi 999.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-gray-900">SenioCare</span>
          </Link>
          <div className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-500">
            <Link href="/search" className="hover:text-teal-600 transition-colors">{t.nav.search}</Link>
            <Link href="/how-it-works" className="text-teal-600 font-semibold">{t.nav.howItWorks}</Link>
            <Link href="/about" className="hover:text-teal-600 transition-colors">{t.nav.about}</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors">
              {t.nav.login}
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700 transition-colors">
              {t.nav.register}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0F0E17] py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-teal-600/20 text-teal-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Zap className="w-3 h-3" />
            {lang === 'en' ? 'Simple & Transparent' : 'Mudah & Telus'}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{h.heroTitle}</h1>
          <p className="text-gray-400 text-lg">
            {lang === 'en'
              ? 'Simple for customers. Simple for providers.'
              : 'Mudah untuk pelanggan. Mudah untuk provider.'}
          </p>
        </div>
      </section>

      {/* Tab Toggle */}
      <div className="sticky top-14 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => setTab('customer')}
              className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors ${
                tab === 'customer'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {h.tabCustomer}
            </button>
            <button
              onClick={() => setTab('companion')}
              className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors ${
                tab === 'companion'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {lang === 'en' ? "I'm a Provider" : 'Saya Seorang Provider'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-16">

        {/* Customer Steps */}
        {tab === 'customer' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{h.customerTitle}</h2>
              <p className="text-gray-500 mt-1">
                {lang === 'en'
                  ? 'Book a locum professional or companion for your elderly loved one in minutes.'
                  : 'Tempah professional locum atau companion untuk warga emas anda dalam beberapa minit.'}
              </p>
            </div>
            <div className="space-y-4">
              {h.customerSteps.map((s, i) => {
                const Icon = ICONS[s.icon] ?? Search
                return (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 shadow-sm">
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-teal-600" />
                      </div>
                      {i < h.customerSteps.length - 1 && (
                        <div className="w-0.5 h-6 bg-gray-100 rounded" />
                      )}
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{s.step}</span>
                        <span className="font-semibold text-gray-900">{s.title}</span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="bg-teal-50 rounded-2xl p-5 flex gap-3">
              <Shield className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-teal-700 leading-relaxed">
                {lang === 'en'
                  ? 'Your payment is protected by escrow. Funds are automatically released to the provider once the session is marked complete — no extra step needed from you.'
                  : 'Bayaran anda dilindungi oleh escrow. Dana dilepaskan secara automatik kepada provider sebaik sesi ditandakan selesai — tiada langkah tambahan diperlukan daripada anda.'}
              </p>
            </div>
          </section>
        )}

        {/* Provider Steps */}
        {tab === 'companion' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {lang === 'en' ? 'For Locum Professionals & Companions' : 'Untuk Locum Profesional & Companion'}
              </h2>
              <p className="text-gray-500 mt-1">
                {lang === 'en'
                  ? 'Earn while helping Malaysian seniors. Flexible hours, verified clients.'
                  : 'Jana pendapatan sambil bantu warga emas Malaysia. Waktu fleksibel, pelanggan disahkan.'}
              </p>
            </div>
            <div className="space-y-4">
              {h.companionSteps.map((s, i) => {
                const Icon = ICONS[s.icon] ?? UserCheck
                return (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 shadow-sm">
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-emerald-600" />
                      </div>
                      {i < h.companionSteps.length - 1 && (
                        <div className="w-0.5 h-6 bg-gray-100 rounded" />
                      )}
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{s.step}</span>
                        <span className="font-semibold text-gray-900">{s.title}</span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="bg-emerald-50 rounded-2xl p-5 flex gap-3">
              <Zap className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700 leading-relaxed">
                {lang === 'en'
                  ? 'Companion verification takes under 5 minutes — Gemini AI checks your IC and selfie instantly. Locum professionals are reviewed within 1–3 business days after certificate upload.'
                  : 'Pengesahan companion mengambil masa kurang dari 5 minit — Gemini AI semak IC dan selfie anda serta-merta. Locum profesional disemak dalam 1–3 hari bekerja selepas muat naik sijil.'}
              </p>
            </div>
          </section>
        )}

        {/* Platform Rules */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {lang === 'en' ? 'Platform Rules' : 'Peraturan Platform'}
          </h2>
          <p className="text-gray-500 text-sm">
            {lang === 'en'
              ? 'These rules apply to every session to ensure safety, professionalism, and clarity for all parties.'
              : 'Peraturan ini terpakai pada setiap sesi untuk memastikan keselamatan, profesionalisme, dan kejelasan untuk semua pihak.'}
          </p>
          <div className="space-y-3">
            {platformRules.map((rule, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${rule.color}`}>
                  <rule.Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">{rule.title}</div>
                  <p className="text-sm text-gray-500 leading-relaxed">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">{h.faqTitle}</h2>
          <div className="space-y-2">
            {h.faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
                >
                  <span className="font-semibold text-gray-900 text-sm">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">{h.ctaTitle}</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/search" className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-teal-700 transition-colors">
              {h.ctaFind} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 border border-teal-600 text-teal-600 font-semibold px-6 py-3 rounded-full hover:bg-teal-50 transition-colors">
              {lang === 'en' ? 'Join as Provider' : 'Daftar sebagai Provider'}
            </Link>
          </div>
        </section>
      </div>

      <footer className="bg-[#0F0E17] text-gray-500 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center">
              <Heart className="w-3 h-3 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-white">SenioCare</span>
          </div>
          <p className="text-gray-600 text-xs">© 2026 SenioCare · {lang === 'en' ? 'Caring for Malaysia\'s seniors.' : 'Menjaga warga emas Malaysia.'}</p>
          <div className="flex gap-4 text-xs">
            <Link href="/search" className="hover:text-white transition-colors">{t.nav.search}</Link>
            <Link href="/about" className="hover:text-white transition-colors">{t.nav.about}</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">{lang === 'en' ? 'Privacy' : 'Privasi'}</Link>
            <Link href="/terms" className="hover:text-white transition-colors">{lang === 'en' ? 'Terms' : 'Terma'}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
