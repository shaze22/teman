import Link from 'next/link'
import { Heart, Shield, Users, Target, ArrowRight } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-[#0F0E17]">Teman</span>
          </Link>
          <Link href="/search" className="text-sm font-semibold bg-[#6366F1] text-white px-4 py-2 rounded-full hover:bg-[#4F46E5] transition-colors">
            Cari Teman
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0F0E17] py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#6366F1]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Tentang Teman</h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Platform penjagaan warga emas yang menghubungkan ibu tunggal berbakti dengan keluarga yang memerlukan sokongan.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-16">

        {/* Mission */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#6366F1]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F0E17]">Misi Kami</h2>
          </div>
          <p className="text-gray-600 leading-relaxed text-lg">
            Teman ditubuhkan dengan satu matlamat: <strong>menghapuskan jurang antara ibu tunggal yang memerlukan pendapatan halal dan keluarga yang memerlukan penjagaan dipercayai untuk warga emas mereka.</strong>
          </p>
          <p className="text-gray-600 leading-relaxed">
            Malaysia ada lebih 300,000 ibu tunggal yang berjuang mencari pendapatan sambil menjaga anak-anak. Pada masa yang sama, ramai warga emas kita keseorangan di rumah, memerlukan teman dan sokongan harian.
            Teman hadir untuk menyambungkan dua kumpulan ini — dengan teknologi, kepercayaan, dan kasih sayang.
          </p>
        </div>

        {/* Values */}
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-[#0F0E17]">Nilai Teras</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Heart, title: 'Kasih Sayang', desc: 'Setiap interaksi dibina atas rasa peduli yang tulen terhadap warga emas dan keluarga mereka.', color: 'bg-rose-50 text-rose-500' },
              { icon: Shield, title: 'Keselamatan', desc: 'Semua Teman melalui pengesahan NGO dan semakan latar belakang sebelum boleh berkhidmat.', color: 'bg-[#EEF2FF] text-[#6366F1]' },
              { icon: Users, title: 'Komuniti', desc: 'Kami percaya kejayaan ibu tunggal memberi manfaat kepada seluruh masyarakat Malaysia.', color: 'bg-amber-50 text-amber-600' },
              { icon: Target, title: 'Impak', desc: 'Setiap booking yang berjaya bermakna satu keluarga lebih tenang dan satu ibu tunggal lebih sejahtera.', color: 'bg-emerald-50 text-emerald-600' },
            ].map(v => (
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
          <h2 className="text-2xl font-bold text-[#0F0E17]">Kisah Kami</h2>
          <p className="text-gray-600 leading-relaxed">
            Teman bermula daripada pemerhatian mudah — ibu kepada pengasas kami memerlukan teman selepas pembedahan, dan kami sedar betapa sukarnya untuk mencari seseorang yang boleh dipercayai, pada harga yang berpatutan, dalam masa yang singkat.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Pada masa yang sama, jiran kami, seorang ibu tunggal dengan dua anak, terpaksa bekerja tiga kerja part-time yang tidak menentu. Kami terfikir — bagaimana jika kami dapat menghubungkan mereka berdua?
          </p>
          <p className="text-gray-600 leading-relaxed">
            Itulah titik permulaan Teman. Hari ini, kami beroperasi di seluruh Lembah Klang dengan sokongan lebih 10 NGO rakan dan berharap dapat berkembang ke seluruh Malaysia.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#0F0E17] mb-3">Sertai Misi Kami</h2>
          <p className="text-gray-500 mb-6">Sama ada anda pelanggan, Teman, atau NGO — ada tempat untuk anda di sini.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register?role=customer" className="inline-flex items-center justify-center gap-2 bg-[#6366F1] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#4F46E5] transition-colors">
              Cari Teman <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register?role=provider" className="inline-flex items-center justify-center gap-2 border border-[#6366F1] text-[#6366F1] font-semibold px-6 py-3 rounded-full hover:bg-[#EEF2FF] transition-colors">
              Jadi Teman
            </Link>
          </div>
        </div>
      </div>

      <footer className="bg-[#0F0E17] text-gray-500 py-8 px-4 text-center text-sm">
        <p>© 2026 Teman Platform · Menghubungkan hati, memelihara kasih.</p>
      </footer>
    </div>
  )
}
