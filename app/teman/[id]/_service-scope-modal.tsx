'use client'

import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'

type PricingItem = { id: string; service_type: string; pricing_type: string; price: number }

interface Props {
  pricing: PricingItem[]
  pricingLabels: Record<string, string>
  serviceLabels: Record<string, string>
  serviceScope: Record<string, { desc: string; items: string[] }>
}

export default function ServiceScopeModal({ pricing, pricingLabels, serviceLabels, serviceScope }: Props) {
  const [open, setOpen] = useState<string | null>(null)
  const scope = open ? serviceScope[open] : null

  return (
    <>
      <div className="space-y-2.5 mb-4">
        {pricing.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm text-gray-700 font-medium truncate">
                {serviceLabels[p.service_type] ?? p.service_type}
              </span>
              {serviceScope[p.service_type] && (
                <button
                  onClick={() => setOpen(p.service_type)}
                  title="Lihat skop perkhidmatan"
                  className="text-gray-300 hover:text-[#6366F1] transition-colors flex-shrink-0">
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="font-bold text-[#6366F1] whitespace-nowrap flex-shrink-0">
              RM{parseFloat(String(p.price)).toFixed(0)}
              <span className="text-xs text-gray-400 font-normal">/{pricingLabels[p.pricing_type] ?? p.pricing_type}</span>
            </span>
          </div>
        ))}
      </div>

      {open && scope && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900">{serviceLabels[open] ?? open}</h3>
              <button onClick={() => setOpen(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{scope.desc}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Skop termasuk:</p>
            <ul className="space-y-2 mb-5">
              {scope.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-[#6366F1] font-bold mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <button onClick={() => setOpen(null)}
              className="w-full py-2.5 bg-[#6366F1] text-white rounded-xl font-medium text-sm hover:bg-[#4F46E5] transition-colors">
              Faham, tutup
            </button>
          </div>
        </div>
      )}
    </>
  )
}
