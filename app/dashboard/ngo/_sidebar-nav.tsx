'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Settings } from 'lucide-react'

const NAV = [
  { href: '/dashboard/ngo', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/dashboard/ngo/members', icon: Users, label: 'Ahli Provider' },
  { href: '/dashboard/ngo/settings', icon: Settings, label: 'Tetapan NGO' },
]

export default function NgoSidebarNav() {
  const pathname = usePathname()
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {NAV.map(({ href, icon: Icon, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link key={href} href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
              active ? 'bg-[#0D9488] text-white' : 'text-white/60 hover:text-white hover:bg-white/8'
            }`}>
            <Icon className={`w-4 h-4 transition-colors ${active ? 'text-white' : 'group-hover:text-[#818CF8]'}`} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
