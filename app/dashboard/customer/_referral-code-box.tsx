'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function ReferralCodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const url = `${window.location.origin}/register/customer?ref=${code}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      await navigator.clipboard.writeText(code)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
      <span className="flex-1 font-mono font-bold text-gray-900 tracking-widest text-sm">{code}</span>
      <button
        onClick={copy}
        className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
          copied ? 'bg-emerald-100 text-emerald-600' : 'bg-[#6366F1] text-white hover:bg-[#4F46E5]'
        }`}
      >
        {copied ? <><Check className="w-3 h-3" /> Disalin!</> : <><Copy className="w-3 h-3" /> Salin</>}
      </button>
    </div>
  )
}
