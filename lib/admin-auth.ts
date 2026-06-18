import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: u } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!u || u.role !== 'super_admin') redirect('/')

  return { user, role: u.role as 'super_admin' }
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.from('users').select('role').eq('id', userId).single()
  return data?.role === 'super_admin'
}

export async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: u } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!u || u.role !== 'super_admin') redirect('/')

  return { user }
}
