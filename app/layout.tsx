import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import { LangProvider } from '@/lib/lang-context'
import type { Lang } from '@/lib/i18n'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'SenioCare | Locum & Companion untuk Warga Emas Malaysia',
    template: '%s | SenioCare',
  },
  description:
    'Platform penjagaan warga emas profesional Malaysia. Jururawat berlesen, fisioterapi, pembantu penjagaan & companion terlatih. Tempah dalam minit.',
  keywords: ['locum jururawat', 'fisioterapi rumah', 'companion warga emas', 'penjagaan warga emas', 'seniocare', 'Malaysia', 'home care'],
  metadataBase: new URL('https://seniocare.app'),
  openGraph: {
    type: 'website',
    locale: 'en_MY',
    url: 'https://seniocare.app',
    siteName: 'SenioCare',
    title: 'SenioCare | Locum & Companion untuk Warga Emas Malaysia',
    description: 'Hubungkan keluarga dengan jururawat berlesen, fisioterapi & companion terlatih untuk warga emas. Disahkan. Dipercayai.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'SenioCare — Locum & Companion untuk Warga Emas' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SenioCare | Locum & Companion untuk Warga Emas',
    description: 'Jururawat berlesen, fisioterapi & companion terlatih untuk warga emas Malaysia.',
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
        <meta name="theme-color" content="#0D9488" />
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
