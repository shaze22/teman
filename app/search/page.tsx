import { Suspense } from 'react'
import SearchPageClient from './_client'

export const metadata = {
  title: 'Cari Provider | SenioCare',
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <SearchPageClient />
    </Suspense>
  )
}
