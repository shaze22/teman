import { NextRequest, NextResponse } from 'next/server'
import { withPublic } from '@/lib/api/handler'
import { stripe } from '@/lib/stripe'
import { handlePaymentWebhook } from '@/lib/use-cases/payment-webhook'

export const POST = withPublic(async (req: NextRequest) => {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET)
    return NextResponse.json({ message: 'Missing signature' }, { status: 400 })

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook signature failed'
    return NextResponse.json({ message: msg }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { bookingId, userId } = session.metadata ?? {}

    if (!bookingId) return NextResponse.json({ ok: true })

    await handlePaymentWebhook(session.id, bookingId, userId ?? '')
  }

  return NextResponse.json({ ok: true })
})
