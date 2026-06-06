@AGENTS.md

# SenioCare — Project Context

## Apa itu SenioCare?
Malaysian marketplace menghubungkan ibu tunggal (provider/Teman) dengan warga emas (pelanggan) dan keluarga penjaga (waris). Dulu bernama "Teman", kini rebrand ke "SenioCare" dengan domain seniocare.app.

## Tech Stack
- **Next.js 16.2.6** (App Router, Turbopack) — ada breaking changes dari v15
- TypeScript + Tailwind CSS v4
- Supabase (Auth + PostgreSQL) via `@supabase/ssr`
- Prisma 7.8.0 — config: `prisma.config.ts`, generated client: `app/generated/prisma/client`
- Stripe (payments), Resend (email)
- Google Gemini `gemini-2.5-flash` via `lib/gemini.ts`
- Vercel (deployment)

## Peraturan Wajib Next.js 16
- `params` adalah `Promise<{...}>` — **mesti `await params`**
- Tiada `middleware.ts` — guna `proxy.ts`
- Baca `node_modules/next/dist/docs/` sebelum tulis code baru

## Peraturan Umum
1. **Jangan panggil Stripe/Gemini/Supabase service role dari client** — guna API routes
2. **Semua UI text dalam Bahasa Malaysia**
3. **Prisma 7** — ada breaking changes, semak docs sebelum guna
4. **Tiada `middleware.ts`** — renamed ke `proxy.ts` dalam Next.js 16

## Struktur Projek
```
app/
  (auth)/             — Login/register pages
  api/
    booking/          — Booking CRUD
    gemini/           — AI endpoint
    payment/          — Stripe checkout + webhook
    providers/        — Provider listing/search
    [dan lain-lain]
  dashboard/          — Seller + buyer dashboard
  book/               — Booking flow
  search/             — Cari provider
  carer/[id]/         — Profil provider (dulu /teman/[id]/)
lib/
  gemini.ts           — geminiGenerate(), geminiGenerateJSON()
  prisma.ts           — Prisma client
  stripe.ts           — Stripe helpers
  email.ts            — Resend email
  supabase/           — Server + client Supabase
prisma/
  schema.prisma       — Database schema
proxy.ts              — Auth middleware (bukan middleware.ts!)
```

## Warna
- Primary: Indigo `#6366F1`
- Secondary: Rose `#F43F5E`
- Background: Dark `#0F0E17`

## Gemini AI
```typescript
import { geminiGenerate, geminiGenerateJSON } from '@/lib/gemini'
// Model: gemini-2.5-flash (jangan guna gemini-2.0-flash — deprecated)
```

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL, DIRECT_URL
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
RESEND_API_KEY, EMAIL_FROM
GEMINI_API_KEY
NEXT_PUBLIC_APP_URL
```

## Deployment
```bash
vercel deploy --prod --force --scope syedshazni-7682s-projects
```
Live: **https://seniocare.app** (domain utama, aktif 2026-06-04)
Backup: https://teman-sigma.vercel.app

## Environment Variables (Vercel)
- `NEXT_PUBLIC_APP_URL=https://seniocare.app`
- Stripe webhook: `https://seniocare.app/api/payment/webhook` (ID: `we_1TacHVCCttq0bxpO5qZ4p2ua`)

## User Roles (UserRole enum)
| Role | Hala tuju | Daftar di |
|---|---|---|
| `single_mother` | `/dashboard/provider` | `/register/provider` |
| `customer` | `/dashboard/customer` | `/register/customer` (is_for_self=true) |
| `waris` | `/dashboard/customer` | `/register/customer` (is_for_self=false) |
| `ngo_admin` | `/dashboard/ngo` | `/register/ngo` |
| `care_center` | `/dashboard/care-center` | `/register/care-center` |
| `super_admin` | `/admin` | — |

## Pusat Penjagaan (care_center)
- Table: `care_center_profiles` — center_name, center_type, address, pic_name, resident_capacity, is_verified
- Booking: field `recipient_name` (nama penghuni), `booked_by_care_center`
- Admin verify: `/admin/care-centers` → POST `/api/admin/care-centers/verify`
- Status `pending` until admin verify → then `active`

## Locum Professional (single_mother_profiles)
- Fields: `is_locum`, `locum_cert_type`, `locum_cert_url`, `locum_verified`, `locum_verified_at`
- Provider upload sijil: `/dashboard/provider/profile` → section Locum
- API upload: `POST /api/profile/provider/locum-cert` → `{ certType, file }`
- API verify: `POST /api/admin/providers/verify-locum` → `{ profileId, action: 'approve'|'reject' }`
- Search filter: `?locum=1` → hanya locum_verified providers
- Service type `medical_care` hanya visible dalam booking form jika provider is_locum + locum_verified
- Badge `🩺 Locum ✓` dalam search cards + `/carer/[id]` profile page

## GTM Pivot (2026-06-04)
- **Servis aktif:** `food` (Teman Makan) sahaja — semua lain `active: false` → "Segera Hadir" di UI
- **Companion role:** Terbuka kepada semua warganegara Malaysia 18+, bukan lagi single mother sahaja
- **UI term:** "Meal Companion" untuk provider/companion role dan nama servis aktif (bukan "Rakan Teman" atau "Teman Makan")
- **Verification:** IC + selfie real-time (Fasa 2) — bukan NGO
- **`/register/companion`** → redirect ke `/register/provider` sementara (Fasa 2 bina flow baru)
- `lib/services.ts` ada `active` flag — hanya `food: true`

## Branding Rules
- Guna **"Meal Companion"** untuk peranan provider/companion dan nama servis aktif dalam semua UI text (BM dan EN)
- "Rakan Teman" dan "Teman Makan" tidak digunakan lagi sebagai label branding
- Map default: center KL (3.139, 101.687), zoom 11

## Skill Tags
- Skill categories dalam DB: `cooking`, `sewing`, `massage`, `elderly_care`, `cleaning`, `teaching`, `companionship`, `shopping`, `other`
- Map ke i18n via `t.skills[skillCategory]` — semua ada label termasuk `other` → "Kemahiran Lain"

## Booking Form Service Filter
- `/api/providers/[id]/profile` returns `activeServiceTypes: string[]`
- Booking form filter SERVICE_TYPES to only active ones for that provider
- `medical_care` only shown if `is_locum && locum_verified`

## Encoding Notes
- PowerShell `Set-Content -Encoding utf8` adds BOM — jangan guna untuk edit files
- Emoji corruption: bytes misread sebagai Windows-1252 — fix guna binary replacement Node.js
- Corrupted emoji pattern: `ðŸ...` = UTF-8 bytes dibaca sebagai Latin-1 lalu di-encode semula

## Fasa 2 — Companion Registration (SELESAI)
- `/register/companion` — 5-step wizard (Info Asas → IC Upload → Selfie → Gemini Verify → Consent)
- Selfie capture: `getUserMedia` + canvas dalam browser, save sebagai File/Blob
- `POST /api/auth/register/companion/verify` — Gemini compare IC+selfie (base64, no auth required)
- `POST /api/auth/register/companion` — FormData: userId, form fields, IC files, selfie file
  - Creates Supabase auth user (role: companion)
  - Uploads IC+selfie ke `ic-documents/{userId}/` bucket
  - Creates `single_mother_profiles` dengan `ic_verified=true`, `companion_consent=true` jika pass
  - Creates default `food` pricing RM25
- `lib/gemini.ts` → `compareFaceWithIC()` returns `SelfieVerifyResult { faceMatch, confidence, icAuthentic, isAdult, issues }`
- Auto-approve jika: `faceMatch && icAuthentic && isAdult` (semua true)

## Google OAuth (AKTIF — 2026-06-05)
- Login + customer register ada butang Google
- Auth callback (`/auth/callback/route.ts`) auto-create `customer` + `customer_profiles` untuk new Google users
- Google provider ENABLED dalam Supabase dashboard
- Redirect URI: `https://vhervzbbptbqhmebfspq.supabase.co/auth/v1/callback`
- **Note:** Credentials perlu di-rotate (terdedah dalam chat) — buat di Google Cloud Console bila ada masa

## UI/UX Round 6 (2026-06-05)
- Search: tabs Semua + Teman Makan sahaja; price RM lebih besar; avatar warna pelbagai via name hash
- Landing: Teman Makan featured full-width card + emerald badge; hero subtitle contrast; stats jujur (50+/200+/8)
- Landing: dual CTA 'Cari Teman Makan' vs 'Jadi Rakan Teman'; Log Masuk link dalam hero
- Login: Google button prominent (border-2, shadow-sm); LangToggle pindah ke top-right corner
- Register: NGO/CareCenter collapsed under toggle; hanya Customer + Rakan Teman by default

## Duo Companion (SELESAI — 2026-06-05)
**Fasa 1 — Pair System:**
- DB: `companion_pairs` table (requester_id, partner_id, status: pending/active/dissolved)
- API: `GET /api/duo/status`, `POST /api/duo/request`, `POST /api/duo/respond`, `POST /api/duo/dissolve`, `GET /api/duo/search`
- UI: `DuoSection` client component dalam provider dashboard — search, invite, terima/tolak, bubar

**Fasa 2 — Booking Flow:**
- DB: `bookings` + `is_duo`, `duo_partner_id`, `duo_partner_price` columns
- Search card: badge ungu "👥 Duo" bila companion ada active pair
- Carer profile: "Duo Tersedia" badge + section kad pasangan
- Booking form: Solo/Duo toggle (muncul bila companion ada duo pair), harga gabungan auto-update
- Notification dihantar kepada duo partner bila booking dibuat

**Fasa 3 — Search Filter + Booking Visibility:**
- Search filter drawer: toggle "Duo Companion" (purple) + chip + ?duo=1 API param
- /api/providers: batch duo pair query, duoOnly filter server-side
- Provider bookings page + dashboard: include duo_partner_id bookings, Duo badge
- Booking detail: duo partner boleh view; row "Duo Companion" tunjuk kedua-dua nama

## Known Issues
- Tiada isu kritikal ✅

## Credentials Rotated (2026-06-06)
- **Google OAuth** — credential lama dihapus, baru dicipta. New Client ID: `364866145455-8hicoq88jpliu9hc224ud02ov8gptsgh.apps.googleusercontent.com`. Supabase provider dikemaskini ✅. OAuth consent screen: **In production** (semua Google user boleh login) ✅
- **Stripe LIVE** — sk_live + pk_live + webhook secret live (`we_1TfIpLC37VvIcHTWaHJLeW9I`) semuanya set dalam Vercel ✅

## Security (2026-06-06)
- **RLS ENABLED** — semua 30 tables kini ada Row Level Security ✅
- `is_admin()` helper function: checks `users.role = 'super_admin'` via `auth.uid()::text`
- `withdrawal_requests.provider_id` adalah UUID (semua lain TEXT) — policy tanpa cast
- Policies: read (public/auth), write (own data), admin bypass semua tables
## Git
- Repo: https://github.com/shaze22/teman (remote ditukar 2026-06-06 — syedshazni/teman tidak wujud)
- Push: `git push origin master`

## Language & Services Update (2026-06-05)
- Default lang: 'en' (was 'bm') — all 21 server pages + lang-context updated
- lib/services.ts: added labelEn per service; added 'locum' service (Segera Hadir); kombo + medical_care set hidden:true
- Meal Companion desc fixed: dining companion ONLY (no cooking at home, no food delivery)
- SERVICE_SCOPE.food updated: going out to eat together, warm conversation
- 8 visible services: Meal Companion (active) + Daily/Learning/Worship/Wellness/Errands/Repair/Locum (Segera Hadir)
- Booking form + landing page: use labelEn when lang=en, filter hidden services

## Favicon (2026-06-06)
- `app/icon.svg` — SVG heart logo (indigo #6366F1 bg + white heart) untuk modern browsers
- `app/favicon.ico` — PNG-in-ICO (192×192) wrapper dari public/icon-192.png untuk legacy browsers
- Next.js App Router auto-serve kedua-dua: SVG untuk modern, ICO untuk legacy

## Mobile UX Overhaul (2026-06-06)
- Hero: `text-4xl md:text-6xl lg:text-7xl`, padding dikurangkan
- Sections: `py-24` → `py-14 md:py-24`, headings `text-2xl md:text-4xl`
- Hero preview cards + testimonials: horizontal snap scroll pada mobile
- Steps (How It Works): icon kiri + teks kanan pada mobile (bukan stack)
- Search cards: compact — 1-row header, 2 skill chips, price+CTA inline, bio hidden
- Login: `t.login.orEmail` bilingual (tambah ke i18n BM+EN)
- Register: org toggle pakai `lang` dari `useLang()` (bukannya type cast hack)
- Mobile bottom nav: `app/_mobile-bottom-nav.tsx` — 4 tab (Search/Home/Bookings/Profile)
  - Ditambah ke customer + provider dashboard (`md:hidden`)
  - Dashboard: `pb-16 md:pb-0` supaya content tak tersembunyi
- `globals.css`: `.scrollbar-none`, `.safe-area-pb` utilities

## Payment — Pilihan A Payout (2026-06-06)
**Flow:** Customer bayar Stripe → booking confirmed → provider mark completed → auto-credit wallet → provider request withdrawal → admin transfer DuitNow/FPX dalam 7 hari bekerja

**Auto-release escrow:**
- `app/api/bookings/[id]/status/route.ts` — bila `status === 'completed' && payment_status === 'paid'`, terus:
  - Set `funds_released: true` pada booking
  - Credit `earnings_total` pada `single_mother_profiles`
  - Insert ke `wallet_transactions`
  - Notify provider via `notifyFundsReleased`
- Customer **tidak perlu** tekan "Release Funds" lagi

**Webhook fix:**
- `app/api/payment/webhook/route.ts` — guna `provider_id` dari booking terus (sebelum ini lookup by `full_name` — fragile bug)

**UI changes:**
- Customer: buang button "Release Funds"; ganti dengan mesej "7 hari bekerja"
- Provider: booking detail tunjuk "Admin akan transfer dalam 7 hari bekerja"
- Withdrawal form: "1-3 hari" → "7 hari bekerja"
- Admin `/admin/withdrawals`: subtitle update dengan DuitNow/FPX policy
- Review button: gated by `completed` (bukan `released`) — boleh review terus selepas sesi selesai

**Tables involved:** `bookings` (funds_released, funds_released_at), `wallet_transactions`, `single_mother_profiles` (earnings_total), `withdrawal_requests`, `payments`

## Features 9–11 (2026-06-06, commit 99f5958)

**Feature 9 — FPX Online Banking:**
- `app/api/payment/create/route.ts`: `payment_method_types: ['card', 'fpx']`
- FPX AKTIF — dah enable dalam Stripe Dashboard (2026-06-06)

**Domain fix (2026-06-06, commit fe9fcc6):**
- `NEXT_PUBLIC_APP_URL` dikemaskini ke `https://seniocare.app` dalam Vercel production env (sebelum ini kosong — menyebabkan Stripe redirect ke URL lama)
- `payment/create/route.ts`: `??` → `||` untuk handle empty string APP_URL
- `lib/email.ts`: fallback FROM → `SenioCare <noreply@seniocare.app>` (guna `||` bukan `??`)
- `lib/push.ts`: VAPID contact → `admin@seniocare.app`

**Feature 10 — Booking Reminder 24 Jam:**
- `app/api/cron/booking-reminders/route.ts` — GET endpoint, secured by `CRON_SECRET` header
- Cari booking `confirmed` dalam window 20–28 jam dari sekarang, `reminder_sent = false`
- Hantar in-app notification + email kepada customer + provider
- Set `reminder_sent = true` selepas hantar
- `vercel.json`: cron `"0 18 * * *"` = 2am MYT (Hobby plan = daily max)
- DB: `bookings.reminder_sent BOOLEAN DEFAULT FALSE` (migration applied)
- Env: `CRON_SECRET` ditambah ke Vercel production

**Feature 11 — Booking Reschedule:**
- DB: `reschedule_requests` table (id UUID, booking_id TEXT, requested_by TEXT, new_date DATE, new_time TIME, note TEXT, status TEXT, responded_at, created_at)
- `POST /api/bookings/[id]/reschedule` — create request (max 1 pending at a time)
- `PATCH /api/bookings/[id]/reschedule` — accept/reject (only by OTHER party)
- Accept → `bookings.scheduled_date` + `start_time` dikemaskini
- `app/booking/[id]/_reschedule-section.tsx` — client component, bilingual via `tx(lang, en, bm)`
- Visible untuk booking `pending` atau `confirmed` sahaja
- Email: `sendRescheduleRequest`, `sendRescheduleResponse` dalam `lib/email.ts`
- `sendBookingReminder` juga ditambah ke `lib/email.ts`
