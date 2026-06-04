import Link from 'next/link'
import { Heart, Search, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 text-center">
      <Link href="/" className="flex items-center gap-2 mb-12">
        <Heart className="w-8 h-8 text-[#6366F1]" fill="currentColor" />
        <span className="text-2xl font-bold text-[#6366F1]">SenioCare</span>
      </Link>

      <div className="w-24 h-24 rounded-full bg-[#EEF2FF] flex items-center justify-center mb-6">
        <span className="text-4xl font-black text-[#6366F1]">404</span>
      </div>

      <h1 className="text-2xl font-bold text-[#0F0E17] mb-3">Halaman Tidak Dijumpai</h1>
      <p className="text-gray-500 max-w-sm mb-10 leading-relaxed">
        Halaman yang anda cari tidak wujud atau telah dipindahkan. Cuba cari pengasuh atau balik ke laman utama.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 bg-[#6366F1] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#4F46E5] transition-colors shadow-lg shadow-indigo-200"
        >
          <Search className="w-4 h-4" />
          Cari Pengasuh
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 font-semibold px-6 py-3 rounded-full hover:border-gray-300 transition-colors"
        >
          <Home className="w-4 h-4" />
          Laman Utama
        </Link>
      </div>

      <p className="text-xs text-gray-400 mt-12">© 2026 SenioCare · Menghubungkan hati, memelihara kasih.</p>
    </div>
  )
}
