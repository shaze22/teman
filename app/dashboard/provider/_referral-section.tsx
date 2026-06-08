'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Users, Gift, Clock } from 'lucide-react'

type Stats = {
  referralCode: string
  total: number
  pending: number
  credited: number
  totalEarned: number
}

export default function ReferralSection({ lang }: { lang: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referral/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
  }, [])

  if (!stats) return null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seniocare.app'
  const referralLink = `${appUrl}/join?ref=${stats.referralCode}`

  function copyLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function shareWhatsApp() {
    const msg = lang === 'en'
      ? `Join me on SenioCare as a Meal Companion! 🍽️ Earn extra income by dining with seniors. Use my referral link and we both get RM10 bonus after your first session: ${referralLink}`
      : `Jom join SenioCare sebagai Meal Companion! 🍽️ Dapat duit tambahan dengan menemani warga emas makan. Guna link referral saya dan kita berdua dapat RM10 bonus selepas sesi pertama anda: ${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
          <Gift className="w-4 h-4 text-[#F43F5E]" />
        </div>
        <h3 className="font-bold text-gray-900 text-sm">
          {lang === 'en' ? 'Referral Programme' : 'Program Referral'}
        </h3>
      </div>

      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        {lang === 'en'
          ? 'Invite friends to become Meal Companions. Both of you get RM10 credit after their first completed session!'
          : 'Jemput rakan jadi Meal Companion. Anda berdua dapat kredit RM10 selepas sesi pertama mereka selesai!'}
      </p>

      {/* Referral link */}
      <div className="bg-[#F8FAFC] rounded-xl p-3 mb-3">
        <p className="text-xs text-gray-400 mb-1">
          {lang === 'en' ? 'Your referral link' : 'Link referral anda'}
        </p>
        <p className="text-xs font-mono text-gray-700 truncate">{referralLink}</p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-[#EEF2FF] text-[#6366F1] py-2 rounded-xl hover:bg-[#E0E7FF] transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? (lang === 'en' ? 'Copied!' : 'Disalin!') : (lang === 'en' ? 'Copy Link' : 'Salin Link')}
        </button>
        <button
          onClick={shareWhatsApp}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
        >
          <span className="text-sm">📲</span>
          WhatsApp
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[#F8FAFC] rounded-xl py-2.5 px-1">
          <div className="flex items-center justify-center mb-1">
            <Users className="w-3.5 h-3.5 text-[#6366F1]" />
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-400">{lang === 'en' ? 'Invited' : 'Dijemput'}</div>
        </div>
        <div className="bg-[#F8FAFC] rounded-xl py-2.5 px-1">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-3.5 h-3.5 text-yellow-500" />
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.pending}</div>
          <div className="text-xs text-gray-400">{lang === 'en' ? 'Pending' : 'Menunggu'}</div>
        </div>
        <div className="bg-[#F8FAFC] rounded-xl py-2.5 px-1">
          <div className="flex items-center justify-center mb-1">
            <Gift className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-600">RM{stats.totalEarned.toFixed(0)}</div>
          <div className="text-xs text-gray-400">{lang === 'en' ? 'Earned' : 'Dikreditkan'}</div>
        </div>
      </div>

      {stats.total === 0 && (
        <p className="text-xs text-center text-gray-400 mt-3">
          {lang === 'en'
            ? 'No referrals yet share your link on WhatsApp or TikTok!'
            : 'Belum ada referral kongsi link anda di WhatsApp atau TikTok!'}
        </p>
      )}
    </div>
  )
}
