'use client'

import { useRouter } from 'next/navigation'

export default function BookingButton({
  providerId,
  providerName,
}: {
  providerId: string
  providerName: string
}) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/book/${providerId}`)}
      className="w-full bg-[#6366F1] text-white font-semibold py-3 rounded-xl hover:bg-[#4F46E5] transition-colors"
    >
      Book {providerName.split(' ')[0]} Sekarang
    </button>
  )
}
