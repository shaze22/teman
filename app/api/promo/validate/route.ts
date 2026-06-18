import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/api/handler'
import { Errors } from '@/lib/errors'

export const POST = withAuth(async ({ req }) => {
  const { code, amount } = await req.json()
  if (!code) throw Errors.badRequest('Promo code is required')

  const parsedAmount = typeof amount === 'number' ? amount : parseFloat(String(amount))
  if (isNaN(parsedAmount) || parsedAmount <= 0) throw Errors.badRequest('Invalid booking amount')

  const now = new Date().toISOString()
  const { data: promo } = await supabaseAdmin
    .from('promo_codes').select('*')
    .eq('code', code.toUpperCase().trim()).eq('is_active', true).single()

  if (!promo) throw Errors.badRequest('Invalid or expired promo code')
  if (promo.valid_until && promo.valid_until < now) throw Errors.badRequest('Promo code has expired')
  if (promo.max_uses != null && promo.uses_count >= promo.max_uses)
    throw Errors.badRequest('Promo code has reached its usage limit')

  const minAmount = parseFloat(String(promo.min_amount ?? 0))
  if (parsedAmount < minAmount)
    throw Errors.badRequest(`Minimum booking amount RM${minAmount.toFixed(0)} required for this code`)

  const discount = promo.discount_type === 'percentage'
    ? Math.min(parsedAmount * (parseFloat(String(promo.discount_value)) / 100), parsedAmount)
    : Math.min(parseFloat(String(promo.discount_value)), parsedAmount)

  return NextResponse.json({
    valid: true,
    discount: Math.round(discount * 100) / 100,
    discountType: promo.discount_type,
    discountValue: parseFloat(String(promo.discount_value)),
    code: promo.code,
  })
})
