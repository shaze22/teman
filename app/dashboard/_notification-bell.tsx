'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Notif = {
  id: string
  type: string
  title: string
  message: string | null
  action_url: string | null
  is_read: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  booking_new: '📋',
  booking_confirmed: '✅',
  booking_cancelled: '❌',
  booking_checkin: '🏃',
  booking_completed: '🎉',
  review_received: '⭐',
  sos_triggered: '🆘',
  sos_resolved: '🛡️',
  new_message: '💬',
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'Baru sahaja'
  if (diff < 3600) return `${Math.floor(diff / 60)} min lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

export default function NotificationBell({ userId, accentColor = '#6366F1' }: { userId: string; accentColor?: string }) {
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifs.filter(n => !n.is_read).length

  const fetchNotifs = useCallback(async () => {
    const res = await fetch('/api/notifications')
    if (res.ok) setNotifs(await res.json())
  }, [])

  useEffect(() => {
    fetchNotifs()

    // Real-time subscription via Supabase
    const supabase = createClient()
    const channel = supabase
      .channel(`notifs:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifs(prev => [payload.new as Notif, ...prev.slice(0, 29)])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchNotifs])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function markRead(id: string, actionUrl: string | null) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (actionUrl) {
      setOpen(false)
      router.push(actionUrl)
    }
  }

  async function markAllRead() {
    setLoading(true)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    await fetch('/api/notifications/read-all', { method: 'PATCH' })
    setLoading(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none"
            style={{ backgroundColor: accentColor }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: accentColor }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} disabled={loading}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <CheckCheck className="w-3.5 h-3.5" /> Baca semua
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm text-gray-400">Tiada notifikasi</p>
              </div>
            ) : (
              notifs.map(n => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id, n.action_url)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {n.title}
                    </div>
                    {n.message && (
                      <div className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: accentColor }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
