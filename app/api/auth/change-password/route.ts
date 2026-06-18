import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/handler'
import { Errors } from '@/lib/errors'

export const POST = withAuth(async ({ user, req }) => {
  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) throw Errors.badRequest('Sila isi semua medan')
  if (newPassword.length < 8) throw Errors.badRequest('Kata laluan mesti sekurang-kurangnya 8 aksara')

  // Need raw client for signInWithPassword + updateUser (cookie-bound operations)
  const supabase = await createClient()

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })
  if (signInError) throw Errors.badRequest('Kata laluan semasa tidak betul')

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) throw Errors.serverError(updateError.message)

  return NextResponse.json({ ok: true })
})
