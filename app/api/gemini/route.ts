import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geminiGenerate } from '@/lib/gemini'
import { z } from 'zod'

const schema = z.object({
  prompt: z.string().min(1).max(8000),
  model: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { prompt, model } = parsed.data

  try {
    const text = await geminiGenerate(prompt, model)
    return NextResponse.json({ text })
  } catch (err) {
    console.error('gemini route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
