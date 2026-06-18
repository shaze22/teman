import { supabaseAdmin } from '@/lib/supabase/admin'
import type { DbNotification } from '@/lib/types'

export const notificationsRepo = {
  async create(data: {
    userId: string
    type: string
    title: string
    message?: string
    actionUrl?: string
    notifData?: Record<string, unknown>
    sentVia?: string[]
  }): Promise<void> {
    await supabaseAdmin.from('notifications').insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message ?? null,
      data: data.notifData ?? null,
      action_url: data.actionUrl ?? null,
      sent_via: data.sentVia ?? ['in_app'],
      is_read: false,
    })
  },

  async markRead(id: string, userId: string): Promise<void> {
    await supabaseAdmin.from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
  },

  async markAllRead(userId: string): Promise<void> {
    await supabaseAdmin.from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
  },

  async list(userId: string, limit = 20): Promise<DbNotification[]> {
    const { data } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return (data ?? []) as DbNotification[]
  },
}
