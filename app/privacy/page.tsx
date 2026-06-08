import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'SenioCare Privacy Policy — how we collect, use, and protect your personal data in compliance with Malaysia\'s PDPA.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-[#0F0E17]">SenioCare</span>
          </Link>
          <span className="text-gray-400 text-sm">/ Dasar Privasi</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-[#0F0E17] mb-2">Dasar Privasi</h1>
        <p className="text-sm text-gray-400 mb-10">Kemaskini terakhir: 24 Mei 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">1. Maklumat Yang Kami Kumpul</h2>
            <p>Teman mengumpul maklumat berikut apabila anda mendaftar dan menggunakan platform kami:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Nama penuh, nombor telefon, dan alamat emel</li>
              <li>Maklumat lokasi (negeri dan bandar)</li>
              <li>Maklumat profil (bio, kemahiran, pengalaman)</li>
              <li>Maklumat booking dan sejarah transaksi</li>
              <li>Gambar profil yang dimuat naik oleh pengguna</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">2. Bagaimana Kami Menggunakan Maklumat Anda</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Mengendalikan dan memproses tempahan perkhidmatan</li>
              <li>Memudahkan komunikasi antara pelanggan dan Teman</li>
              <li>Memproses pembayaran dengan selamat melalui Stripe</li>
              <li>Menghantar notifikasi berkaitan booking dan akaun</li>
              <li>Meningkatkan keselamatan dan perkhidmatan platform</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">3. Perkongsian Maklumat</h2>
            <p>Kami <strong>tidak menjual</strong> maklumat peribadi anda kepada mana-mana pihak ketiga. Maklumat dikongsi hanya dengan:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Pihak lain dalam transaksi booking (nama dan nombor telefon sahaja)</li>
              <li>NGO rakan untuk tujuan pengesahan Teman</li>
              <li>Pemproses pembayaran (Stripe) untuk transaksi kewangan</li>
              <li>Pihak berkuasa apabila dikehendaki oleh undang-undang</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">4. Keselamatan Data</h2>
            <p>Kami menggunakan Supabase dengan enkripsi SSL/TLS untuk melindungi semua data. Kata laluan di-hash menggunakan bcrypt. Maklumat kad kredit tidak disimpan di pelayan kami "" diproses terus oleh Stripe (PCI DSS compliant).</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">5. Pematuhan PDPA</h2>
            <p>Platform ini mematuhi Akta Perlindungan Data Peribadi 2010 (PDPA) Malaysia. Anda berhak untuk:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Mengakses maklumat peribadi anda</li>
              <li>Membetulkan maklumat yang tidak tepat</li>
              <li>Meminta pemadaman akaun dan data anda</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">6. Hubungi Kami</h2>
            <p>Untuk sebarang pertanyaan berkaitan privasi, hubungi: <a href="mailto:privacy@seniocare.app" className="text-[#6366F1] hover:underline">privacy@seniocare.app</a></p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex gap-4 text-sm">
          <Link href="/terms" className="text-[#6366F1] hover:underline">Terma Perkhidmatan</Link>
          <Link href="/" prefetch={false} className="text-gray-400 hover:text-gray-600">Kembali ke Laman Utama</Link>
        </div>
      </div>
    </div>
  )
}
