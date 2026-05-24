import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Teman — Rakan Setia Warga Emas',
  description:
    'Platform yang menghubungkan ibu tunggal dengan warga emas. Cari teman, buat booking, dan hidupkan komuniti bersama.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ms" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-[#F8FAFC] font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
