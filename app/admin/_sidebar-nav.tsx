'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, ShoppingBag, AlertTriangle, UserCheck, Wallet, MessageSquareWarning, Tag, BarChart3, Award } from 'lucide-react'

const NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analitik' },
  { href: '/admin/providers/verify-license', icon: Award, label: 'Sijil Profesional' },
  { href: '/admin/providers', icon: UserCheck, label: 'Semua Provider' },
  { href: '/admin/customers', icon: Users, label: 'Pelanggan' },
  { href: '/admin/bookings', icon: ShoppingBag, label: 'Booking' },
  { href: '/admin/disputes', icon: MessageSquareWarning, label: 'Aduan' },
  { href: '/admin/withdrawals', icon: Wallet, label: 'Pengeluaran' },
  { href: '/admin/promo', icon: Tag, label: 'Promo Codes' },
  { href: '/admin/sos', icon: AlertTriangle, label: 'SOS Events' },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {NAV.map(({ href, icon: Icon, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link key={href} href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
              active
                ? 'bg-[#6366F1] text-white'
                : 'text-white/60 hover:text-white hover:bg-white/8'
            }`}>
            <Icon className={`w-4 h-4 transition-colors ${active ? 'text-white' : 'group-hover:text-[#818CF8]'}`} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
