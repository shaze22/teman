import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import PromoForm from './_promo-form'
import PromoToggle from './_promo-toggle'

export default async function AdminPromoPage() {
  await requireAdmin()
  const { data: promos } = await supabaseAdmin.from('promo_codes').select('*').order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kod Promo</h1>
          <p className="text-sm text-gray-500 mt-1">{(promos ?? []).length} kod · {(promos ?? []).filter(p => p.is_active).length} aktif</p>
        </div>
        <PromoForm />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 border-b border-gray-100">
          <span className="pr-6">Kod</span>
          <span>Diskaun</span>
          <span className="px-4">Guna</span>
          <span className="px-4">Tamat</span>
          <span className="px-4">Status</span>
          <span></span>
        </div>
        {(promos ?? []).map((p) => (
          <div key={p.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 items-center px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
            <span className="font-mono font-bold text-gray-900 pr-6 text-sm">{p.code}</span>
            <span className="text-sm text-gray-700">
              {p.discount_type === 'percentage' ? `${p.discount_value}%` : `RM${parseFloat(String(p.discount_value)).toFixed(0)}`}
              {p.min_amount > 0 && <span className="text-xs text-gray-400 ml-1">(min RM{parseFloat(String(p.min_amount)).toFixed(0)})</span>}
            </span>
            <span className="text-sm text-gray-500 px-4">{p.uses_count}{p.max_uses ? `/${p.max_uses}` : ''}</span>
            <span className="text-sm text-gray-500 px-4">{p.valid_until ? new Date(p.valid_until).toLocaleDateString('ms-MY') : ' '}</span>
            <span className="px-4">
              <PromoToggle id={p.id} isActive={p.is_active} />
            </span>
            <PromoDelete id={p.id} />
          </div>
        ))}
        {(promos ?? []).length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">Tiada kod promo lagi</div>
        )}
      </div>
    </div>
  )
}

function PromoDelete({ id }: { id: string }) {
  return (
    <form action={async () => {
      'use server'
      const { supabaseAdmin: admin } = await import('@/lib/supabase/admin')
      await admin.from('promo_codes').delete().eq('id', id)
    }}>
      <button type="submit" className="px-2 py-1 text-xs text-red-400 hover:text-red-600 transition-colors">Padam</button>
    </form>
  )
}
