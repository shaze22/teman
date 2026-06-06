import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM ?? 'Teman <noreply@teman.my>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function base(content: string) {
  return `<!DOCTYPE html>
<html lang="ms">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Teman</title></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <!-- Header -->
        <tr><td style="background:#6366F1;border-radius:16px 16px 0 0;padding:24px 32px">
          <span style="color:#fff;font-size:22px;font-weight:700">🤝 SenioCare</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#fff;padding:32px;border-radius:0 0 16px 16px;border:1px solid #E5E7EB;border-top:none">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 0;text-align:center;color:#9CA3AF;font-size:12px">
          © 2026 SenioCare · Platform Penjagaan Malaysia
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function btn(href: string, label: string, color = '#6366F1') {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#fff;font-weight:600;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;margin-top:20px">${label}</a>`
}

function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return Promise.resolve()
  return resend.emails.send({ from: FROM, to, subject, html }).catch(err => {
    console.error('[email]', subject, err)
  })
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function sendBookingNewProvider(opts: {
  to: string
  providerName: string
  customerName: string
  bookingCode: string
  bookingId: string
  scheduledDate: string
  serviceType: string
  totalAmount: number
}) {
  const SERVICE: Record<string, string> = {
    job: 'Teman Kerja / Penjagaan', food: 'Teman Makan',
    learning: 'Teman Belajar', business: 'Teman Bisnes',
  }
  const html = base(`
    <h2 style="color:#111827;margin:0 0 8px">Booking Baru!</h2>
    <p style="color:#6B7280;margin:0 0 20px">Hai ${opts.providerName}, anda ada permintaan booking baru.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">Pelanggan</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6">${opts.customerName}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">Perkhidmatan</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6">${SERVICE[opts.serviceType] ?? opts.serviceType}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">Tarikh</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6">${new Date(opts.scheduledDate).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280">No. Booking</td><td style="padding:8px 0;font-weight:600;text-align:right">${opts.bookingCode}</td></tr>
    </table>
    <p style="color:#6B7280;font-size:13px;margin:16px 0 0">Sila terima atau tolak dalam masa 24 jam.</p>
    ${btn(`${APP_URL}/booking/${opts.bookingId}`, 'Lihat & Sahkan Booking')}
  `)
  return sendEmail(opts.to, `📋 Booking Baru — ${opts.customerName}`, html)
}

export function sendBookingConfirmedCustomer(opts: {
  to: string
  customerName: string
  providerName: string
  providerPhone?: string
  bookingCode: string
  bookingId: string
  scheduledDate: string
  totalAmount: number
}) {
  function fmtWA(phone: string) {
    const c = phone.replace(/[\s\-\(\)\+]/g, '')
    if (c.startsWith('60')) return c
    if (c.startsWith('0')) return '60' + c.slice(1)
    return '60' + c
  }
  const waRow = opts.providerPhone ? `
    <tr><td style="padding:12px 0;border-bottom:1px solid #F3F4F6" colspan="2">
      <a href="https://wa.me/${fmtWA(opts.providerPhone)}?text=${encodeURIComponent(`Hai! Saya ${opts.customerName} - booking Teman #${opts.bookingCode} pada ${new Date(opts.scheduledDate).toLocaleDateString('ms-MY')} 😊`)}"
        style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;font-weight:600;font-size:13px;padding:10px 20px;border-radius:10px;text-decoration:none">
        WhatsApp ${opts.providerName.split(' ')[0]}
      </a>
    </td></tr>` : ''
  const html = base(`
    <h2 style="color:#111827;margin:0 0 8px">Booking Disahkan! ✅</h2>
    <p style="color:#6B7280;margin:0 0 20px">Hai ${opts.customerName}, booking anda telah diterima oleh ${opts.providerName}.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">Teman</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6">${opts.providerName}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">Tarikh</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6">${new Date(opts.scheduledDate).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">No. Booking</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6">${opts.bookingCode}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">Jumlah</td><td style="padding:8px 0;font-weight:700;text-align:right;color:#6366F1">RM${opts.totalAmount.toFixed(2)}</td></tr>
      ${waRow}
    </table>
    <p style="color:#6B7280;font-size:13px;margin:16px 0 0">Sila lengkapkan pembayaran untuk mengesahkan tempahan anda.</p>
    ${btn(`${APP_URL}/booking/${opts.bookingId}`, 'Bayar Sekarang', '#6366F1')}
  `)
  return sendEmail(opts.to, `✅ Booking Disahkan — ${opts.providerName}`, html)
}

export function sendBookingCancelledBoth(opts: {
  to: string
  name: string
  otherName: string
  bookingCode: string
  bookingId: string
  scheduledDate: string
  cancelledBy: 'customer' | 'provider'
}) {
  const who = opts.cancelledBy === 'customer' ? 'pelanggan' : 'teman'
  const html = base(`
    <h2 style="color:#111827;margin:0 0 8px">Booking Dibatalkan ❌</h2>
    <p style="color:#6B7280;margin:0 0 20px">Hai ${opts.name}, booking anda dengan ${opts.otherName} telah dibatalkan oleh ${who}.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">No. Booking</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6">${opts.bookingCode}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280">Tarikh Asal</td><td style="padding:8px 0;font-weight:600;text-align:right">${new Date(opts.scheduledDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
    </table>
    ${btn(`${APP_URL}/booking/${opts.bookingId}`, 'Lihat Butiran')}
  `)
  return sendEmail(opts.to, `❌ Booking Dibatalkan — #${opts.bookingCode}`, html)
}

export function sendPaymentReceiptCustomer(opts: {
  to: string
  customerName: string
  providerName: string
  bookingCode: string
  bookingId: string
  scheduledDate: string
  totalAmount: number
}) {
  const html = base(`
    <h2 style="color:#111827;margin:0 0 8px">Pembayaran Berjaya! 🎉</h2>
    <p style="color:#6B7280;margin:0 0 20px">Terima kasih ${opts.customerName}! Pembayaran anda telah diterima.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">Teman</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6">${opts.providerName}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">Tarikh Sesi</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6">${new Date(opts.scheduledDate).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">No. Booking</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6">${opts.bookingCode}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280">Jumlah Dibayar</td><td style="padding:8px 0;font-weight:700;text-align:right;color:#6366F1;font-size:18px">RM${opts.totalAmount.toFixed(2)}</td></tr>
    </table>
    <p style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px;color:#166534;font-size:13px;margin:20px 0 0">
      ✅ Booking anda telah disahkan sepenuhnya. Teman anda akan hadir pada tarikh yang ditetapkan.
    </p>
    ${btn(`${APP_URL}/booking/${opts.bookingId}`, 'Lihat Booking')}
  `)
  return sendEmail(opts.to, `🧾 Resit Pembayaran — RM${opts.totalAmount.toFixed(2)}`, html)
}

export function sendPaymentNotifyProvider(opts: {
  to: string
  providerName: string
  customerName: string
  bookingCode: string
  bookingId: string
  scheduledDate: string
  providerAmount: number
}) {
  const html = base(`
    <h2 style="color:#111827;margin:0 0 8px">Pembayaran Diterima! 💰</h2>
    <p style="color:#6B7280;margin:0 0 20px">Hai ${opts.providerName}, ${opts.customerName} telah membuat pembayaran untuk booking anda.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">Pelanggan</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6">${opts.customerName}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">Tarikh Sesi</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6">${new Date(opts.scheduledDate).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">No. Booking</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6">${opts.bookingCode}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280">Pendapatan Anda</td><td style="padding:8px 0;font-weight:700;text-align:right;color:#6366F1;font-size:18px">RM${opts.providerAmount.toFixed(2)}</td></tr>
    </table>
    <p style="color:#6B7280;font-size:13px;margin:16px 0 0">Sila bersedia dan hadir pada tarikh yang ditetapkan.</p>
    ${btn(`${APP_URL}/booking/${opts.bookingId}`, 'Lihat Booking')}
  `)
  return sendEmail(opts.to, `💰 Pembayaran Diterima — ${opts.customerName}`, html)
}

export function sendBookingCompletedCustomer(opts: {
  to: string
  customerName: string
  providerName: string
  bookingCode: string
  bookingId: string
}) {
  const html = base(`
    <h2 style="color:#111827;margin:0 0 8px">Sesi Selesai! 🎉</h2>
    <p style="color:#6B7280;margin:0 0 20px">Hai ${opts.customerName}, sesi bersama ${opts.providerName} telah selesai.</p>
    <p style="color:#6B7280;margin:0 0 16px">Kami harap anda berpuas hati. Kongsikan pengalaman anda dengan memberikan ulasan!</p>
    ${btn(`${APP_URL}/booking/${opts.bookingId}`, 'Beri Ulasan ⭐', '#F59E0B')}
  `)
  return sendEmail(opts.to, `🎉 Sesi Selesai — ${opts.providerName}`, html)
}

export function sendIcApproved(opts: { to: string; providerName: string }) {
  const html = base(`
    <h2 style="color:#111827;margin:0 0 8px">IC Anda Telah Disahkan! ✅</h2>
    <p style="color:#6B7280;margin:0 0 16px">Tahniah ${opts.providerName}! Kad pengenalan anda telah berjaya disahkan oleh admin SenioCare.</p>
    <p style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px;color:#166534;font-size:13px;margin:0 0 20px">
      🛡️ Badge "IC Verified" kini akan muncul pada profil awam anda — meningkatkan kepercayaan pelanggan.
    </p>
    ${btn(`${APP_URL}/dashboard/provider/profile`, 'Lihat Profil Saya')}
  `)
  return sendEmail(opts.to, '✅ IC Anda Telah Disahkan — SenioCare', html)
}

export function sendIcRejected(opts: { to: string; providerName: string; reason: string }) {
  const html = base(`
    <h2 style="color:#111827;margin:0 0 8px">IC Tidak Dapat Disahkan ❌</h2>
    <p style="color:#6B7280;margin:0 0 16px">Hai ${opts.providerName}, malangnya IC anda tidak dapat disahkan.</p>
    <p style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px;color:#991B1B;font-size:13px;margin:0 0 20px">
      <strong>Sebab:</strong> ${opts.reason}
    </p>
    <p style="color:#6B7280;font-size:13px;">Sila hantar semula dokumen yang lebih jelas melalui halaman profil anda.</p>
    ${btn(`${APP_URL}/dashboard/provider/profile`, 'Kemaskini Profil')}
  `)
  return sendEmail(opts.to, '❌ IC Tidak Dapat Disahkan — SenioCare', html)
}

export function sendBookingReminder(opts: {
  to: string; name: string; otherName: string; role: 'customer' | 'provider'
  bookingCode: string; bookingId: string; scheduledDate: string; startTime: string
}) {
  const isProvider = opts.role === 'provider'
  const html = base(`
    <h2 style="color:#0F0E17;font-size:20px;font-weight:700;margin:0 0 8px;">⏰ Peringatan Sesi Esok</h2>
    <p style="color:#6B7280;margin:0 0 20px;">Sesi anda dengan <strong>${opts.otherName}</strong> akan bermula esok.</p>
    <div style="background:#EEF2FF;border-radius:12px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:13px;color:#4B5563;"><strong>Booking:</strong> #${opts.bookingCode}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#4B5563;"><strong>Tarikh:</strong> ${new Date(opts.scheduledDate).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p style="margin:0;font-size:13px;color:#4B5563;"><strong>Masa:</strong> ${opts.startTime}</p>
    </div>
    <p style="color:#6B7280;font-size:13px;">
      ${isProvider ? 'Pastikan anda bersedia dan hadir tepat pada masa.' : 'Pastikan anda bersedia untuk menerima Meal Companion anda.'}
    </p>
    ${btn(`${APP_URL}/booking/${opts.bookingId}`, 'Lihat Booking')}
  `)
  return sendEmail(opts.to, `⏰ Peringatan — Sesi Esok #${opts.bookingCode}`, html)
}

export function sendRescheduleRequest(opts: {
  to: string; requesterName: string; otherName: string
  bookingCode: string; bookingId: string
  newDate: string; newTime: string
}) {
  const html = base(`
    <h2 style="color:#0F0E17;font-size:20px;font-weight:700;margin:0 0 8px;">📅 Permintaan Tukar Jadual</h2>
    <p style="color:#6B7280;margin:0 0 20px;"><strong>${opts.requesterName}</strong> meminta untuk menukar jadual booking <strong>#${opts.bookingCode}</strong>.</p>
    <div style="background:#FFF7ED;border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid #FED7AA;">
      <p style="margin:0 0 6px;font-size:13px;color:#4B5563;"><strong>Tarikh Baru:</strong> ${new Date(opts.newDate).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p style="margin:0;font-size:13px;color:#4B5563;"><strong>Masa Baru:</strong> ${opts.newTime}</p>
    </div>
    <p style="color:#6B7280;font-size:13px;">Sila semak dan terima atau tolak permintaan ini dalam apl.</p>
    ${btn(`${APP_URL}/booking/${opts.bookingId}`, 'Semak Permintaan')}
  `)
  return sendEmail(opts.to, `📅 Permintaan Tukar Jadual — #${opts.bookingCode}`, html)
}

export function sendRescheduleResponse(opts: {
  to: string; responderName: string; bookingCode: string; bookingId: string
  accepted: boolean; newDate?: string; newTime?: string
}) {
  const html = base(`
    <h2 style="color:#0F0E17;font-size:20px;font-weight:700;margin:0 0 8px;">
      ${opts.accepted ? '✅ Tukar Jadual Diterima' : '❌ Tukar Jadual Ditolak'}
    </h2>
    <p style="color:#6B7280;margin:0 0 20px;">
      <strong>${opts.responderName}</strong> telah ${opts.accepted ? 'menerima' : 'menolak'} permintaan tukar jadual untuk booking <strong>#${opts.bookingCode}</strong>.
    </p>
    ${opts.accepted && opts.newDate ? `
    <div style="background:#ECFDF5;border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid #6EE7B7;">
      <p style="margin:0 0 6px;font-size:13px;color:#4B5563;"><strong>Tarikh Baru:</strong> ${new Date(opts.newDate).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p style="margin:0;font-size:13px;color:#4B5563;"><strong>Masa Baru:</strong> ${opts.newTime}</p>
    </div>` : ''}
    ${btn(`${APP_URL}/booking/${opts.bookingId}`, 'Lihat Booking')}
  `)
  return sendEmail(opts.to, `${opts.accepted ? '✅' : '❌'} Tukar Jadual — #${opts.bookingCode}`, html)
}
