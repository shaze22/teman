import { Suspense } from 'react'
import SearchPageClient from './_client'

export const metadata = {
  title: 'Find a Meal Companion — SenioCare',
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#6366F1] border-t-transparent rounded-full" />
        </div>
      }
    >
      <SearchPageClient />
    </Suspense>
  )
}
