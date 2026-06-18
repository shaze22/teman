import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { Errors } from '@/lib/errors'

// Soft delete only — Class A healthcare data, no hard delete
export const DELETE = withAuth(async ({ user }) => {
  const { error } = await supabaseAdmin.from('users')
    .update({ status: 'suspended', updated_at: new Date().toISOString() })
    .eq('id', user.id)
  if (error) throw Errors.serverError(error.message)

  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
})
