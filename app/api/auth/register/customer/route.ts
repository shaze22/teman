import { NextResponse } from 'next/server'
import { withPublic } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { registerCustomer, registerCustomerSchema } from '@/lib/use-cases/register-customer'

export const POST = withPublic(async (req) => {
  const input = await parseBody(req, registerCustomerSchema)
  await registerCustomer(input)
  return NextResponse.json({ success: true })
})
