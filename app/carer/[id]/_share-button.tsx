'use client'

import { useState } from 'react'
import { Share2, Link2, X, Check } from 'lucide-react'
import { useLang } from '@/lib/lang-context'

export default function ShareButton({ providerName, providerId }: { providerName: string; providerId: string }) {
  const { t } = useLang()
  const pp = t.profilePage

  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/carer/${providerId}`
      : `/carer/${providerId}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`${providerName}\n${url}`)
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener')
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 bg-white rounded-xl text-sm font-semibold text-gray-600 hover:border-[#6366F1] hover:text-[#6366F1] transition-all"
      >
        <Share2 className="w-4 h-4" />
        {pp.share}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl mx-0 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">{pp.shareTitle}</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-4">
              <span className="text-xs text-gray-500 flex-1 truncate">{url}</span>
              <button
                onClick={copyLink}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${
                  copied
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-[#6366F1] text-white hover:bg-[#4F46E5]'
                }`}
              >
                {copied ? (
                  <><Check className="w-3 h-3" /> {pp.copied}</>
                ) : (
                  <><Link2 className="w-3 h-3" /> {pp.copy}</>
                )}
              </button>
            </div>

            <button
              onClick={shareWhatsApp}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold rounded-xl transition-colors text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {pp.shareWhatsApp}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
