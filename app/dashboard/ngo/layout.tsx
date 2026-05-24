import Link from 'next/link'
import { Heart, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import NgoSidebarNav from './_sidebar-nav'

export default async function NgoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: u } = await supabaseAdmin
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!u || u.role !== 'ngo_admin') redirect('/')

  const { data: ngo } = await supabaseAdmin
    .from('ngos')
    .select('id, name, status, referral_code, total_members')
    .eq('admin_user_id', user.id)
    .single()

  if (!ngo) redirect('/register/ngo')

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <aside className="w-60 bg-[#0F0E17] flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/10">
          <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-sm truncate">{ngo.name}</div>
            <div className="text-xs text-white/40">NGO Admin</div>
          </div>
        </div>

        <NgoSidebarNav />

        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <div className="text-xs font-medium text-white truncate">{u.full_name}</div>
            <div className="text-xs text-white/40 truncate">{user.email}</div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/8 transition-colors">
              <LogOut className="w-4 h-4" />
              Log Keluar
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  )
}
