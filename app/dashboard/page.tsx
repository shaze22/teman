import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export default async function DashboardRedirect() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!dbUser) redirect('/register')

  switch (dbUser.role) {
    case 'locum_nurse':
    case 'locum_physio':
    case 'locum_care_aide':
    case 'medical_escort':
    case 'companion': redirect('/dashboard/provider')
    case 'customer':
    case 'waris': redirect('/dashboard/customer')
    case 'super_admin': redirect('/admin')
    default: redirect('/')
  }
}
