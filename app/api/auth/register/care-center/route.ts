import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  centerName: z.string().min(2),
  centerType: z.enum(['nursing_home', 'day_care', 'welfare_center', 'rehabilitation', 'hospital']),
  registrationNumber: z.string().optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  postcode: z.string().optional(),
  picName: z.string().min(2),
  residentCapacity: z.string().optional(),
  website: z.string().optional(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Data tidak lengkap', errors: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const now = new Date().toISOString()

  try {
    await supabaseAdmin.from('users').delete().eq('email', data.email).neq('id', data.userId)

    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: data.userId,
      email: data.email,
      phone: data.phone,
      full_name: data.fullName,
      role: 'care_center',
      status: 'pending',
      updated_at: now,
    })
    if (userError) throw new Error(userError.message)

    const { error: profileError } = await supabaseAdmin.from('care_center_profiles').insert({
      id: crypto.randomUUID(),
      user_id: data.userId,
      center_name: data.centerName,
      center_type: data.centerType,
      registration_number: data.registrationNumber ?? null,
      address: data.address,
      city: data.city,
      state: data.state,
      postcode: data.postcode ?? null,
      phone: data.phone,
      pic_name: data.picName,
      resident_capacity: data.residentCapacity ? parseInt(data.residentCapacity) : null,
      website: data.website ?? null,
      updated_at: now,
    })
    if (profileError) throw new Error(profileError.message)
  } catch (err) {
    console.error('[register/care-center]', err)
    const message = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
