'use client'

import { useLang } from '@/lib/lang-context'

export default function LangToggle() {
  const { lang, toggle } = useLang()

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center justify-center w-12 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-teal-600 hover:text-teal-600 transition-colors bg-white"
      title={lang === 'bm' ? 'Switch to English' : 'Tukar ke Bahasa Malaysia'}
    >
      {lang === 'bm' ? 'BM' : 'EN'}
    </button>
  )
}
