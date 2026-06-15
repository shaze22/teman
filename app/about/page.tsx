import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Heart, Shield, Globe, Target, ArrowRight, Stethoscope } from 'lucide-react'
import type { Lang } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Tentang Kami | SenioCare',
  description: 'SenioCare menghubungkan warga emas Malaysia dengan jururawat berlesen, fisioterapi bertauliah & companion terlatih. Platform penjagaan profesional yang dipercayai.',
}

export default async function AboutPage() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'en') as Lang
  const en = lang === 'en'

  const values = [
    {
      icon: Heart,
      title: en ? 'Compassionate Care' : 'Penjagaan Penuh Kasih',
      desc: en
        ? 'Every senior deserves dignified, professional, and caring support — in the comfort of their own home.'
        : 'Setiap warga emas layak mendapat sokongan yang bermakna, profesional, dan penuh kasih sayang — di rumah mereka sendiri.',
      color: 'bg-rose-50 text-rose-500',
    },
    {
      icon: Shield,
      title: en ? 'Trust & Verification' : 'Kepercayaan & Pengesahan',
      desc: en
        ? 'Every provider is ID-verified. Locum professionals hold verified LJM, LFM, or IHRAM credentials. Nothing less.'
        : 'Setiap provider disahkan IC. Locum profesional memegang kelayakan LJM, LFM, atau IHRAM yang disahkan. Tiada pengecualian.',
      color: 'bg-teal-50 text-teal-600',
    },
    {
      icon: Globe,
      title: en ? 'Inclusive Access' : 'Akses Inklusif',
      desc: en
        ? 'Open to all Malaysian seniors and families, regardless of ethnicity, religion, or background. Multilingual support.'
        : 'Terbuka untuk semua warga emas dan keluarga Malaysia, tanpa mengira bangsa, agama, atau latar belakang. Sokongan berbilang bahasa.',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      icon: Target,
      title: en ? 'Professional Standards' : 'Piawaian Profesional',
      desc: en
        ? 'We hold our providers to healthcare-grade standards — verified credentials, escrow payments, and clear service boundaries.'
        : 'Kami mengekalkan standard tahap penjagaan kesihatan — kelayakan disahkan, bayaran escrow, dan skop perkhidmatan yang jelas.',
      color: 'bg-emerald-50 text-emerald-600',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-gray-900">SenioCare</span>
          </Link>
          <Link href="/search" className="text-sm font-semibold bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700 transition-colors">
            {en ? 'Find a Provider' : 'Cari Provider'}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0F0E17] py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {en ? 'About SenioCare' : 'Tentang SenioCare'}
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            {en
              ? 'A professional care platform connecting Malaysian families with licensed nurses, physiotherapists, and trained companions for their elderly loved ones.'
              : 'Platform penjagaan profesional yang menghubungkan keluarga Malaysia dengan jururawat berlesen, fisioterapi bertauliah, dan companion terlatih untuk warga emas mereka.'}
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-16">

        {/* Mission */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {en ? 'Our Mission' : 'Misi Kami'}
            </h2>
          </div>
          <p className="text-gray-700 leading-relaxed text-lg">
            {en
              ? <>SenioCare was built with one goal: <strong>to ensure every senior in Malaysia receives dignified, professional care at home.</strong></>
              : <>SenioCare dibina dengan satu matlamat: <strong>memastikan setiap warga emas di Malaysia menerima penjagaan yang bermakna dan profesional di rumah.</strong></>
            }
          </p>
          <p className="text-gray-600 leading-relaxed">
            {en
              ? "Malaysia's elderly population is growing rapidly, yet access to quality home care remains fragmented and expensive. Children live far away, working long hours. Hiring a full-time nurse or caregiver is out of reach for many families. SenioCare solves this by creating a trusted marketplace — where professional locum providers and trained companions can be booked on-demand, for as long as needed."
              : 'Populasi warga emas Malaysia berkembang pesat, namun akses kepada penjagaan rumah yang berkualiti masih berpecah-belah dan mahal. Anak-anak tinggal jauh, bekerja waktu panjang. Mengambil jururawat atau pengasuh sepenuh masa di luar kemampuan kebanyakan keluarga. SenioCare menyelesaikan masalah ini dengan mewujudkan pasaran yang dipercayai — di mana provider locum profesional dan companion terlatih boleh ditempah atas permintaan, selama yang diperlukan.'}
          </p>
        </div>

        {/* Services */}
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-gray-900">
            {en ? 'What We Offer' : 'Apa yang Kami Tawarkan'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '🩺', title: en ? 'Locum Nurse' : 'Jururawat Berlesen', desc: en ? 'Home nursing care by LJM-registered nurses' : 'Penjagaan jururawat di rumah oleh jururawat berdaftar LJM' },
              { icon: '🦾', title: en ? 'Physiotherapy' : 'Fisioterapi', desc: en ? 'Home physio sessions by LFM-registered therapists' : 'Sesi fisio di rumah oleh terapis berdaftar LFM' },
              { icon: '🏠', title: en ? 'Home Care Aide' : 'Pembantu Penjagaan', desc: en ? 'Certified daily care and assistance' : 'Penjagaan harian bersijil dan bantuan' },
              { icon: '🚗', title: en ? 'Medical Escort' : 'Pendamping Perubatan', desc: en ? 'Safe accompaniment to hospital and clinic visits' : 'Pendampingan selamat ke hospital dan klinik' },
              { icon: '🏃', title: en ? 'Riadah Companion' : 'Companion Riadah', desc: en ? 'Wellness walks and light exercise for seniors' : 'Berjalan dan senaman ringan untuk warga emas' },
              { icon: '🍽️', title: en ? 'Dining Companion' : 'Companion Makan', desc: en ? 'Warm company over meals at restaurants or home' : 'Teman yang mesra semasa makan di restoran atau rumah' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3">
                <span className="text-2xl flex-shrink-0">{s.icon}</span>
                <div>
                  <div className="font-semibold text-gray-900 text-sm mb-0.5">{s.title}</div>
                  <div className="text-xs text-gray-500">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-gray-900">
            {en ? 'Our Values' : 'Nilai Kami'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {values.map(v => (
              <div key={v.title} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${v.color}`}>
                  <v.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">{v.title}</div>
                  <div className="text-sm text-gray-500 leading-relaxed">{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Story */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Stethoscope className="w-6 h-6 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {en ? 'Our Story' : 'Kisah Kami'}
            </h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            {en
              ? "SenioCare started as a simple idea: what if booking professional home care for your elderly parent was as easy as booking a ride? No agencies, no long-term contracts, no hidden fees — just verified professionals available when you need them."
              : 'SenioCare bermula sebagai idea mudah: bagaimana jika menempah penjagaan rumah profesional untuk ibu bapa warga emas anda semudah menempah perkhidmatan pengangkutan? Tanpa agensi, tanpa kontrak jangka panjang, tanpa fi tersembunyi — hanya profesional yang disahkan tersedia bila anda memerlukannya.'}
          </p>
          <p className="text-gray-600 leading-relaxed">
            {en
              ? "We started by connecting families with companion services, and quickly realized the deeper need: access to qualified healthcare professionals at home. So we pivoted to build a full marketplace — from licensed nurses and physiotherapists to companions for wellness, worship, and dining."
              : 'Kami bermula dengan menghubungkan keluarga dengan perkhidmatan companion, dan cepat menyedari keperluan yang lebih mendalam: akses kepada profesional penjagaan kesihatan yang berkelayakan di rumah. Jadi kami membina pasaran penuh — dari jururawat berlesen dan fisioterapi kepada companion untuk riadah, ibadah, dan makan.'}
          </p>
          <p className="text-gray-600 leading-relaxed">
            {en
              ? "Today, SenioCare is committed to becoming the most trusted home care platform in Malaysia — where every provider is verified, every booking is protected, and every senior feels cared for."
              : 'Hari ini, SenioCare komited untuk menjadi platform penjagaan rumah yang paling dipercayai di Malaysia — di mana setiap provider disahkan, setiap booking dilindungi, dan setiap warga emas berasa dijaga.'}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
          <p className="font-semibold mb-1">
            {en ? 'Medical Disclaimer' : 'Penafian Perubatan'}
          </p>
          <p>
            {en
              ? 'SenioCare is a booking platform only. We do not provide medical advice or treatment. All providers are independent contractors. In a medical emergency, call 999 immediately.'
              : 'SenioCare adalah platform tempahan sahaja. Kami tidak memberi nasihat perubatan atau rawatan. Semua provider adalah kontraktor bebas. Dalam kecemasan perubatan, hubungi 999 segera.'}
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {en ? 'Ready to Get Started?' : 'Bersedia untuk Mulakan?'}
          </h2>
          <p className="text-gray-500 mb-6">
            {en
              ? 'Book a verified provider today or join our growing network of professionals.'
              : 'Tempah provider yang disahkan hari ini atau sertai rangkaian profesional kami yang semakin berkembang.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register?role=customer" className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-teal-700 transition-colors">
              {en ? 'Book a Provider' : 'Tempah Provider'} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 border border-teal-600 text-teal-600 font-semibold px-6 py-3 rounded-full hover:bg-teal-50 transition-colors">
              {en ? 'Join as Provider' : 'Daftar sebagai Provider'}
            </Link>
          </div>
        </div>
      </div>

      <footer className="bg-[#0F0E17] text-gray-500 py-8 px-4 text-center text-sm">
        <p>© 2026 SenioCare · {en ? 'Caring for Malaysia\'s seniors, professionally.' : 'Menjaga warga emas Malaysia secara profesional.'}</p>
      </footer>
    </div>
  )
}
