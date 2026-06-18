import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/handler'
import { Errors } from '@/lib/errors'

// PDPA 2010 s.12 Right of Erasure — anonymize all PII, delete storage files
export const DELETE = withAuth(async ({ user }) => {
  const userId = user.id
  const now = new Date().toISOString()
  const anon = `deleted_${userId.slice(0, 8)}`

  // 1. Anonymize users row
  const { error: userErr } = await supabaseAdmin.from('users').update({
    full_name: 'Deleted User',
    phone: '',
    status: 'suspended',
    updated_at: now,
  }).eq('id', userId)
  if (userErr) throw Errors.serverError(userErr.message)

  // 2. Anonymize customer_profiles PII (health data — Class A)
  await supabaseAdmin.from('customer_profiles').update({
    senior_full_name: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    mobility_status: null,
    health_conditions: null,
    needs: null,
    updated_at: now,
  }).eq('user_id', userId)

  // 3. Anonymize provider_profiles PII + clear verification docs
  await supabaseAdmin.from('provider_profiles').update({
    ic_number: null,
    ic_url: null,
    selfie_url: null,
    ic_verified: false,
    bio: null,
    languages: [],
    updated_at: now,
  }).eq('user_id', userId)

  // 4. Delete IC/selfie files from storage (non-fatal)
  void supabaseAdmin.storage.from('ic-documents').remove([
    `${userId}/ic_front.jpg`,
    `${userId}/ic_front.png`,
    `${userId}/selfie.jpg`,
    `${userId}/ic-front.jpg`,
  ]).then(null, () => {})
  void supabaseAdmin.storage.from('license-certs').remove([
    `${userId}/license.pdf`,
    `${userId}/license.jpg`,
  ]).then(null, () => {})

  // 5. Anonymize auth email so the address is freed for re-registration
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    email: `${anon}@deleted.seniocare.app`,
  }).then(null, () => {})

  // 6. Sign out current session
  const supabase = await createClient()
  await supabase.auth.signOut()

  return NextResponse.json({ ok: true })
})
