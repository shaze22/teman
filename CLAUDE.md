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
- **UI term:** "Rakan Teman" untuk provider/companion role (bukan "Pengasuh" lagi)
- **Verification:** IC + selfie real-time (Fasa 2) — bukan NGO
- **`/register/companion`** → redirect ke `/register/provider` sementara (Fasa 2 bina flow baru)
- `lib/services.ts` ada `active` flag — hanya `food: true`

## Branding Rules
- Guna **"Rakan Teman"** untuk peranan provider/companion dalam semua UI text
- "Teman" (BM word) kekal dalam nama servis: "Teman Makan", "Teman Kerja" dll
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

## Known Issues
- Google OAuth credentials perlu di-rotate (terdedah dalam chat)
- Privacy page extra content dari homepage bila navigate client-side
- FPX payments disabled
- Stripe masih test mode
- RLS disabled pada 22 tables Supabase
## Git
- Repo: https://github.com/syedshazni/teman
- Push: `git push origin master`
