import { supabaseAdmin } from '@/lib/supabase/admin'
import { Errors } from '@/lib/errors'
import type { DbBooking, BookingStatus } from '@/lib/types'

export const bookingsRepo = {
  async findById(id: string): Promise<DbBooking> {
    const { data, error } = await supabaseAdmin
      .from('bookings').select('*').eq('id', id).single()
    if (error || !data) throw Errors.notFound('Booking')
    return data as DbBooking
  },

  async findByIdWithParties(id: string) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        customer_id, provider_id, status, booking_code, scheduled_date, start_time,
        total_amount, provider_price, payment_status, payment_method, service_type, funds_released,
        customer:users!bookings_customer_id_fkey(full_name),
        provider:users!bookings_provider_id_fkey(full_name, phone)
      `)
      .eq('id', id)
      .single()
    if (error || !data) throw Errors.notFound('Booking')
    return data
  },

  async create(data: Record<string, unknown>): Promise<{ id: string; booking_code: string }> {
    const { data: created, error } = await supabaseAdmin
      .from('bookings')
      .insert({ id: crypto.randomUUID(), ...data })
      .select('id, booking_code')
      .single()
    if (error || !created) throw Errors.serverError('Failed to create booking')
    return created as { id: string; booking_code: string }
  },

  async update(id: string, data: Record<string, unknown>): Promise<void> {
    const { error } = await supabaseAdmin.from('bookings')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw Errors.serverError(error.message)
  },

  async updateStatus(id: string, status: BookingStatus, extra?: Record<string, unknown>): Promise<void> {
    await supabaseAdmin.from('bookings')
      .update({ status, ...extra, updated_at: new Date().toISOString() })
      .eq('id', id)
  },

  async getByStripeSession(sessionId: string): Promise<{ id: string; payment_status: string; service_type: string } | null> {
    const { data } = await supabaseAdmin
      .from('bookings')
      .select('id, payment_status, service_type')
      .eq('stripe_session_id', sessionId)
      .maybeSingle()
    return data
  },

  async getPaymentTransaction(bookingId: string): Promise<{ id: string; transaction_id: string } | null> {
    const { data } = await supabaseAdmin
      .from('payments')
      .select('id, transaction_id')
      .eq('booking_id', bookingId)
      .eq('status', 'paid')
      .maybeSingle()
    return data
  },

  async countCompleted(providerId: string): Promise<number> {
    const { count } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', providerId)
      .eq('status', 'completed')
    return count ?? 0
  },
}
