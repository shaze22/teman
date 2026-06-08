import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Heart, Shield, Globe, Target, ArrowRight } from 'lucide-react'
import { translations, type Lang } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'SenioCare was founded with one goal: ensure no senior in Malaysia has to eat alone. Learn about our mission and values.',
}

export default async function AboutPage() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'en') as Lang
  const a = translations[lang].about

  const values = [
    { icon: Heart, title: a.v1Title, desc: a.v1Desc, color: 'bg-rose-50 text-rose-500' },
    { icon: Shield, title: a.v2Title, desc: a.v2Desc, color: 'bg-[#EEF2FF] text-[#6366F1]' },
    { icon: Globe, title: a.v3Title, desc: a.v3Desc, color: 'bg-amber-50 text-amber-600' },
    { icon: Target, title: a.v4Title, desc: a.v4Desc, color: 'bg-emerald-50 text-emerald-600' },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-[#0F0E17]">SenioCare</span>
          </Link>
          <Link href="/search" className="text-sm font-semibold bg-[#6366F1] text-white px-4 py-2 rounded-full hover:bg-[#4F46E5] transition-colors">
            {a.cariTeman}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0F0E17] py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#6366F1]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{a.heroTitle}</h1>
          <p className="text-gray-400 text-lg leading-relaxed">{a.heroSubtitle}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-16">

        {/* Mission */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#6366F1]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F0E17]">{a.missionTitle}</h2>
          </div>
          <p className="text-gray-600 leading-relaxed text-lg">
            {a.missionP1Pre} <strong>{a.missionP1Strong}</strong>
          </p>
          <p className="text-gray-600 leading-relaxed">{a.missionP2}</p>
        </div>

        {/* Values */}
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-[#0F0E17]">{a.valuesTitle}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {values.map(v => (
              <div key={v.title} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${v.color}`}>
                  <v.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#0F0E17] mb-1">{v.title}</div>
                  <div className="text-sm text-gray-500 leading-relaxed">{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Story */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-4">
          <h2 className="text-2xl font-bold text-[#0F0E17]">{a.storyTitle}</h2>
          <p className="text-gray-600 leading-relaxed">{a.storyP1}</p>
          <p className="text-gray-600 leading-relaxed">{a.storyP2}</p>
          <p className="text-gray-600 leading-relaxed">{a.storyP3}</p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#0F0E17] mb-3">{a.ctaTitle}</h2>
          <p className="text-gray-500 mb-6">{a.ctaSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register?role=customer" className="inline-flex items-center justify-center gap-2 bg-[#6366F1] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#4F46E5] transition-colors">
              {a.ctaFind} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register/companion" className="inline-flex items-center justify-center gap-2 border border-[#6366F1] text-[#6366F1] font-semibold px-6 py-3 rounded-full hover:bg-[#EEF2FF] transition-colors">
              {a.ctaBecome}
            </Link>
          </div>
        </div>
      </div>

      <footer className="bg-[#0F0E17] text-gray-500 py-8 px-4 text-center text-sm">
        <p>{a.footer}</p>
      </footer>
    </div>
  )
}
