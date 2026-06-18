import { NextRequest, NextResponse } from 'next/server'
import { withPublic } from '@/lib/api/handler'
import { AppError } from '@/lib/errors'
import { registerLocum } from '@/lib/use-cases/register-locum'

export const POST = withPublic(async (req: NextRequest) => {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
  }

  const role = form.get('role') as string
  const fullName = (form.get('fullName') as string)?.trim()
  const email = (form.get('email') as string)?.trim().toLowerCase()
  const password = form.get('password') as string
  const phone = (form.get('phone') as string)?.trim() ?? ''
  const locationState = (form.get('locationState') as string)?.trim()
  const locationCity = (form.get('locationCity') as string)?.trim()
  const providerConsent = form.get('providerConsent') === 'true'
  const licenseType = (form.get('licenseType') as string) ?? ''
  const licenseNumber = (form.get('licenseNumber') as string)?.trim() ?? ''
  const licenseExpiry = (form.get('licenseExpiry') as string) ?? ''
  const icFile = form.get('icFile') as File | null
  const selfieFile = form.get('selfieFile') as File | null
  const licenseFile = form.get('licenseFile') as File | null

  if (!role || !fullName || !email || !password || !locationState || !locationCity)
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  if (!icFile || !selfieFile)
    return NextResponse.json({ error: 'IC and selfie are required.' }, { status: 400 })

  try {
    const result = await registerLocum({
      role, fullName, email, password, phone, locationState, locationCity,
      providerConsent, licenseType, licenseNumber, licenseExpiry,
      icFile, selfieFile, licenseFile,
    })
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    if (err instanceof AppError) {
      const body: Record<string, unknown> = { error: err.message }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any).issues) body.issues = (err as any).issues
      return NextResponse.json(body, { status: err.status })
    }
    console.error('/api/auth/register/locum error:', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
})
