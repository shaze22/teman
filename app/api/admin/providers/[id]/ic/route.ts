import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendIcApproved, sendIcRejected } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: 'Invalid data' }, { status: 400 })

  const now = new Date().toISOString()
  const update = parsed.data.action === 'approve'
    ? { ic_verified: true, gemini_verified_at: now, updated_at: now }
    : { ic_verified: false, updated_at: now }

  const { error } = await supabaseAdmin.from('provider_profiles').update(update).eq('id', id)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  // Fetch provider user info for email notification
  const { data: profileData } = await supabaseAdmin
    .from('provider_profiles')
    .select('user_id')
    .eq('id', id)
    .single()

  if (profileData?.user_id) {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('full_name, email')
      .eq('id', profileData.user_id)
      .single()

    if (userData?.email) {
      if (parsed.data.action === 'approve') {
        await sendIcApproved({ to: userData.email, providerName: userData.full_name })
      } else {
        await sendIcRejected({
          to: userData.email,
          providerName: userData.full_name,
          reason: parsed.data.reason ?? 'Rejected by admin',
        })
      }
    }
  }

  return NextResponse.json({ success: true })
}
