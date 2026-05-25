'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function signOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login?logged_out=1')
    router.refresh()
  }

  return (
    <button onClick={signOut} disabled={loading}
      className="p-2 hover:bg-black/10 rounded-lg transition-colors disabled:opacity-50"
      title="Log keluar">
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
    </button>
  )
}
