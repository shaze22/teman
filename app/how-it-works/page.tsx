'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Heart, Search, Calendar, UtensilsCrossed, Star,
  UserCheck, Settings, Bell, MapPin, Wallet,
  ChevronDown, ArrowRight, Shield, Zap,
} from 'lucide-react'
import { useLang } from '@/lib/lang-context'

const ICONS: Record<string, React.ElementType> = {
  Search, Calendar, UtensilsCrossed, Star,
  UserCheck, Settings, Bell, MapPin, Wallet,
}

export default function HowItWorksPage() {
  const { t, lang } = useLang()
  const h = t.hiw
  const [tab, setTab] = useState<'customer' | 'companion'>('customer')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-[#0F0E17]">SenioCare</span>
          </Link>
          <div className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-500">
            <Link href="/search" className="hover:text-[#6366F1] transition-colors">{t.nav.search}</Link>
            <Link href="/how-it-works" className="text-[#6366F1] font-semibold">{t.nav.howItWorks}</Link>
            <Link href="/about" className="hover:text-[#6366F1] transition-colors">{t.nav.about}</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-[#6366F1] transition-colors">
              {t.nav.login}
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-[#6366F1] text-white px-4 py-2 rounded-full hover:bg-[#4F46E5] transition-colors">
              {t.nav.register}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0F0E17] py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#6366F1]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#F43F5E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#6366F1]/20 text-[#A5B4FC] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Zap className="w-3 h-3" />
            {lang === 'en' ? 'Simple & Transparent' : 'Mudah & Telus'}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{h.heroTitle}</h1>
          <p className="text-gray-400 text-lg">{h.heroSubtitle}</p>
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
                  ? 'border-[#6366F1] text-[#6366F1]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {h.tabCustomer}
            </button>
            <button
              onClick={() => setTab('companion')}
              className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors ${
                tab === 'companion'
                  ? 'border-[#F43F5E] text-[#F43F5E]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {h.tabCompanion}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-16">

        {/* Customer Steps */}
        {tab === 'customer' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F0E17]">{h.customerTitle}</h2>
              <p className="text-gray-500 mt-1">{h.customerSubtitle}</p>
            </div>
            <div className="space-y-4">
              {h.customerSteps.map((s, i) => {
                const Icon = ICONS[s.icon] ?? Search
                return (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 shadow-sm">
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#6366F1]" />
                      </div>
                      {i < h.customerSteps.length - 1 && (
                        <div className="w-0.5 h-6 bg-gray-100 rounded" />
                      )}
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#6366F1] bg-[#EEF2FF] px-2 py-0.5 rounded-full">{s.step}</span>
                        <span className="font-semibold text-[#0F0E17]">{s.title}</span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="bg-[#EEF2FF] rounded-2xl p-5 flex gap-3">
              <Shield className="w-5 h-5 text-[#6366F1] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#4F46E5] leading-relaxed">
                {lang === 'en'
                  ? 'Your payment is protected by escrow. Funds are automatically released to the companion once the session is marked complete no extra step needed from you.'
                  : 'Bayaran anda dilindungi oleh escrow. Dana dilepaskan secara automatik kepada companion sebaik sesi ditandakan selesai tiada langkah tambahan diperlukan daripada anda.'}
              </p>
            </div>
          </section>
        )}

        {/* Companion Steps */}
        {tab === 'companion' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F0E17]">{h.companionTitle}</h2>
              <p className="text-gray-500 mt-1">{h.companionSubtitle}</p>
            </div>
            <div className="space-y-4">
              {h.companionSteps.map((s, i) => {
                const Icon = ICONS[s.icon] ?? UserCheck
                return (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 shadow-sm">
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#F43F5E]" />
                      </div>
                      {i < h.companionSteps.length - 1 && (
                        <div className="w-0.5 h-6 bg-gray-100 rounded" />
                      )}
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#F43F5E] bg-rose-50 px-2 py-0.5 rounded-full">{s.step}</span>
                        <span className="font-semibold text-[#0F0E17]">{s.title}</span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="bg-rose-50 rounded-2xl p-5 flex gap-3">
              <Zap className="w-5 h-5 text-[#F43F5E] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#F43F5E] leading-relaxed">
                {lang === 'en'
                  ? 'Verification takes under 5 minutes. Gemini AI checks your IC and selfie instantly no waiting for manual approval.'
                  : 'Pengesahan mengambil masa kurang dari 5 minit. Gemini AI semak IC dan selfie anda serta-merta tiada perlu tunggu kelulusan manual.'}
              </p>
            </div>
          </section>
        )}

        {/* Platform Rules */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0F0E17]">
            {lang === 'en' ? 'Platform Rules' : 'Peraturan Platform'}
          </h2>
          <p className="text-gray-500 text-sm">
            {lang === 'en'
              ? 'These rules apply to every session to ensure safety, dignity, and clarity for all parties.'
              : 'Peraturan ini terpakai pada setiap sesi untuk memastikan keselamatan, maruah, dan kejelasan untuk semua pihak.'}
          </p>
          <div className="space-y-3">
            {[
              {
                icon: '🍽️',
                title: lang === 'en' ? 'Companion must dine together' : 'Companion wajib makan bersama',
                desc: lang === 'en'
                  ? 'The Meal Companion must eat at the same table during the session not watch, not assist feeding. This is genuine companionship over a shared meal.'
                  : 'Meal Companion WAJIB makan di meja yang sama semasa sesi bukan sekadar teman melihat atau suapkan pelanggan makan. Ini adalah teman makan yang sebenar.',
              },
              {
                icon: '💳',
                title: lang === 'en' ? 'Customer covers companion\'s meal' : 'Pelanggan tanggung makan companion',
                desc: lang === 'en'
                  ? 'The companion\'s meal cost is paid directly by the customer at the restaurant. It is not included in the booking fee the booking fee covers the companion\'s time only.'
                  : 'Kos makan Companion dibayar terus oleh pelanggan di restoran. Ia tidak termasuk dalam booking fee booking fee hanya untuk masa companion.',
              },
              {
                icon: '🏪',
                title: lang === 'en' ? 'Table-service restaurants only' : 'Restoran berkhidmat waiter sahaja',
                desc: lang === 'en'
                  ? 'Sessions must be held at restaurants where a waiter takes orders at the table and serves food to the table. Buffets, nasi campur (self-serve), and fast food counters are not suitable.'
                  : 'Sesi MESTI diadakan di restoran yang mempunyai waiter yang ambil order di meja dan hidang ke meja. Buffet, nasi campur (ambil sendiri), dan kaunter fast food tidak sesuai.',
              },
              {
                icon: '🚫',
                title: lang === 'en' ? 'No other services during session' : 'Tiada perkhidmatan lain semasa sesi',
                desc: lang === 'en'
                  ? 'The Meal Companion\'s role is companionship only. No personal errands, no care tasks, no activities outside the restaurant during the booked session.'
                  : 'Peranan Meal Companion adalah teman makan sahaja. Tiada urusan peribadi, tiada tugas penjagaan, tiada aktiviti luar restoran semasa sesi yang ditempah.',
              },
            ].map((rule, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 shadow-sm">
                <div className="text-2xl flex-shrink-0">{rule.icon}</div>
                <div>
                  <div className="font-semibold text-[#0F0E17] mb-1">{rule.title}</div>
                  <p className="text-sm text-gray-500 leading-relaxed">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0F0E17]">{h.faqTitle}</h2>
          <div className="space-y-2">
            {h.faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
                >
                  <span className="font-semibold text-[#0F0E17] text-sm">{faq.q}</span>
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
          <h2 className="text-2xl font-bold text-[#0F0E17]">{h.ctaTitle}</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/search" className="inline-flex items-center justify-center gap-2 bg-[#6366F1] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#4F46E5] transition-colors">
              {h.ctaFind} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register/companion" className="inline-flex items-center justify-center gap-2 border border-[#F43F5E] text-[#F43F5E] font-semibold px-6 py-3 rounded-full hover:bg-rose-50 transition-colors">
              {h.ctaBecome}
            </Link>
          </div>
        </section>
      </div>

      <footer className="bg-[#0F0E17] text-gray-500 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#6366F1] flex items-center justify-center">
              <Heart className="w-3 h-3 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-white">SenioCare</span>
          </div>
          <p className="text-gray-600 text-xs">© 2026 SenioCare · {lang === 'en' ? 'Connecting hearts, nurturing love.' : 'Menghubungkan hati, memelihara kasih.'}</p>
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
