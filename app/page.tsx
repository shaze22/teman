import Link from 'next/link'
import {
  Heart, Shield, Star, Users, ChefHat, BookOpen,
  Briefcase, HandHeart, ArrowRight, CheckCircle, Sparkles,
} from 'lucide-react'

const stats = [
  { value: '500+', label: 'Ibu Tunggal Berdaftar' },
  { value: '1,200+', label: 'Warga Emas Gembira' },
  { value: '10', label: 'NGO Rakan' },
  { value: '4.8★', label: 'Purata Rating' },
]

const services = [
  { icon: HandHeart, title: 'Teman Kerja', desc: 'Bantuan rumah, jaga orang tua, teman ke klinik dan hospital.', color: 'bg-indigo-50 text-indigo-600', href: '/search?type=job' },
  { icon: ChefHat, title: 'Teman Makan', desc: 'Masak di rumah, hantar makanan, teman makan bersama.', color: 'bg-rose-50 text-rose-500', href: '/search?type=food' },
  { icon: BookOpen, title: 'Teman Belajar', desc: 'Belajar guna smartphone, WhatsApp, dan kemahiran digital.', color: 'bg-amber-50 text-amber-600', href: '/search?type=learning' },
  { icon: Briefcase, title: 'Teman Bisnes', desc: 'Produk ibu tunggal — kuih, jahitan, kraftangan tempahan.', color: 'bg-purple-50 text-purple-600', href: '/search?type=business' },
]

const steps = [
  { n: '01', title: 'Cari Teman', desc: 'Tapis mengikut lokasi, kemahiran & harga. Baca profil dan ulasan sebenar.' },
  { n: '02', title: 'Book & Bayar', desc: 'Pilih tarikh, isi keperluan, bayar dengan selamat dalam platform.' },
  { n: '03', title: 'Teman Hadir', desc: 'Check-in apabila sampai, hantar laporan harian. Orang tua gembira.' },
]

const safety = [
  { icon: Shield, title: 'Verified NGO', desc: 'Setiap Teman disahkan oleh NGO dan background check.' },
  { icon: Star, title: 'Rating & Ulasan', desc: 'Baca ulasan daripada pelanggan sebenar sebelum book.' },
  { icon: Users, title: 'Butang SOS', desc: 'Kecemasan real-time — lokasi dihantar serta-merta.' },
  { icon: CheckCircle, title: 'Escrow Payment', desc: 'Bayaran ditahan sehingga sesi selesai dengan jayanya.' },
  { icon: Heart, title: 'Pantau Waris', desc: 'Waris boleh pantau aktiviti, check-in dan laporan harian.' },
  { icon: Shield, title: 'PDPA Compliant', desc: 'Data dilindungi mengikut Akta Perlindungan Data Malaysia.' },
]

const testimonials = [
  { name: 'Makcik Rohani, 68', role: 'Warga Emas · Damansara', text: 'Sebelum ni sunyi duduk rumah sorang. Sekarang ada Kak Siti datang tengahari, masak, bercerita. Saya rasa dihargai.', rating: 5 },
  { name: 'Cik Amy, 42', role: 'Waris · Singapura', text: 'Boleh kerja dengan tenang tahu ayah ada orang jaga. Update harian dari Teman sangat membantu. Harga pun berpatutan.', rating: 5 },
  { name: 'Kak Siti, 35', role: 'Ibu Tunggal · Puchong', text: 'Pendapatan RM1,200 sebulan kerja separuh masa. Boleh jaga anak, boleh cari duit. Terima kasih Teman!', rating: 5 },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#0F0E17]">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1] flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-[#0F0E17]">Teman</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/search" className="hover:text-[#6366F1] transition-colors">Cari Teman</Link>
            <Link href="/about" className="hover:text-[#6366F1] transition-colors">Tentang Kami</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-[#6366F1] transition-colors">
              Log Masuk
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-[#6366F1] text-white px-5 py-2 rounded-full hover:bg-[#4F46E5] transition-colors shadow-sm">
              Daftar
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
            Platform penjagaan warga emas #1 Malaysia
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
            Teman Untuk{' '}
            <span className="bg-gradient-to-r from-[#818CF8] via-[#A78BFA] to-[#F43F5E] bg-clip-text text-transparent">
              Orang Tersayang
            </span>
            {' '}Anda
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Hubungkan ibu tunggal berbakti dengan warga emas yang memerlukan
            teman, penjagaan, dan sokongan harian — dengan selamat dan mudah.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/search"
              className="inline-flex items-center justify-center gap-2 bg-[#6366F1] text-white font-semibold px-8 py-4 rounded-full hover:bg-[#4F46E5] transition-all shadow-xl shadow-indigo-500/30 text-base">
              Cari Teman Sekarang <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register?role=provider"
              className="inline-flex items-center justify-center gap-2 bg-white/8 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-full hover:bg-white/15 transition-all border border-white/15 text-base">
              Jadi Teman, Dapat Pendapatan
            </Link>
          </div>

          {/* Floating preview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { label: 'Rohani Ismail', sub: 'Chow Kit · RM35/jam', badge: '★ 4.9', badgeColor: 'bg-[#6366F1]' },
              { label: 'Booking Disahkan', sub: 'Sesi Jumaat, 9:00 pagi', badge: '✓ Aktif', badgeColor: 'bg-emerald-500' },
              { label: 'Pendapatan Bulan Ini', sub: 'RM1,260 bersih', badge: '+18%', badgeColor: 'bg-[#F43F5E]' },
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
            <span className="text-xs font-semibold tracking-widest text-[#6366F1] uppercase">Perkhidmatan</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F0E17] mt-2 mb-3">4 Cara Teman Boleh Bantu</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Pilih perkhidmatan mengikut keperluan warga emas anda</p>
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
                  Cari Teman <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest text-[#6366F1] uppercase">Cara Kerja</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F0E17] mt-2">3 Langkah Sahaja</h2>
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

      {/* SAFETY — dark */}
      <section className="py-24 px-4 bg-[#0F0E17] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6366F1]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F43F5E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest text-[#818CF8] uppercase">Keselamatan</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-3">Selamat & Dipercayai</h2>
            <p className="text-gray-500">Keselamatan anda adalah keutamaan kami</p>
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
            <span className="text-xs font-semibold tracking-widest text-[#6366F1] uppercase">Testimoni</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F0E17] mt-2">Apa Kata Mereka</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400" fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6 flex-1 text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#F43F5E] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-[#0F0E17] text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
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
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F0E17] mb-3">Mula Sekarang</h2>
            <p className="text-gray-500">Daftar percuma. Tiada komisen sehingga booking pertama selesai.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative bg-[#EEF2FF] rounded-3xl p-8 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#6366F1]/15 rounded-full blur-2xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-[#6366F1] flex items-center justify-center mb-5">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0F0E17] mb-2">Cari Teman</h3>
                <p className="text-gray-600 mb-5 text-sm leading-relaxed">Profil terverifikasi, harga berpatutan, penjaga dipercayai untuk orang tersayang anda.</p>
                <div className="space-y-2 mb-7">
                  {['Tapis mengikut lokasi & kemahiran', 'Rating & ulasan sebenar', 'Bayaran selamat escrow'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-[#6366F1] flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/register?role=customer"
                  className="inline-flex items-center gap-2 bg-[#6366F1] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#4F46E5] transition-colors text-sm shadow-md shadow-indigo-200">
                  Daftar Sebagai Pelanggan <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="relative bg-[#FFF1F2] rounded-3xl p-8 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F43F5E]/15 rounded-full blur-2xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-[#F43F5E] flex items-center justify-center mb-5">
                  <Heart className="w-6 h-6 text-white" fill="currentColor" />
                </div>
                <h3 className="text-xl font-bold text-[#0F0E17] mb-2">Jadi Teman</h3>
                <p className="text-gray-600 mb-5 text-sm leading-relaxed">Ibu tunggal — jadikan kemahiran anda sumber pendapatan yang bermakna dan fleksibel.</p>
                <div className="space-y-2 mb-7">
                  {['Jadual kerja mengikut keselesaan anda', 'Pendapatan RM20–50 sejam', 'Sokongan komuniti & NGO'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-[#F43F5E] flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/register?role=provider"
                  className="inline-flex items-center gap-2 bg-[#F43F5E] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#E11D48] transition-colors text-sm shadow-md shadow-rose-200">
                  Daftar Sebagai Teman <ArrowRight className="w-4 h-4" />
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
            <span className="font-bold text-white text-base">Teman</span>
          </div>
          <p className="text-gray-600 text-xs text-center">© 2026 Teman Platform · Menghubungkan hati, memelihara kasih.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white transition-colors">Privasi</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terma</Link>
            <Link href="/about" className="hover:text-white transition-colors">Tentang</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
