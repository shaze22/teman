import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { geminiGenerate } from '@/lib/gemini'

const schema = z.object({
  prompt: z.string().min(1).max(8000),
  model: z.string().optional(),
})

export const POST = withAuth(async ({ req }) => {
  const { prompt, model } = await parseBody(req, schema)
  const text = await geminiGenerate(prompt, model)
  return NextResponse.json({ text })
})
