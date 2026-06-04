import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/push'

type NotifPayload = {
  userId: string
  type: string
  title: string
  message?: string
  actionUrl?: string
  data?: Record<string, unknown>
}

export async function createNotification(payload: NotifPayload) {
  await supabaseAdmin.from('notifications').insert({
    id: crypto.randomUUID(),
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message ?? null,
    action_url: payload.actionUrl ?? null,
    data: payload.data ?? null,
    is_read: false,
    created_at: new Date().toISOString(),
  })
  sendPushToUser(payload.userId, {
    title: payload.title,
    body: payload.message ?? '',
    url: payload.actionUrl,
  }).catch(() => {})
}

export async function notifyBookingStatusChange({
  bookingId, bookingCode, status, customerId, providerId, customerName, providerName,
}: {
  bookingId: string
  bookingCode: string
  status: string
  customerId: string
  providerId: string
  customerName: string
  providerName: string
}) {
  const url = `/booking/${bookingId}`

  const notifs: NotifPayload[] = []

  switch (status) {
    case 'confirmed':
      notifs.push({
        userId: customerId,
        type: 'booking_confirmed',
        title: 'Booking Disahkan! 🎉',
        message: `${providerName} telah mengesahkan booking anda (${bookingCode}).`,
        actionUrl: url,
        data: { bookingId, bookingCode },
      })
      break

    case 'cancelled':
      notifs.push({
        userId: customerId,
        type: 'booking_cancelled',
        title: 'Booking Dibatalkan',
        message: `Booking ${bookingCode} telah dibatalkan.`,
        actionUrl: url,
        data: { bookingId, bookingCode },
      })
      notifs.push({
        userId: providerId,
        type: 'booking_cancelled',
        title: 'Booking Dibatalkan',
        message: `Booking ${bookingCode} dengan ${customerName} telah dibatalkan.`,
        actionUrl: url,
        data: { bookingId, bookingCode },
      })
      break

    case 'in_progress':
      notifs.push({
        userId: customerId,
        type: 'booking_checkin',
        title: 'Sesi Bermula 🏃',
        message: `${providerName} telah check-in. Sesi anda sedang berjalan.`,
        actionUrl: url,
        data: { bookingId, bookingCode },
      })
      break

    case 'completed':
      notifs.push({
        userId: customerId,
        type: 'booking_completed',
        title: 'Sesi Selesai — Sila Sahkan ✅',
        message: `Sesi dengan ${providerName} telah tamat. Sila sahkan untuk lepaskan bayaran.`,
        actionUrl: url,
        data: { bookingId, bookingCode },
      })
      notifs.push({
        userId: providerId,
        type: 'booking_completed',
        title: 'Sesi Selesai — Menunggu Pengesahan 🕐',
        message: `Sesi dengan ${customerName} selesai. Menunggu pelanggan sahkan untuk lepaskan bayaran.`,
        actionUrl: url,
        data: { bookingId, bookingCode },
      })
      break
  }

  await Promise.all(notifs.map(createNotification))
}

export async function notifyNewBooking({
  bookingId, bookingCode, providerId, customerName, scheduledDate,
}: {
  bookingId: string
  bookingCode: string
  providerId: string
  customerName: string
  scheduledDate: string
}) {
  const date = new Date(scheduledDate).toLocaleDateString('ms-MY')
  await createNotification({
    userId: providerId,
    type: 'booking_new',
    title: 'Booking Baru! 📋',
    message: `${customerName} telah membuat booking untuk ${date}. Sila sahkan atau tolak.`,
    actionUrl: `/booking/${bookingId}`,
    data: { bookingId, bookingCode },
  })
}

export async function notifyFundsReleased({
  bookingId, bookingCode, providerId, amount,
}: {
  bookingId: string
  bookingCode: string
  providerId: string
  amount: number
}) {
  await createNotification({
    userId: providerId,
    type: 'funds_released',
    title: 'Bayaran Dilepaskan! 💰',
    message: `RM${amount.toFixed(2)} daripada booking #${bookingCode} telah dikreditkan ke wallet anda.`,
    actionUrl: `/dashboard/provider/earnings`,
    data: { bookingId, bookingCode, amount },
  })
}

export async function notifyReviewReceived({
  providerId, customerName, rating, bookingId,
}: {
  providerId: string
  customerName: string
  rating: number
  bookingId: string
}) {
  const stars = '⭐'.repeat(rating)
  await createNotification({
    userId: providerId,
    type: 'review_received',
    title: 'Ulasan Baru Diterima',
    message: `${customerName} memberi rating ${stars} (${rating}/5) kepada anda.`,
    actionUrl: `/booking/${bookingId}`,
    data: { bookingId, rating },
  })
}
