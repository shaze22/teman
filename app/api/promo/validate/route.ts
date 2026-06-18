import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { code, amount } = await request.json()
  if (!code) return NextResponse.json({ message: 'Promo code is required' }, { status: 400 })

  const parsedAmount = typeof amount === 'number' ? amount : parseFloat(String(amount))
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ message: 'Invalid booking amount' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const { data: promo } = await supabaseAdmin
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single()

  if (!promo) return NextResponse.json({ message: 'Invalid or expired promo code' }, { status: 400 })
  if (promo.valid_until && promo.valid_until < now) return NextResponse.json({ message: 'Promo code has expired' }, { status: 400 })
  if (promo.max_uses != null && promo.uses_count >= promo.max_uses) return NextResponse.json({ message: 'Promo code has reached its usage limit' }, { status: 400 })

  const minAmount = parseFloat(String(promo.min_amount ?? 0))
  if (parsedAmount < minAmount) {
    return NextResponse.json({ message: `Minimum booking amount RM${minAmount.toFixed(0)} required for this code` }, { status: 400 })
  }

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
}
