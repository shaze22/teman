'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Heart, Users, ArrowRight, Stethoscope, HandHeart, ChevronDown } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import LangToggle from '@/app/_lang-toggle'

function RegisterContent() {
  const searchParams = useSearchParams()
  const preselected = searchParams.get('role')
  const { lang } = useLang()
  const [showProvider, setShowProvider] = useState(false)

  const customerRole = {
    id: 'customer',
    icon: Users,
    title: lang === 'en' ? 'I / Family of a Senior' : 'Saya / Keluarga Warga Emas',
    subtitle: lang === 'en' ? 'Book a carer for my parent or myself' : 'Tempah penjaga untuk ibu bapa atau diri sendiri',
    color: 'border-rose-200 bg-rose-50',
    iconBg: 'bg-rose-100 text-rose-600',
    href: '/register/customer',
  }

  const providerRoles = [
    {
      id: 'locum',
      icon: Stethoscope,
      title: lang === 'en' ? 'Locum Professional' : 'Locum Profesional',
      subtitle: lang === 'en' ? 'Nurse, physiotherapist, or certified care aide' : 'Jururawat, fisioterapi, atau pembantu penjagaan bertauliah',
      iconBg: 'bg-blue-100 text-blue-600',
      href: '/register/locum',
    },
    {
      id: 'companion',
      icon: HandHeart,
      title: lang === 'en' ? 'Companion' : 'Companion',
      subtitle: lang === 'en' ? 'Wellness, worship & dining companion for seniors' : 'Riadah, ibadah & makan bersama warga emas',
      iconBg: 'bg-teal-100 text-teal-600',
      href: '/register/companion',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex flex-col items-center justify-center px-4 py-12 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600" />
      <div className="absolute top-4 right-4">
        <LangToggle />
      </div>
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-teal-600" fill="currentColor" />
            <span className="text-2xl font-bold text-teal-600">SenioCare</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {lang === 'en' ? 'Create New Account' : 'Daftar Akaun Baru'}
          </h1>
          <p className="text-gray-500">
            {lang === 'en' ? 'I want to register as...' : 'Saya ingin daftar sebagai...'}
          </p>
        </div>

        {/* Customer */}
        <Link
          href={customerRole.href}
          className={`flex items-center gap-4 p-5 bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all group mb-4 ${
            preselected === 'customer' ? customerRole.color : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${customerRole.iconBg}`}>
            <customerRole.icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{customerRole.title}</div>
            <div className="text-sm text-gray-500">{customerRole.subtitle}</div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </Link>

        {/* Provider section toggle */}
        <button
          onClick={() => setShowProvider(!showProvider)}
          className={`w-full flex items-center gap-4 p-5 bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all text-left ${
            showProvider ? 'border-teal-200 bg-teal-50' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-teal-100 text-teal-600">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">
              {lang === 'en' ? 'I Want to Be a Provider' : 'Saya Ingin Jadi Provider'}
            </div>
            <div className="text-sm text-gray-500">
              {lang === 'en' ? 'Locum professional or companion — open to all Malaysians' : 'Locum profesional atau companion — terbuka untuk semua rakyat Malaysia'}
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${showProvider ? 'rotate-180' : ''}`} />
        </button>

        {showProvider && (
          <div className="space-y-3 mt-3 pl-4 border-l-2 border-teal-100">
            {providerRoles.map((role) => (
              <Link
                key={role.id}
                href={role.href}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${role.iconBg}`}>
                  <role.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 text-sm">{role.title}</div>
                  <div className="text-xs text-gray-500">{role.subtitle}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
              </Link>
            ))}
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-8">
          {lang === 'en' ? 'Already have an account?' : 'Sudah ada akaun?'}{' '}
          <Link href="/login" className="text-teal-600 font-semibold hover:underline">
            {lang === 'en' ? 'Log in' : 'Log masuk'}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}
