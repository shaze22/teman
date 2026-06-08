import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import { LangProvider } from '@/lib/lang-context'
import type { Lang } from '@/lib/i18n'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'SenioCare | Meal Companion for Malaysian Seniors',
    template: '%s | SenioCare',
  },
  description:
    'Connect your elderly loved one with a verified Meal Companion. Dine together at any restaurant — safe, warm, and affordable. Book in minutes.',
  keywords: ['meal companion', 'senior care', 'elderly companion', 'teman makan', 'warga emas', 'seniocare', 'Malaysia'],
  metadataBase: new URL('https://seniocare.app'),
  openGraph: {
    type: 'website',
    locale: 'en_MY',
    url: 'https://seniocare.app',
    siteName: 'SenioCare',
    title: 'SenioCare | Meal Companion for Malaysian Seniors',
    description: 'Connect your elderly loved one with a verified Meal Companion. Dine together at any restaurant — safe, warm, and affordable.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'SenioCare — Meal Companion for Malaysian Seniors' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SenioCare | Meal Companion for Malaysian Seniors',
    description: 'Connect your elderly loved one with a verified Meal Companion. Dine together, feel valued.',
    images: ['/opengraph-image'],
  },
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
