import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = await supabaseAdmin
    .from('single_mother_profiles')
    .select('id, is_locum, locum_verified, locum_cert_type')
    .eq('id', id)
    .single()

  return NextResponse.json(data ?? {})
}
