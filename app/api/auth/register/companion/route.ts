import { NextRequest, NextResponse } from 'next/server'
import { withPublic } from '@/lib/api/handler'
import { registerCompanion } from '@/lib/use-cases/register-companion'

export const POST = withPublic(async (req: NextRequest) => {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ message: 'Invalid form data' }, { status: 400 })
  }

  const userId = form.get('userId') as string
  const fullName = form.get('fullName') as string
  const email = form.get('email') as string
  const phone = form.get('phone') as string
  const locationState = form.get('locationState') as string
  const locationCity = form.get('locationCity') as string
  const referralCode = (form.get('referralCode') as string | null)?.trim().toUpperCase() || null
  const icFrontFile = form.get('icFront') as File | null
  const selfieFile = form.get('selfie') as File | null

  if (!userId || !fullName || !email || !phone || !locationState || !locationCity)
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
  if (!icFrontFile || !selfieFile)
    return NextResponse.json({ message: 'IC and selfie are required' }, { status: 400 })

  await registerCompanion({
    userId, fullName, email, phone, locationState, locationCity,
    referralCode, icFrontFile, selfieFile,
  })

  return NextResponse.json({ success: true })
})
