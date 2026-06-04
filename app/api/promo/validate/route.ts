import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Perlu log masuk' }, { status: 401 })

  const { code, amount } = await request.json()
  if (!code) return NextResponse.json({ message: 'Kod promo diperlukan' }, { status: 400 })

  const now = new Date().toISOString()
  const { data: promo } = await supabaseAdmin
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single()

  if (!promo) return NextResponse.json({ message: 'Kod promo tidak sah atau telah tamat' }, { status: 400 })
  if (promo.valid_until && promo.valid_until < now) return NextResponse.json({ message: 'Kod promo telah tamat tempoh' }, { status: 400 })
  if (promo.max_uses != null && promo.uses_count >= promo.max_uses) return NextResponse.json({ message: 'Kod promo telah habis digunakan' }, { status: 400 })
  if (amount < parseFloat(String(promo.min_amount))) {
    return NextResponse.json({ message: `Minimum pembelian RM${parseFloat(String(promo.min_amount)).toFixed(0)} untuk kod ini` }, { status: 400 })
  }

  const discount = promo.discount_type === 'percentage'
    ? Math.min(amount * (parseFloat(String(promo.discount_value)) / 100), amount)
    : Math.min(parseFloat(String(promo.discount_value)), amount)

  return NextResponse.json({
    valid: true,
    discount: Math.round(discount * 100) / 100,
    discountType: promo.discount_type,
    discountValue: parseFloat(String(promo.discount_value)),
    code: promo.code,
  })
}
