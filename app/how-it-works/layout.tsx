import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how SenioCare connects Malaysian families with licensed nurses, physiotherapists, and trained companions for their elderly loved ones.',
}

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
