'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Heart, HandHeart, Users, Building2, ArrowRight, HousePlus, ChevronDown } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import LangToggle from '@/app/_lang-toggle'

function RegisterContent() {
  const searchParams = useSearchParams()
  const preselected = searchParams.get('role')
  const { t } = useLang()
  const [showOrg, setShowOrg] = useState(false)

  const mainRoles = [
    {
      id: 'customer',
      icon: Users,
      title: t.register.customerTitle,
      subtitle: t.register.customerSub,
      color: 'border-[#F43F5E] bg-[#FFF1F2]',
      iconColor: 'text-[#F43F5E] bg-[#FFE4E6]',
      href: '/register/customer',
    },
    {
      id: 'provider',
      icon: HandHeart,
      title: t.register.providerTitle,
      subtitle: t.register.providerSub,
      color: 'border-[#6366F1] bg-[#EEF2FF]',
      iconColor: 'text-[#6366F1] bg-[#E0E7FF]',
      href: '/register/companion',
    },
  ]

  const orgRoles = [
    {
      id: 'care_center',
      icon: HousePlus,
      title: t.register.careCenterTitle,
      subtitle: t.register.careCenterSub,
      color: 'border-amber-500 bg-amber-50',
      iconColor: 'text-amber-600 bg-amber-100',
      href: '/register/care-center',
    },
    {
      id: 'ngo',
      icon: Building2,
      title: t.register.ngoTitle,
      subtitle: t.register.ngoSub,
      color: 'border-blue-500 bg-blue-50',
      iconColor: 'text-blue-600 bg-blue-100',
      href: '/register/ngo',
    },
  ]

  const allRoles = [...mainRoles, ...orgRoles]

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <LangToggle />
      </div>
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-[#6366F1]" fill="currentColor" />
            <span className="text-2xl font-bold text-[#6366F1]">SenioCare</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.register.title}</h1>
          <p className="text-gray-500">{t.register.subtitle}</p>
        </div>

        {/* Main roles */}
        <div className="space-y-4">
          {mainRoles.map((role) => (
            <Link
              key={role.id}
              href={role.href}
              className={`flex items-center gap-4 p-5 bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all group ${
                preselected === role.id ? role.color : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${role.iconColor}`}>
                <role.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{role.title}</div>
                <div className="text-sm text-gray-500">{role.subtitle}</div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Organisation toggle */}
        <button
          onClick={() => setShowOrg(!showOrg)}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mt-5 py-2"
        >
          {showOrg
            ? (t as { lang?: string } & Record<string, unknown>).lang === 'en' ? 'Hide organisation options' : 'Sembunyikan pilihan organisasi'
            : (t as { lang?: string } & Record<string, unknown>).lang === 'en' ? 'Register as an organisation' : 'Daftar sebagai organisasi'
          }
          <ChevronDown className={`w-4 h-4 transition-transform ${showOrg ? 'rotate-180' : ''}`} />
        </button>

        {showOrg && (
          <div className="space-y-3 mt-1">
            {orgRoles.map((role) => (
              <Link
                key={role.id}
                href={role.href}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${role.iconColor}`}>
                  <role.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-700 text-sm">{role.title}</div>
                  <div className="text-xs text-gray-400">{role.subtitle}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </Link>
            ))}
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-8">
          {t.register.hasAccount}{' '}
          <Link href="/login" className="text-[#6366F1] font-semibold hover:underline">
            {t.register.loginLink}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[#6366F1] border-t-transparent rounded-full" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}
