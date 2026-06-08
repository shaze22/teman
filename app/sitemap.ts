import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://seniocare.app'
  const now = new Date().toISOString()

  const staticPages: MetadataRoute.Sitemap = [
    { url: base,                    lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/search`,        lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${base}/how-it-works`,  lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/about`,         lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/register`,      lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/login`,         lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/terms`,         lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/privacy`,       lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]

  // Dynamic companion profile pages
  const { data: profiles } = await supabaseAdmin
    .from('single_mother_profiles')
    .select('id, updated_at')
    .eq('is_active', true)
    .limit(500)

  const companionPages: MetadataRoute.Sitemap = (profiles ?? []).map(p => ({
    url: `${base}/carer/${p.id}`,
    lastModified: p.updated_at ?? now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...companionPages]
}
