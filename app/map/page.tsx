'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Heart, ArrowLeft, Map } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import LangToggle from '@/app/_lang-toggle'

function MapLoading() {
  const { t } = useLang()
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Map className="w-10 h-10 text-[#6366F1] mx-auto mb-2 opacity-50" />
        <p className="text-sm text-gray-500">{t.map.loading}</p>
      </div>
    </div>
  )
}

const MapView = dynamic(() => import('./_map-view'), {
  ssr: false,
  loading: () => <MapLoading />,
})

export default function MapPage() {
  const { t } = useLang()
  return (
    <div className="flex flex-col h-screen">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/search" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-[#6366F1]" fill="currentColor" />
            <span className="font-bold text-[#6366F1]">SenioCare</span>
          </Link>
          <span className="text-sm font-semibold text-gray-900 ml-1">{t.map.title}</span>
          <div className="ml-auto flex items-center gap-3">
            <LangToggle />
            <Link href="/search" className="text-sm text-[#6366F1] font-medium hover:underline">
              {t.map.listView}
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 relative">
        <MapView />
      </div>
    </div>
  )
}
