import { supabaseAdmin } from '@/lib/supabase/admin'
import { Errors } from '@/lib/errors'
import type { DbProviderProfile, DbProviderPricing } from '@/lib/types'

export const providersRepo = {
  async findProfileByUserId(userId: string): Promise<DbProviderProfile> {
    const { data, error } = await supabaseAdmin
      .from('provider_profiles').select('*').eq('user_id', userId).single()
    if (error || !data) throw Errors.notFound('Provider profile')
    return data as DbProviderProfile
  },

  async findProfileById(id: string): Promise<DbProviderProfile> {
    const { data, error } = await supabaseAdmin
      .from('provider_profiles').select('*').eq('id', id).single()
    if (error || !data) throw Errors.notFound('Provider profile')
    return data as DbProviderProfile
  },

  async findProfileByUserIdOrNull(userId: string): Promise<DbProviderProfile | null> {
    const { data } = await supabaseAdmin
      .from('provider_profiles').select('*').eq('user_id', userId).maybeSingle()
    return data as DbProviderProfile | null
  },

  async updateProfile(id: string, data: Record<string, unknown>): Promise<void> {
    await supabaseAdmin.from('provider_profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
  },

  async getPricingForService(profileId: string, serviceType: string): Promise<DbProviderPricing | null> {
    const { data } = await supabaseAdmin
      .from('provider_pricing')
      .select('*')
      .eq('profile_id', profileId)
      .eq('service_type', serviceType)
      .eq('is_active', true)
      .maybeSingle()
    return data as DbProviderPricing | null
  },

  async getAllPricing(profileId: string): Promise<DbProviderPricing[]> {
    const { data } = await supabaseAdmin
      .from('provider_pricing')
      .select('*')
      .eq('profile_id', profileId)
      .eq('is_active', true)
    return (data ?? []) as DbProviderPricing[]
  },

  async createPricing(entries: Array<Record<string, unknown>>): Promise<void> {
    await supabaseAdmin.from('provider_pricing').insert(entries)
  },

  async approveLicense(profileId: string, adminId: string): Promise<void> {
    const now = new Date().toISOString()
    await supabaseAdmin.from('provider_profiles').update({
      license_verified: true,
      license_verified_at: now,
      license_verified_by: adminId,
      license_rejection_reason: null,
      is_available: true,
      updated_at: now,
    }).eq('id', profileId)
  },

  async rejectLicense(profileId: string, adminId: string, reason: string): Promise<void> {
    const now = new Date().toISOString()
    await supabaseAdmin.from('provider_profiles').update({
      license_verified: false,
      license_verified_at: now,
      license_verified_by: adminId,
      license_rejection_reason: reason,
      is_available: false,
      updated_at: now,
    }).eq('id', profileId)
  },
}
