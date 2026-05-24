'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button onClick={signOut}
      className="p-2 hover:bg-black/10 rounded-lg transition-colors"
      title="Log keluar">
      <LogOut className="w-5 h-5" />
    </button>
  )
}
