import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Heart, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ChatWindow from './_chat-window'

export default async function BookingChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: b } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, booking_code, status,
      customer:users!bookings_customer_id_fkey(id, full_name),
      provider:users!bookings_provider_id_fkey(id, full_name)
    `)
    .eq('id', id)
    .single()

  if (!b) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bk = b as any
  const isCustomer = bk.customer?.id === user.id
  const isProvider = bk.provider?.id === user.id
  if (!isCustomer && !isProvider) notFound()

  const otherName: string = isCustomer ? bk.provider?.full_name : bk.customer?.full_name
  const otherInitial: string = otherName?.charAt(0) ?? '?'

  // Fetch initial messages
  const { data: initialMessages } = await supabaseAdmin
    .from('booking_messages')
    .select('id, sender_id, content, is_read, created_at')
    .eq('booking_id', id)
    .order('created_at', { ascending: true })
    .limit(100)

  // Mark messages from other party as read
  await supabaseAdmin
    .from('booking_messages')
    .update({ is_read: true })
    .eq('booking_id', id)
    .neq('sender_id', user.id)
    .eq('is_read', false)

  const canSend = !['cancelled', 'refunded'].includes(bk.status)

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href={`/booking/${id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {otherInitial}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{otherName}</div>
            <div className="text-xs text-gray-500">Booking {bk.booking_code}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#0D9488] flex items-center justify-center">
                <Heart className="w-3 h-3 text-white" fill="currentColor" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col">
        <ChatWindow
          bookingId={id}
          userId={user.id}
          initialMessages={(initialMessages ?? []).map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            content: m.content,
            isRead: m.is_read,
            createdAt: m.created_at,
          }))}
          canSend={canSend}
          otherName={otherName}
        />
      </div>
    </div>
  )
}
