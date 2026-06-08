import { NextRequest, NextResponse } from 'next/server'
import { compareFaceWithIC } from '@/lib/gemini'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  icBase64: z.string().min(100),
  icMimeType: z.string(),
  selfieBase64: z.string().min(100),
  selfieMimeType: z.string(),
})

const RATE_LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)

  // Rate limit check
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()
  const { count } = await supabaseAdmin
    .from('gemini_verify_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', windowStart)

  if ((count ?? 0) >= RATE_LIMIT) {
    return NextResponse.json(
      { message: 'Terlalu banyak percubaan. Cuba lagi selepas 1 jam.' },
      { status: 429 }
    )
  }

  // Log this attempt
  await supabaseAdmin.from('gemini_verify_attempts').insert({ ip })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 })
  }

  try {
    const result = await compareFaceWithIC(
      parsed.data.icBase64, parsed.data.icMimeType,
      parsed.data.selfieBase64, parsed.data.selfieMimeType,
    )
    return NextResponse.json(result)
  } catch (err) {
    console.error('[verify-selfie]', err)
    return NextResponse.json({ message: 'Verifikasi gagal' }, { status: 500 })
  }
}
