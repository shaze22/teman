import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref')
  const response = NextResponse.redirect(new URL('/register/companion', request.url))
  if (ref) {
    response.cookies.set('ref_code', ref.toUpperCase(), {
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    })
  }
  return response
}
