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
  if (!parsed.success) return NextResponse.json({ message: 'Data tidak sah' }, { status: 400 })

  const now = new Date().toISOString()
  const update = parsed.data.action === 'approve'
    ? { ic_verified: true, ic_verified_at: now, ic_rejected_reason: null, updated_at: now }
    : { ic_verified: false, ic_rejected_reason: parsed.data.reason ?? 'Ditolak oleh admin', updated_at: now }

  const { error } = await supabaseAdmin.from('single_mother_profiles').update(update).eq('id', id)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  // Fetch provider's user record for email
  const { data: profileData } = await supabaseAdmin
    .from('single_mother_profiles')
    .select('users!inner(full_name, email)')
    .eq('id', id)
    .single()

  if (profileData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = (profileData as any).users as { full_name: string; email: string }
    if (u?.email) {
      if (parsed.data.action === 'approve') {
        await sendIcApproved({ to: u.email, providerName: u.full_name })
      } else {
        await sendIcRejected({
          to: u.email,
          providerName: u.full_name,
          reason: parsed.data.reason ?? 'Ditolak oleh admin',
        })
      }
    }
  }

  return NextResponse.json({ success: true })
}
