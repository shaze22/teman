import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how SenioCare connects seniors with verified Meal Companions. Simple 3-step booking — search, pay, dine together.',
}

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
