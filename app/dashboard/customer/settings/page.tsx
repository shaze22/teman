import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Heart, ArrowLeft, Bell, Shield, Trash2, Smartphone } from 'lucide-react'
import SignOutButton from '../../_sign-out-button'
import ChangePasswordForm from './_change-password-form'
import DeleteAccountButton from './_delete-account-button'

export default async function CustomerSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawProfile } = await supabaseAdmin
    .from('customer_profiles')
    .select('users!inner(full_name)')
    .eq('user_id', user.id)
    .single()

  if (!rawProfile) redirect('/register/customer')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (rawProfile as any).users as { full_name: string }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/customer" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F43F5E] flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
              </div>
              <span className="font-bold text-[#0F0E17]">Teman</span>
            </Link>
          </div>
          <SignOutButton />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Tetapan</h1>
        <p className="text-sm text-gray-500 mb-8">Urus akaun dan keutamaan anda</p>

        {/* Account Info */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Maklumat Akaun</h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            <div className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-medium text-gray-900">Nama Penuh</div>
                <div className="text-sm text-gray-500 mt-0.5">{u.full_name}</div>
              </div>
              <Link href="/dashboard/customer/profile" className="text-xs text-[#F43F5E] font-medium hover:underline">
                Edit
              </Link>
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-medium text-gray-900">E-mel</div>
                <div className="text-sm text-gray-500 mt-0.5">{user.email}</div>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Tidak boleh ditukar</span>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Keselamatan</h2>
          <div className="bg-white rounded-2xl border border-gray-100">
            <ChangePasswordForm />
          </div>
        </section>

        {/* Notifications */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Notifikasi</h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            <NotifRow icon={Bell} label="Kemas Kini Booking" desc="Status booking anda berubah" defaultOn />
            <NotifRow icon={Smartphone} label="Peringatan Sesi" desc="1 jam sebelum sesi bermula" defaultOn />
            <NotifRow icon={Shield} label="Promosi & Tawaran" desc="Tawaran khas dari Teman" defaultOn={false} />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 px-1">Zon Bahaya</h2>
          <div className="bg-white rounded-2xl border border-red-100">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Padam Akaun</div>
                  <div className="text-xs text-gray-500 mt-0.5 mb-3">Tindakan ini tidak boleh dibatalkan. Semua data anda akan dipadam secara kekal.</div>
                  <DeleteAccountButton />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="text-center">
          <p className="text-xs text-gray-400">Teman Platform · v1.0 · <a href="/privacy" className="hover:underline">Privasi</a> · <a href="/terms" className="hover:underline">Terma</a></p>
        </div>
      </div>
    </div>
  )
}

function NotifRow({ icon: Icon, label, desc, defaultOn }: { icon: typeof Bell; label: string; desc: string; defaultOn: boolean }) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#FFF1F2] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#F43F5E]" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <div className="text-xs text-gray-500">{desc}</div>
        </div>
      </div>
      <div className={`w-11 h-6 rounded-full relative transition-colors ${defaultOn ? 'bg-[#F43F5E]' : 'bg-gray-200'}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${defaultOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </div>
  )
}
