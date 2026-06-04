'use client'

import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang-context'

export default function BookingButton({
  providerId,
  providerName,
}: {
  providerId: string
  providerName: string
}) {
  const router = useRouter()
  const { t } = useLang()

  return (
    <button
      onClick={() => router.push(`/book/${providerId}`)}
      className="w-full bg-[#6366F1] text-white font-semibold py-3 rounded-xl hover:bg-[#4F46E5] transition-colors"
    >
      Book {providerName.split(' ')[0]} {t.profilePage.bookNow}
    </button>
  )
}
