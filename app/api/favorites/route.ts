import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('customer_favorites')
    .select('provider_id')
    .eq('customer_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ favorites: (data ?? []).map((r) => r.provider_id) })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const providerId = body?.providerId as string | undefined
  if (!providerId) return NextResponse.json({ error: 'providerId required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('customer_favorites')
    .insert({ customer_id: user.id, provider_id: providerId })

  if (error) {
    // Ignore unique constraint violation (already favorited)
    if (error.code === '23505') return NextResponse.json({ success: true })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const providerId = body?.providerId as string | undefined
  if (!providerId) return NextResponse.json({ error: 'providerId required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('customer_favorites')
    .delete()
    .eq('customer_id', user.id)
    .eq('provider_id', providerId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
