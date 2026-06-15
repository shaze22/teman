@AGENTS.md

# SenioCare v2 — Project Context

## Apa itu SenioCare v2?
Platform locum & companion profesional untuk warga emas Malaysia. Menghubungkan keluarga dengan:
- **Tier 1 (Locum):** Jururawat berlesen, Fisioterapi, Pembantu Penjagaan, Pendamping Perubatan
- **Tier 2 (Companion):** Riadah Bersama, Ibadah Bersama, Makan Bersama

Domain: **seniocare.app** | Pivot dari: Meal Companion platform (Jun 2026)

## Tech Stack
- **Next.js 16.2.6** (App Router, Turbopack) — breaking changes dari v15
- TypeScript + Tailwind CSS v4
- **Supabase** (Auth + PostgreSQL + RLS) — TIADA PRISMA
- `@supabase/ssr` untuk server-side auth
- Stripe (payments), Resend (email), Gemini `gemini-2.5-flash`, Vercel

## KLASIFIKASI SOP: Class A — KRITIKAL
Data warga emas, rekod kesihatan, sijil profesional kesihatan.

## Peraturan Wajib Next.js 16
- `params` adalah `Promise<{...}>` — **mesti `await params`**
- Tiada `middleware.ts` — guna `proxy.ts`
- Middleware ada di `proxy.ts` (bukan middleware.ts — renamed dalam Next.js 16)

## TIADA PRISMA — Supabase Direct Sahaja
Prisma telah dibuang sepenuhnya. Semua DB queries guna Supabase client:
```typescript
import { createClient } from '@/lib/supabase/server'   // server components & API routes
import { supabaseAdmin } from '@/lib/supabase/admin'    // server-only, bypass RLS
import { createClient } from '@/lib/supabase/client'    // client components
```

## Roles (users.role)
| Role | Dashboard | Register | Verification |
|---|---|---|---|
| `locum_nurse` | `/dashboard/provider` | `/register/locum` | Nombor LJM + sijil + admin verify |
| `locum_physio` | `/dashboard/provider` | `/register/locum` | Nombor LFM + sijil + admin verify |
| `locum_care_aide` | `/dashboard/provider` | `/register/locum` | Sijil IHRAM/setaraf + admin verify |
| `medical_escort` | `/dashboard/provider` | `/register/locum` | IC + selfie (Gemini auto) |
| `companion` | `/dashboard/provider` | `/register/companion` | IC + selfie (Gemini auto) |
| `customer` | `/dashboard/customer` | `/register/customer` | Email verify |
| `waris` | `/dashboard/customer` | `/register/customer` | Email verify |
| `super_admin` | `/admin` | — | — |

## DB Tables (Post-Migration)

### Utama
- `users` — auth.uid() linkage, role, status
- `provider_profiles` — semua provider (locum + companion)
- `professional_licenses` — LJM/LFM/IHRAM sijil untuk locum roles
- `customer_profiles` — warga emas + waris
- `bookings` — semua tempahan
- `payments` — Stripe payment records
- `wallet_transactions` — earning + deduction log
- `withdrawal_requests` — payout requests
- `notifications` — in-app notifications
- `reviews` — post-booking reviews
- `reports` — dispute/laporan pengguna

### Dibuang (Legacy)
- `single_mother_profiles` → ganti `provider_profiles`
- `ngos` — dibuang
- `companion_pairs` — dibuang (Duo system)
- `care_center_profiles` — dibuang
- `events`, `event_participants` — dibuang

## Services (`lib/services.ts`)
```
LOCUM TIER (professional_required: true):
  nursing        — Jururawat Berlesen (SRN/SEM)
  physiotherapy  — Fisioterapi Berdaftar
  home_care      — Pembantu Penjagaan Bertauliah
  medical_escort — Pendamping Perubatan (IC+selfie)

COMPANION TIER (professional_required: false):
  riadah         — Riadah Bersama (senaman, berjalan)
  ibadah         — Ibadah Bersama (masjid, solat, Quran)
  makan          — Makan Bersama (restoran/kafe)
```

## Fee Structure
| Tier | Platform Fee | Provider Dapat |
|---|---|---|
| Locum (nursing/physio/home_care) | 15% | 85% |
| Medical Escort | 20% | 80% |
| Companion | 20% | 80% |

## Pricing Range (Provider set sendiri, dalam had ini)
- Jururawat: RM60–150/jam
- Fisioterapi: RM80–200/sesi
- Pembantu Penjagaan: RM40–80/jam
- Medical Escort: RM50–100/perjalanan
- Companion: RM30–80/sesi

## Piawaian Keselamatan (SOP Class A)

### Verification Tiers
**Tier 1 — Locum Profesional (nursing/physio/home_care):**
1. IC upload + selfie → Gemini verify
2. Nombor pendaftaran profesional (LJM/LFM/IHRAM)
3. Upload sijil
4. Admin manual verify → approve/reject dengan nota
5. Provider TIDAK boleh terima booking sehingga `license_verified = true`

**Tier 2 — Companion & Medical Escort:**
1. IC upload + selfie → Gemini verify (auto-approve jika pass)
2. Boleh terima booking selepas `ic_verified = true`

### Keperluan Perundangan (Non-Negotiable)
```
✓ Simpan nombor LJM/LFM — wajib untuk audit
✓ Disclaimer perubatan pada semua halaman locum: "Platform tidak memberi nasihat perubatan"
✓ Provider indemnity insurance — wajib sebelum go-live (check via admin)
✓ Data kesihatan: encrypt, PDPA Class A
✓ Consent bertulis dari keluarga sebelum maklumat kesihatan dikongsi
✓ Jangan buat medical claims dalam mana-mana copy
✓ Soft delete sahaja — tiada hard delete untuk rekod Class A
```

### Pengesahan Pemilikan (SOP 6.1)
```typescript
// BETUL — dua peringkat
await supabase.from('bookings').update({...})
  .eq('id', bookingId)
  .eq('customer_id', userId)

// SALAH — satu peringkat sahaja
.eq('id', bookingId)
```

## Struktur Projek
```
app/
  (auth)/
    login/           — Login + Google OAuth
    register/
      locum/         — Professional wizard (5 steps)
      companion/     — IC+selfie wizard (4 steps)
      customer/      — Customer register
  api/
    auth/register/
      locum/         — POST create locum + license upload
      companion/     — POST create companion (IC+selfie)
    bookings/        — CRUD + status + checkin
    payment/         — Stripe create + webhook
    providers/       — Search + profile
    admin/
      providers/verify-license/  — Approve/reject LJM/LFM
  admin/
    providers/       — List + verify locum licenses
  dashboard/
    provider/        — Locum + companion dashboard
    customer/        — Warga emas + waris dashboard
  search/            — Cari provider (filter by service type)
  carer/[id]/        — Profil provider
lib/
  supabase/
    server.ts        — createClient() untuk server
    client.ts        — createClient() untuk browser
    admin.ts         — supabaseAdmin (service role)
  services.ts        — SERVICE_TYPES, scope, fees
  types.ts           — TypeScript types untuk DB tables
  gemini.ts          — compareFaceWithIC(), analyzeDocument()
  email.ts           — Resend templates
  stripe.ts          — Stripe helpers
  notifications.ts   — Notification helpers
supabase/
  migrations/        — SQL migrations (semua schema changes di sini)
```

## Warna
- Primary: Teal `#0D9488` (ganti dari Indigo — lebih medical/healthcare feel)
- Secondary: Slate `#475569`
- Accent: Emerald `#059669`
- Background: White / Slate-50

## Gemini AI
```typescript
import { geminiGenerate, geminiGenerateJSON, compareFaceWithIC } from '@/lib/gemini'
// Model: gemini-2.5-flash
// compareFaceWithIC(icBase64, icMime, selfieBase64, selfieMime) → SelfieVerifyResult
```

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL          — TIDAK DIGUNAKAN (Prisma dibuang)
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
EMAIL_FROM            — SenioCare <noreply@seniocare.app>
GEMINI_API_KEY
NEXT_PUBLIC_APP_URL   — https://seniocare.app
CRON_SECRET
```

## Deployment
```bash
vercel deploy --prod --force --scope syedshazni-7682s-projects
```
Live: **https://seniocare.app**
GitHub: `git push origin master`

## Ekosistem Integrasi
```
OhMyKids     → (masa depan) channel ke kaunselor.app untuk mental health
OhMyParent   → (masa depan) detect keperluan fizikal → book SenioCare locum
kaunselor.app → hub profesional kesihatan mental
SenioCare    → locum + companion untuk warga emas ← projek ini
```

## Encoding Notes
- PowerShell `Set-Content -Encoding utf8` adds BOM — jangan guna untuk edit files
- Guna Write tool atau Node.js untuk tulis files

## Google OAuth (AKTIF)
- Redirect URI: `https://vhervzbbptbqhmebfspq.supabase.co/auth/v1/callback`
- Supabase URL Config: Site URL = `https://seniocare.app`, Redirect URLs = `https://seniocare.app/**`
- `redirectTo`: guna `process.env.NEXT_PUBLIC_APP_URL || window.location.origin`

## Stripe (LIVE MODE)
- `payment_method_types: ['card', 'fpx', 'grabpay']`
- Webhook: `https://seniocare.app/api/payment/webhook`
- Platform fee: potong pada create booking, bukan webhook
- Auto-release escrow bila booking `completed`

## Medical Disclaimer (Wajib di semua halaman locum)
```tsx
<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
  SenioCare adalah platform penghubung sahaja. Kami tidak memberi nasihat perubatan.
  Semua provider adalah kontraktor bebas bertauliah. Dalam kecemasan, hubungi 999.
</div>
```

## Booking Form — Service Restriction
- `nursing`, `physiotherapy`, `home_care` → hanya provider dengan `license_verified = true`
- `medical_escort` → provider `ic_verified = true`
- `riadah`, `ibadah`, `makan` → provider `ic_verified = true`
- Booking form filter `activeServiceTypes` dari `/api/providers/[id]/profile`

## Known Issues (v2 — in progress)
- [ ] Registration wizard locum belum dibina
- [ ] Admin verify license belum dibina
- [ ] Landing page masih v1 (Meal Companion)
