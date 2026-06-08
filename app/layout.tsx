import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import { LangProvider } from '@/lib/lang-context'
import type { Lang } from '@/lib/i18n'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'SenioCare Rakan Setia Warga Emas',
  description:
    'Platform yang menghubungkan ibu tunggal dengan warga emas. Cari teman, buat booking, dan hidupkan komuniti bersama.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'SenioCare' },
  other: { 'mobile-web-app-capable': 'yes' },
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'en') as Lang
  return (
    <html lang={lang === 'en' ? 'en' : 'ms'} className={`${inter.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#6366F1" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full bg-[#F8FAFC] font-sans antialiased">
        <LangProvider initial={lang}>
          {children}
        </LangProvider>
      </body>
    </html>
  )
}
