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

## Known Issues
- Privacy page (`/privacy`) ada extra content dari homepage bila navigate client-side — belum fix
- FPX payments disabled — aktif semula bila Stripe account Malaysia verified

## Git
- Repo: https://github.com/syedshazni/teman
- Push: `git push origin master`
