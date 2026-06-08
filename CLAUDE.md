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

## Google OAuth (AKTIF — rotated + fixed 2026-06-07)
- Login + customer register ada butang Google
- Auth callback (`/auth/callback/route.ts`) auto-create `customer` + `customer_profiles` untuk new Google users
- Google provider ENABLED dalam Supabase dashboard ✅
- Redirect URI: `https://vhervzbbptbqhmebfspq.supabase.co/auth/v1/callback`
- `redirectTo` guna `process.env.NEXT_PUBLIC_APP_URL || window.location.origin` (bukan `window.location.origin` sahaja)
- **Supabase URL Config (wajib):** Site URL = `https://seniocare.app`, Redirect URLs = `https://seniocare.app/**`

## How It Works Page (2026-06-07)
- Route: `/how-it-works` — server component, bilingual, linked dari nav + footer
- 2 tab: Pelanggan (4 steps) + Meal Companion (5 steps)
- Section "Platform Rules" — 4 peraturan dining
- FAQ accordion — 5 soalan

## Dining Rules (2026-06-07)
- Companion WAJIB makan bersama senior di meja yang sama
- Senior bayar TOTAL bil restoran (companion's meal included) — terus di restoran, bukan dalam booking fee
- Sesi MESTI di restoran berwaiter (bukan buffet, nasi campur, fast food)
- Dikuatkuasakan di: (1) booking form notice; (2) companion registration consent checkbox; (3) How It Works Platform Rules

## Platform Safety Features (2026-06-08, commits e8fa7a7 + bb2e425)

**Gemini Rate Limiting + Confidence Score:**
- `gemini_verify_attempts` table — track IP per hour, max 5/IP/jam → 429 jika lebih
- `single_mother_profiles`: `gemini_confidence TEXT`, `gemini_face_match BOOLEAN`, `gemini_verified_at TIMESTAMPTZ`
- Register companion API saves semua 3 Gemini result kolum

**Session Check-in:**
- `POST /api/bookings/[id]/checkin` — companion atau customer mark arrival
- DB: `companion_checkin_at TIMESTAMPTZ`, `customer_checkin_at TIMESTAMPTZ` pada bookings
- `app/booking/[id]/_checkin-section.tsx` — butang "Saya Sudah Tiba di Restoran", notify pihak lain via in-app notification
- Shown untuk booking `confirmed` atau `in_progress`

**User Report / Laporan:**
- `POST /api/reports` — submit laporan (5 kategori: no_show/misconduct/fraud/harassment/other)
- DB: `reports` table (reporter_id, reported_user_id, booking_id, category, description, status, admin_note)
- `app/booking/[id]/_report-button.tsx` — modal dalam booking detail, 1 report/booking/user
- Admin semak di `/admin/disputes`

**Booking Reminders (Updated):**
- Cron `/api/cron/booking-reminders` kini hantar **24h DAN 2h** reminders
- 24h: window 20–28 jam, column `reminder_sent`
- 2h: window 1.5–2.5 jam, column `reminder_2h_sent`
- Kedua-dua in-app notification (tiada email untuk 2h — hanya notif)

**DB Tables Created:**
- `payouts` — withdrawal request (parallel to existing `withdrawal_requests`)
- `reports` — user-facing report/dispute system
- `gemini_verify_attempts` — rate limiting log

**Fitur Yang Sudah Ada (bukan gap):**
- Terms: `/terms` ✅ | Privacy: `/privacy` ✅
- Admin dashboard: `/admin` penuh — providers, customers, bookings, withdrawals, disputes ✅
- Cancellation refund: ≥24h penuh, <24h 50%, Stripe API ✅
- Receipt: `/booking/[id]/receipt` ✅
- Withdrawal: `withdrawal_requests` + `/admin/withdrawals` ✅

## Consent & Age Validation (2026-06-08, commits 6ad9c6f + b86c2e1)
**Umur minimum:**
- Senior (isForSelf): min **40 tahun** — DOB field wajib, validate client + server
- Waris (isForSelf false): min **25 tahun** — DOB field wajib, validate client + server; nota "tidak boleh book untuk diri sendiri"
- Senior age field (waris booking for senior): min 40 (dari 50)
- DB: `registrant_dob DATE` dalam `customer_profiles`

**Customer/Senior/Waris consent (6 checkbox wajib — sebelum tiada):**
1. Anti-fraud/scam/jenayah — boleh dilaporkan kepada polis
2. Platform usage — makan bersama sahaja
3. Meal bill — bayar makan companion terus di restoran
4. Behaviour — sopan terhadap companion
5. Terma Perkhidmatan & Dasar Privasi
6. Kesahihan maklumat
- DB: `customer_consent BOOLEAN` + `customer_consent_at TIMESTAMPTZ` dalam `customer_profiles`
- Server: `customerConsent: false` → return 400

**Companion consent (sedia ada sejak Fasa 2 — 5 checkbox):**
1. Tiada perkhidmatan menyalahi undang-undang
2. Tiada perkhidmatan tidak senonoh
3. Dining rules (makan bersama, restoran berwaiter, bil ditanggung pelanggan)
4. Terma & Privasi
5. IC adalah milik sendiri

## UX Audit Fixes (2026-06-08, commits c6727b0 + c3d491f)
- Landing: buang 7 "Coming Soon" service cards (clutter + broken icons)
- Booking: buang redundant text date input di bawah calendar
- Booking: "Choose Service" hidden bila hanya 1 service aktif (locum: tetap tunjuk 2 service)
- Booking: "Senior's Name (for Care Centres)" → "(Optional)" sahaja
- Login/Register/ForgotPw: `email@contoh.com` → `email@example.com` (5 files)
- Login: tambah "← Back to Home" link
- Profile: `Phone` icon → `MessageCircle` untuk contact/chat note
- Profile: "Skills"/"Kemahiran" → "Service"/"Perkhidmatan" dalam `lib/i18n.ts`
- Profile: fee note highlight → indigo bg (lebih visible)
- Search: tab "All" dibuang → "🍽️ Meal Companion" sahaja
- Search placeholder: "name, city, or skill" → "name or city" (BM+EN)

## Referral System (2026-06-08, commit aaed2a6)
- DB: `referral_code VARCHAR(10)` dalam `single_mother_profiles`, `referred_by VARCHAR(10)` dalam `users`, table `referral_rewards`
- `/join?ref=CODE` → set cookie → redirect ke `/register/companion`
- Register companion: baca cookie, validate kod, simpan `referred_by`, cipta `referral_rewards(pending)`
- Booking pertama companion selesai → auto-credit RM10 ke wallet referrer + referee
- API: `GET /api/referral/check?code=X`, `GET /api/referral/stats`
- Provider dashboard: `_referral-section.tsx` — copy link, WhatsApp share, stats
- Payment: `payment_method_types: ['card', 'fpx', 'grabpay']`
- Default companion pricing: **RM30** (naik dari RM25)

## Review Fixes Round 2 (2026-06-08, commit 782ad56)
- Booking form: default start time `12:00` (bukan 09:00)
- Landing + FAQ: "RM25–50/session" → "RM30–80/session"
- How It Works companion: step 04 "Arrive & Check In" → "Meet at Restaurant" (BM+EN)
- How It Works customer: step 02 tambah GrabPay; step 03 "Companion Arrives" → "Meet at Restaurant"; escrow notice → auto-release (BM+EN)
- Profile: "Schedule not set — contact after booking" → "Flexible schedule — confirm via chat after booking"

## Copy & Search Fixes (2026-06-08)
- Hero subtitle + testimonials: buang semua "cooks/masak" — companion teman makan keluar, bukan masak
- CTA "I Want to Be a Companion" → `/register/companion` (sebelum salah ke `/register?role=provider`)
- "Join thousands" → "Join families across Malaysia"
- Search page title: "Find a Meal Companion — SenioCare"
- Search cards: skill chips lama digantikan `🍽️ Meal Companion` + `✓ IC Verified` badges (`app/search/_client.tsx`)

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

## Mobile Review Fixes (2026-06-08, commit dbdf2ee)

**Nav (app/page.tsx):**
- "Log In" link: `hidden sm:block` — hidden pada mobile (<640px), hanya Register button visible
- Mengelak "Log\nIn" wrap pada viewport 390px

**Copywriting (lib/i18n.ts + app/page.tsx) — EN & BM:**
- Services subheading: "Various companion types..." → "Warm, genuine companionship over a shared meal at any restaurant"
- 3-step Step 01: "skills & price" → "location and price" (skills removed dari search)
- 3-step Step 02: "fill in requirements" → "add any special needs, pay via card, FPX or GrabPay"
- 3-step Step 03: "send daily report. Your parent is happy." → "Meet at Restaurant. Enjoy the meal together at the same table."
- Safety "Family Monitoring": "daily reports" dibuang → "monitor bookings and session check-ins in real time"
- Testimonial 1: "for lunch we dine" → "for lunch. We dine" (period selepas em dash removal)
- Testimonial 3: "doing something I love dining" → cleaner sentence "doing something I love. I dine with..."

## Em Dash Removal (2026-06-08, commit 345864e)
- 134 em dashes (`—`) dibuang dari 33 files: `lib/i18n.ts`, `lib/email.ts`, `app/page.tsx` dll
- Replace pattern: ` — ` → ` ` (single space via Node.js regex `/\s*—\s*/g`)
- **Nota**: Beberapa string perlu period/comma selepas removal — semak jika ada awkward phrasing baru

## Live Site Review Fixes (2026-06-08, commit 8c19307)
- **Companion profile `generateMetadata`** (`/carer/[id]/page.tsx`): `"SenioCare di X"` → `"[Name] | Meal Companion in [City] | SenioCare"` + description tag
- **Availability text**: `'Flexible schedule. Confirm your preferred time via chat after booking.'`
- **FavoriteButton** (`/carer/[id]/_favorite-button.tsx`): accept `isLoggedIn?: boolean` prop; skip `/api/favorites` GET bila guest — eliminates 401 console error
  - Server passes: `const { data: { user } } = await supabase.auth.getUser(); isLoggedIn={!!user}`
- **i18n `en.register.providerSub`**: `'Open to all Malaysians, 18 and above'`
- **Landing page CTA copy** (`app/page.tsx`): `'Open to all Malaysians, 18 and above. Turn your love for dining into flexible income.'`

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
- **Gemini server-side verify** (commit `8a15838`) — `/api/auth/register/companion` kini re-run `compareFaceWithIC()` server-side. Tidak percaya `geminiPassed` dari client. Gagal → 422. ✅

## About Page Revamp (2026-06-06, commit `fc17b07`)
- Buang semua reference "ibu tunggal" / "single mother" / "NGO verification"
- Mission baru: "pastikan tiada warga emas makan berseorangan"
- Nilai "Komuniti" → "Inklusif" (terbuka semua 18+), icon Users → Globe
- "Keselamatan": NGO verification → IC + selfie verification
- Story: fokus warga emas keseorangan, bukan ibu tunggal kerja 3 jobs
- CTA "Jadi Meal Companion" → `/register/companion`
- BM + EN translations dikemaskini sepenuhnya
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
