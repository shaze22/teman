import { NextRequest, NextResponse } from 'next/server'
import { compareFaceWithIC } from '@/lib/gemini'
import { z } from 'zod'

const schema = z.object({
  icBase64: z.string().min(100),
  icMimeType: z.string(),
  selfieBase64: z.string().min(100),
  selfieMimeType: z.string(),
})

export async function POST(request: NextRequest) {
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
