import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  isForSelf: z.boolean(),
  seniorFullName: z.string().optional(),
  seniorAge: z.string().optional(),
  seniorPhone: z.string().optional(),
  locationState: z.string().min(2),
  locationCity: z.string().min(2),
  locationPostcode: z.string().optional(),
  mobilityStatus: z.enum(['independent', 'walking_stick', 'wheelchair', 'bedridden']),
  needs: z.array(z.string()),
  emergencyName: z.string().min(2),
  emergencyRelation: z.string().optional(),
  emergencyPhone: z.string().min(8),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Data tidak lengkap', errors: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const now = new Date().toISOString()

  try {
    // Remove orphaned record if previous registration failed mid-way
    await supabaseAdmin.from('users').delete().eq('email', data.email).neq('id', data.userId)

    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: data.userId,
      email: data.email,
      phone: data.phone,
      full_name: data.fullName,
      role: data.isForSelf ? 'customer' : 'waris',
      status: 'active',
      updated_at: now,
    })
    if (userError) throw new Error(userError.message)

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('customer_profiles')
      .insert({
        id: crypto.randomUUID(),
        user_id: data.userId,
        is_for_self: data.isForSelf,
        senior_full_name: data.seniorFullName ?? null,
        senior_age: data.seniorAge ? parseInt(data.seniorAge) : null,
        senior_phone: data.seniorPhone ?? null,
        location_state: data.locationState,
        location_city: data.locationCity,
        location_postcode: data.locationPostcode ?? null,
        mobility_status: data.mobilityStatus,
        needs: data.needs,
        updated_at: now,
      })
      .select('id')
      .single()
    if (profileError) throw new Error(profileError.message)

    const { error: ecError } = await supabaseAdmin.from('emergency_contacts').insert({
      id: crypto.randomUUID(),
      customer_profile_id: profile.id,
      name: data.emergencyName,
      relationship: data.emergencyRelation ?? '',
      phone: data.emergencyPhone,
      is_primary: true,
    })
    if (ecError) throw new Error(ecError.message)
  } catch (err) {
    console.error('[register/customer]', err)
    const message = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
