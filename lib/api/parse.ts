import { type ZodSchema } from 'zod'
import { AppError } from '@/lib/errors'
import { NextRequest } from 'next/server'

export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw new AppError('Invalid JSON body', 400)
  }
  const result = schema.safeParse(body)
  if (!result.success) {
    const msg = result.error.issues[0]?.message ?? 'Validation failed'
    throw new AppError(msg, 400)
  }
  return result.data
}

export function parseQuery<T>(searchParams: URLSearchParams, schema: ZodSchema<T>): T {
  const obj = Object.fromEntries(searchParams.entries())
  const result = schema.safeParse(obj)
  if (!result.success) {
    const msg = result.error.issues[0]?.message ?? 'Invalid query parameters'
    throw new AppError(msg, 400)
  }
  return result.data
}
