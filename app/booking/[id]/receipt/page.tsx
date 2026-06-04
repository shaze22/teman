import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { translations, type Lang } from '@/lib/i18n'

const SERVICE_LABELS_BM: Record<string, string> = {
  job: 'Teman Kerja', food: 'Teman Makan', learning: 'Teman Belajar',
  business: 'Teman Bisnes', ibadah: 'Teman Ibadah', repair: 'Teman Repair',
  riadah: 'Teman Riadah', kombo: 'Teman Kombo',
}

const SERVICE_LABELS_EN: Record<string, string> = {
  job: 'Care Companion', food: 'Meal Companion', learning: 'Learning Companion',
  business: 'Business Companion', ibadah: 'Ibadah Companion', repair: 'Repair Companion',
  riadah: 'Riadah Companion', kombo: 'Kombo Companion',
}

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'bm') as Lang
  const t = translations[lang]
  const r = t.receipt

  const SERVICE_LABELS = lang === 'en' ? SERVICE_LABELS_EN : SERVICE_LABELS_BM

  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: b } = await supabaseAdmin
    .from('bookings')
    .select('*, customer:users!bookings_customer_id_fkey(full_name, email), provider:users!bookings_provider_id_fkey(full_name)')
    .eq('id', id)
    .single()

  if (!b) notFound()
  if (b.customer_id !== user.id) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customer = (b as any).customer as { full_name: string; email: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = (b as any).provider as { full_name: string }

  const discount = parseFloat(String((b as any).discount_amount ?? 0))
  const dateLocale = r.dateLocale as string

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Receipt #{b.booking_code} — Teman</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fff; padding: 40px 20px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #6366F1; padding-bottom: 20px; margin-bottom: 24px; }
          .brand { font-size: 24px; font-weight: 800; color: #6366F1; }
          .title { font-size: 14px; color: #6B7280; margin-top: 4px; }
          .code { font-size: 18px; font-weight: 700; color: #111; margin-top: 8px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9CA3AF; margin-bottom: 10px; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid #F3F4F6; }
          .row:last-child { border-bottom: none; }
          .row .label { color: #6B7280; }
          .row .value { font-weight: 500; color: #111; text-align: right; max-width: 60%; }
          .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 16px; font-weight: 700; border-top: 2px solid #6366F1; margin-top: 8px; }
          .total-row .label { color: #111; }
          .total-row .value { color: #6366F1; }
          .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #D1FAE5; color: #065F46; }
          .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #F3F4F6; padding-top: 20px; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none !important; }
          }
        `}</style>
      </head>
      <body>
        <div className="header">
          <div className="brand">❤ Teman</div>
          <div className="title">{r.title}</div>
          <div className="code">#{b.booking_code}</div>
        </div>

        <div className="section">
          <div className="section-title">{r.customerInfo}</div>
          <div className="row"><span className="label">{r.name}</span><span className="value">{customer.full_name}</span></div>
          <div className="row"><span className="label">{r.email}</span><span className="value">{customer.email}</span></div>
        </div>

        <div className="section">
          <div className="section-title">{r.temanInfo}</div>
          <div className="row"><span className="label">{r.temanName}</span><span className="value">{provider.full_name}</span></div>
        </div>

        <div className="section">
          <div className="section-title">{r.bookingInfo}</div>
          <div className="row"><span className="label">{r.service}</span><span className="value">{SERVICE_LABELS[b.service_type] ?? b.service_type}</span></div>
          <div className="row"><span className="label">{r.date}</span><span className="value">{new Date(b.scheduled_date).toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
          <div className="row"><span className="label">{r.time}</span><span className="value">{b.start_time}{b.duration_hours ? ` (${b.duration_hours} ${lang === 'en' ? 'hrs' : 'jam'})` : ''}</span></div>
          {b.location_address && <div className="row"><span className="label">{r.location}</span><span className="value">{b.location_address}</span></div>}
          <div className="row"><span className="label">{r.paymentStatus}</span><span className="value"><span className="badge">{b.payment_status === 'paid' ? r.paid : r.unpaid}</span></span></div>
        </div>

        <div className="section">
          <div className="section-title">{r.paymentSummary}</div>
          <div className="row"><span className="label">{r.providerFee}</span><span className="value">RM{parseFloat(String(b.provider_price)).toFixed(2)}</span></div>
          <div className="row"><span className="label">{r.platformFee}</span><span className="value">RM{parseFloat(String(b.platform_fee)).toFixed(2)}</span></div>
          {discount > 0 && <div className="row"><span className="label">{r.discount} ({(b as any).promo_code})</span><span className="value" style={{ color: '#059669' }}>-RM{discount.toFixed(2)}</span></div>}
          <div className="total-row"><span className="label">{r.total}</span><span className="value">RM{parseFloat(String(b.total_amount)).toFixed(2)}</span></div>
        </div>

        <div className="footer">
          <p>{r.thanks}</p>
          <p style={{ marginTop: '4px' }}>{r.generatedOn} {new Date().toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p style={{ marginTop: '4px' }}>teman-sigma.vercel.app</p>
        </div>

        <div className="no-print" style={{ marginTop: '32px', textAlign: 'center' }}>
          <button onClick={() => window.print()} style={{ padding: '12px 32px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            🖨 {r.print}
          </button>
        </div>
      </body>
    </html>
  )
}
