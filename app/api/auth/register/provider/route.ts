import { NextResponse } from 'next/server'

// v1 registration endpoint — replaced by /api/auth/register/locum and /api/auth/register/companion
export async function POST() {
  return NextResponse.json(
    { message: 'This endpoint is deprecated. Use /api/auth/register/locum or /api/auth/register/companion' },
    { status: 410 }
  )
}
