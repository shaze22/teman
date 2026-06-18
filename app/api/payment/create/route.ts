import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { paymentCheckout } from '@/lib/use-cases/payment-checkout'

const schema = z.object({ bookingId: z.string() })

export const POST = withAuth(async ({ user, req }) => {
  const { bookingId } = await parseBody(req, schema)
  const result = await paymentCheckout(bookingId, user.id)
  return NextResponse.json(result)
})
