'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, LayoutDashboard, CalendarDays, User } from 'lucide-react'
import { useLang } from '@/lib/lang-context'

export default function MobileBottomNav({ role }: { role: 'customer' | 'provider' }) {
  const pathname = usePathname()
  const { lang } = useLang()

  const customerTabs: { href: string; icon: typeof Search; label: string; match?: string }[] = [
    { href: '/search', icon: Search, label: lang === 'en' ? 'Search' : 'Cari' },
    { href: '/dashboard/customer', icon: LayoutDashboard, label: lang === 'en' ? 'Home' : 'Utama' },
    { href: '/booking', icon: CalendarDays, label: lang === 'en' ? 'Bookings' : 'Tempahan', match: '/booking' },
    { href: '/dashboard/customer/profile', icon: User, label: lang === 'en' ? 'Profile' : 'Profil' },
  ]

  const providerTabs: { href: string; icon: typeof Search; label: string; match?: string }[] = [
    { href: '/search', icon: Search, label: lang === 'en' ? 'Search' : 'Cari' },
    { href: '/dashboard/provider', icon: LayoutDashboard, label: lang === 'en' ? 'Home' : 'Utama' },
    { href: '/dashboard/provider/bookings', icon: CalendarDays, label: lang === 'en' ? 'Bookings' : 'Tempahan', match: '/dashboard/provider/bookings' },
    { href: '/dashboard/provider/profile', icon: User, label: lang === 'en' ? 'Profile' : 'Profil', match: '/dashboard/provider/profile' },
  ]

  const tabs = role === 'customer' ? customerTabs : providerTabs

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-pb md:hidden">
      <div className="grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const active = tab.match ? pathname.startsWith(tab.match) : pathname === tab.href || pathname.startsWith(tab.href)
          return (
            <Link key={tab.href + tab.label} href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${active ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <tab.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
