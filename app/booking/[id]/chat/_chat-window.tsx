'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  senderId: string
  content: string
  isRead: boolean
  createdAt: string
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })
}

type Props = {
  bookingId: string
  userId: string
  initialMessages: Message[]
  canSend: boolean
  otherName: string
}

export default function ChatWindow({ bookingId, userId, initialMessages, canSend, otherName }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom
  const scrollDown = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollDown() }, [messages, scrollDown])

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`chat:${bookingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_messages',
        filter: `booking_id=eq.${bookingId}`,
      }, (payload) => {
        const m = payload.new as any
        const newMsg: Message = {
          id: m.id,
          senderId: m.sender_id,
          content: m.content,
          isRead: m.is_read,
          createdAt: m.created_at,
        }
        setMessages(prev => {
          if (prev.some(p => p.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [bookingId])

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    const content = input.trim()
    if (!content || sending) return

    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId, senderId: userId, content,
      isRead: false, createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')
    setSending(true)

    const res = await fetch(`/api/booking/${bookingId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (res.ok) {
      const saved: any = await res.json()
      setMessages(prev => prev.map(m => m.id === tempId ? {
        id: saved.id, senderId: saved.sender_id, content: saved.content,
        isRead: saved.is_read, createdAt: saved.created_at,
      } : m))
    } else {
      // Rollback optimistic
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setInput(content)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Group messages by date
  type Group = { date: string; messages: Message[] }
  const groups: Group[] = []
  for (const m of messages) {
    const date = new Date(m.createdAt).toDateString()
    const last = groups[groups.length - 1]
    if (last && last.date === date) { last.messages.push(m) }
    else { groups.push({ date, messages: [m] }) }
  }

  function dateSeparatorLabel(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return 'Hari ini'
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Semalam'
    return d.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-4xl mb-3">💬</div>
            <div className="font-semibold text-gray-900 mb-1">Tiada mesej lagi</div>
            <div className="text-sm text-gray-500">Mulakan perbualan dengan {otherName}</div>
          </div>
        )}

        {groups.map(group => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">{dateSeparatorLabel(group.date)}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {group.messages.map((m, i) => {
              const isMe = m.senderId === userId
              const prev = group.messages[i - 1]
              const showAvatar = !isMe && (!prev || prev.senderId !== m.senderId)
              return (
                <div key={m.id} className={`flex items-end gap-2 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${showAvatar ? 'bg-[#6366F1] text-white' : 'opacity-0'}`}>
                      {otherName.charAt(0)}
                    </div>
                  )}
                  <div className={`max-w-[72%] group`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isMe
                        ? 'bg-[#6366F1] text-white rounded-br-sm'
                        : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm shadow-sm'
                    } ${m.id.startsWith('temp-') ? 'opacity-70' : ''}`}>
                      {m.content}
                    </div>
                    <div className={`text-[10px] text-gray-400 mt-0.5 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                      {formatTime(m.createdAt)}
                      {isMe && !m.id.startsWith('temp-') && (
                        <span className="ml-1">{m.isRead ? '✓✓' : '✓'}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {canSend ? (
        <div className="border-t border-gray-100 bg-white px-4 py-3">
          <form onSubmit={sendMessage} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Mesej kepada ${otherName}…`}
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all max-h-32 overflow-y-auto"
              style={{ minHeight: '44px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-11 h-11 bg-[#6366F1] text-white rounded-2xl flex items-center justify-center hover:bg-[#4F46E5] disabled:opacity-40 transition-colors flex-shrink-0"
            >
              {sending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-1.5 px-1">Enter untuk hantar · Shift+Enter untuk baris baru</p>
        </div>
      ) : (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-center text-sm text-gray-400">
          Booking telah ditamatkan — chat tidak lagi aktif
        </div>
      )}
    </div>
  )
}
