import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the SenioCare Terms of Service — platform rules, payment policy, cancellation policy, and governing law (Malaysia).',
}

export default function TermsPage() {
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
          <span className="text-gray-400 text-sm">/ Terma Perkhidmatan</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-[#0F0E17] mb-2">Terma Perkhidmatan</h1>
        <p className="text-sm text-gray-400 mb-10">Kemaskini terakhir: 24 Mei 2026</p>

        <div className="space-y-8 text-gray-600 text-sm leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">1. Penerimaan Terma</h2>
            <p>Dengan mendaftar atau menggunakan platform SenioCare, anda bersetuju untuk terikat dengan terma-terma ini. Jika anda tidak bersetuju, sila jangan gunakan platform ini.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">2. Akaun Pengguna</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Anda mesti berumur sekurang-kurangnya 18 tahun untuk mendaftar</li>
              <li>Maklumat yang diberikan mestilah tepat dan terkini</li>
              <li>Anda bertanggungjawab menjaga kerahsiaan kata laluan akaun anda</li>
              <li>Satu orang hanya boleh mempunyai satu akaun aktif</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">3. Perkhidmatan Platform</h2>
            <p>SenioCare adalah platform perantara yang menghubungkan penyedia perkhidmatan (Teman) dengan pelanggan. SenioCare bukan majikan kepada penyedia perkhidmatan dan tidak bertanggungjawab ke atas kualiti perkhidmatan yang diberikan.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">4. Bayaran dan Yuran</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Semua bayaran diproses melalui Stripe yang selamat</li>
              <li>Yuran platform sebanyak 15% dikenakan ke atas setiap transaksi</li>
              <li>Bayaran balik tertakluk kepada polisi pembatalan booking</li>
              <li>Harga dipaparkan dalam Ringgit Malaysia (MYR)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">5. Pembatalan Booking</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Pembatalan 24 jam sebelum sesi: bayaran balik penuh</li>
              <li>Pembatalan kurang dari 24 jam: tiada bayaran balik</li>
              <li>Pembatalan oleh penyedia: bayaran balik penuh kepada pelanggan</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">6. Tingkah Laku Pengguna</h2>
            <p>Pengguna dilarang:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Memberikan maklumat palsu atau mengelirukan</li>
              <li>Mengganggu, mengancam, atau menyalahgunakan pengguna lain</li>
              <li>Membuat pembayaran atau tuntutan penipuan</li>
              <li>Menggunakan platform untuk aktiviti haram</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">7. Penggantungan Akaun</h2>
            <p>SenioCare berhak untuk menggantung atau menamatkan akaun mana-mana pengguna yang melanggar terma ini tanpa notis terlebih dahulu.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">8. Had Liabiliti</h2>
            <p>SenioCare tidak bertanggungjawab ke atas sebarang kerugian tidak langsung yang timbul daripada penggunaan platform ini. Liabiliti maksimum kami terhad kepada jumlah yang dibayar melalui platform dalam tempoh 30 hari sebelum tuntutan.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">9. Undang-Undang Terpakai</h2>
            <p>Terma ini ditadbir oleh undang-undang Malaysia. Sebarang pertikaian hendaklah diselesaikan di mahkamah yang mempunyai bidang kuasa di Kuala Lumpur, Malaysia.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F0E17]">10. Hubungi Kami</h2>
            <p>Untuk sebarang pertanyaan: <a href="mailto:support@seniocare.app" className="text-[#6366F1] hover:underline">support@seniocare.app</a></p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex gap-4 text-sm">
          <Link href="/privacy" className="text-[#6366F1] hover:underline">Dasar Privasi</Link>
          <Link href="/" prefetch={false} className="text-gray-400 hover:text-gray-600">Kembali ke Laman Utama</Link>
        </div>
      </div>
    </div>
  )
}
