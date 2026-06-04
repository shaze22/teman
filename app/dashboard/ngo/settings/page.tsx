import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import NgoSettingsForm from './_form'
import { translations, type Lang } from '@/lib/i18n'

export default async function NgoSettingsPage() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'bm') as Lang
  const t = translations[lang]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: u } = await supabaseAdmin.from('users').select('role, full_name').eq('id', user.id).single()
  if (!u || u.role !== 'ngo_admin') redirect('/')

  const { data: ngo } = await supabaseAdmin
    .from('ngos')
    .select('id, name, reg_number, contact_person, email, phone, address, city, state, status, referral_code')
    .eq('admin_user_id', user.id)
    .single()
  if (!ngo) redirect('/register/ngo')

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.ngo.settingsTitle}</h1>
      <p className="text-sm text-gray-500 mb-8">{t.ngo.settingsSubtitle}</p>
      <NgoSettingsForm initial={{
        name: ngo.name,
        regNumber: ngo.reg_number ?? '',
        contactPerson: ngo.contact_person ?? '',
        email: ngo.email ?? '',
        phone: ngo.phone ?? '',
        address: ngo.address ?? '',
        city: ngo.city ?? '',
        state: ngo.state ?? '',
        referralCode: ngo.referral_code ?? '',
        status: ngo.status,
      }} ngoId={ngo.id} adminName={u.full_name} adminEmail={user.email ?? ''} />
    </div>
  )
}
