import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import NgoRegisterForm from './_form'
import { translations, type Lang } from '@/lib/i18n'

export default async function RegisterNgoPage() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'en') as Lang
  const t = translations[lang]
  const rn = t.registerNgo

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: u } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
  if (!u || u.role !== 'ngo_admin') redirect('/')

  // Already registered?
  const { data: existing } = await supabaseAdmin.from('ngos').select('id').eq('admin_user_id', user.id).single()
  if (existing) redirect('/dashboard/ngo')

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#6366F1] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏢</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{rn.title}</h1>
          <p className="text-sm text-gray-500 mt-2">{rn.subtitle}</p>
        </div>
        <NgoRegisterForm userId={user.id} />
      </div>
    </div>
  )
}
