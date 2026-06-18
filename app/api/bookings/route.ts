import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { createBooking, createBookingSchema } from '@/lib/use-cases/create-booking'

export const POST = withAuth(async ({ user, req }) => {
  const input = await parseBody(req, createBookingSchema)
  const result = await createBooking(user.id, input)
  return NextResponse.json(result)
})

export const GET = withAuth(async ({ user }) => {
  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      customer:users!bookings_customer_id_fkey(full_name, avatar_url),
      provider:users!bookings_provider_id_fkey(full_name, avatar_url)
    `)
    .or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(bookings ?? [])
})
