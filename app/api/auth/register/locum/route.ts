import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { compareFaceWithIC } from '@/lib/gemini'
import { PROVIDER_ROLES } from '@/lib/types'

const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

function fileToBase64(buffer: Buffer, mime: string): string {
  return buffer.toString('base64') + '|' + mime
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()

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

    // Input validation
    if (!role || !fullName || !email || !password || !locationState || !locationCity) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    if (!PROVIDER_ROLES.includes(role as never)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }
    if (!providerConsent) {
      return NextResponse.json({ error: 'Consent is required.' }, { status: 400 })
    }
    if (!icFile || !selfieFile) {
      return NextResponse.json({ error: 'IC and selfie are required.' }, { status: 400 })
    }

    // File size validation
    if (icFile.size > MAX_FILE_SIZE || selfieFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 })
    }
    if (licenseFile && licenseFile.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Certificate file size exceeds 20MB limit.' }, { status: 400 })
    }

    // MIME validation
    if (!ALLOWED_MIME.includes(icFile.type) || !ALLOWED_MIME.includes(selfieFile.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, or PDF.' }, { status: 400 })
    }

    const requiresLicense = ['locum_nurse', 'locum_physio', 'locum_care_aide'].includes(role)
    if (requiresLicense && (!licenseType || !licenseNumber)) {
      return NextResponse.json({ error: 'Professional license details are required.' }, { status: 400 })
    }

    // Server-side Gemini verification (do NOT trust client)
    const icArrayBuffer = await icFile.arrayBuffer()
    const selfieArrayBuffer = await selfieFile.arrayBuffer()
    const icBuffer = Buffer.from(icArrayBuffer)
    const selfieBuffer = Buffer.from(selfieArrayBuffer)

    const geminiResult = await compareFaceWithIC(
      icBuffer.toString('base64'), icFile.type,
      selfieBuffer.toString('base64'), selfieFile.type,
    )

    if (!geminiResult.faceMatch || !geminiResult.icAuthentic || !geminiResult.isAdult) {
      return NextResponse.json({
        error: 'IC and selfie verification failed.',
        issues: geminiResult.issues,
      }, { status: 422 })
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    })

    if (authError || !authData.user) {
      if (authError?.message?.includes('already')) {
        return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError?.message ?? 'Failed to create account.' }, { status: 500 })
    }

    const userId = authData.user.id

    // Insert into users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email,
        phone: phone || '',
        full_name: fullName,
        role,
        status: 'pending',
        email_verified: false,
      })

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Failed to save user record.' }, { status: 500 })
    }

    // Upload IC to storage
    const icExt = icFile.type === 'image/png' ? 'png' : 'jpg'
    const { data: icUpload, error: icUploadError } = await supabaseAdmin.storage
      .from('ic-documents')
      .upload(`${userId}/ic_front.${icExt}`, icBuffer, { contentType: icFile.type, upsert: true })

    if (icUploadError) {
      console.error('IC upload failed (non-fatal):', icUploadError?.message)
    }

    // Upload selfie to storage
    const { data: selfieUpload, error: selfieUploadError } = await supabaseAdmin.storage
      .from('ic-documents')
      .upload(`${userId}/selfie.jpg`, selfieBuffer, { contentType: 'image/jpeg', upsert: true })

    if (selfieUploadError) {
      console.error('Selfie upload failed (non-fatal):', selfieUploadError?.message)
    }

    const icUrl = icUpload ? supabaseAdmin.storage.from('ic-documents').getPublicUrl(`${userId}/ic_front.${icExt}`).data.publicUrl : null
    const selfieUrl = selfieUpload ? supabaseAdmin.storage.from('ic-documents').getPublicUrl(`${userId}/selfie.jpg`).data.publicUrl : null

    // Upload license cert if provided
    let licenseUrl: string | null = null
    if (licenseFile && licenseFile.size > 0) {
      const licBuf = Buffer.from(await licenseFile.arrayBuffer())
      const licExt = licenseFile.type === 'application/pdf' ? 'pdf' : 'jpg'
      const { data: licUpload } = await supabaseAdmin.storage
        .from('license-certs')
        .upload(`${userId}/license.${licExt}`, licBuf, { contentType: licenseFile.type, upsert: true })
      if (licUpload) {
        licenseUrl = supabaseAdmin.storage.from('license-certs').getPublicUrl(`${userId}/license.${licExt}`).data.publicUrl
      }
    }

    // Create provider_profiles record
    const profileId = crypto.randomUUID()
    const { error: profileError } = await supabaseAdmin
      .from('provider_profiles')
      .insert({
        id: profileId,
        user_id: userId,
        full_name: fullName,
        location_state: locationState,
        location_city: locationCity,
        ic_url: icUrl,
        selfie_url: selfieUrl,
        ic_verified: true,
        gemini_confidence: String(geminiResult.confidence ?? ''),
        gemini_face_match: geminiResult.faceMatch,
        gemini_verified_at: new Date().toISOString(),
        license_number: licenseNumber || null,
        license_type: licenseType || null,
        license_url: licenseUrl,
        license_expiry: licenseExpiry || null,
        license_verified: false,
        provider_consent: true,
        provider_consent_at: new Date().toISOString(),
        is_active: true,
        is_available: !requiresLicense,
      })

    if (profileError) {
      console.error('Provider profile creation failed:', profileError)
    }

    // If license provided, insert into professional_licenses table
    if (requiresLicense && licenseType && licenseNumber) {
      const { error: licError } = await supabaseAdmin
        .from('professional_licenses')
        .insert({
          provider_id: userId,
          license_type: licenseType,
          license_number: licenseNumber,
          license_url: licenseUrl,
          expiry_date: licenseExpiry || null,
          verified: false,
          is_primary: true,
          is_active: true,
        })

      if (licError) {
        console.error('License record creation failed (non-fatal):', licError?.message)
      }
    }

    // Create default pricing for companion-eligible services
    const companionServices = ['riadah', 'ibadah', 'makan']
    const locumServiceMap: Record<string, string[]> = {
      locum_nurse: ['nursing', 'medical_escort'],
      locum_physio: ['physiotherapy', 'medical_escort'],
      locum_care_aide: ['home_care', 'medical_escort'],
      medical_escort: ['medical_escort'],
      companion: companionServices,
    }

    const defaultPriceMap: Record<string, { price: number; type: string }> = {
      nursing: { price: 80, type: 'per_hour' },
      physiotherapy: { price: 100, type: 'per_session' },
      home_care: { price: 50, type: 'per_hour' },
      medical_escort: { price: 60, type: 'per_session' },
      riadah: { price: 40, type: 'per_session' },
      ibadah: { price: 40, type: 'per_session' },
      makan: { price: 40, type: 'per_session' },
    }

    const servicesToCreate = locumServiceMap[role] ?? []
    if (servicesToCreate.length > 0) {
      await supabaseAdmin.from('provider_pricing').insert(
        servicesToCreate.map(svc => ({
          id: crypto.randomUUID(),
          profile_id: profileId,
          service_type: svc,
          pricing_type: defaultPriceMap[svc]?.type ?? 'per_session',
          price: defaultPriceMap[svc]?.price ?? 50,
          is_active: true,
        }))
      )
    }

    // Notify provider of pending license review
    if (requiresLicense) {
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        type: 'registration_pending',
        title: 'Registration Received',
        message: `Thank you ${fullName}. Your license is being reviewed by our admin team. This usually takes 1-3 business days.`,
        sent_via: ['in_app'],
      })
    }

    return NextResponse.json({
      success: true,
      userId,
      requiresLicenseVerification: requiresLicense,
      message: requiresLicense
        ? 'Registration successful. Your license is under review. We will notify you via email.'
        : 'Registration successful! You can start accepting bookings.',
    })

  } catch (err) {
    console.error('/api/auth/register/locum error:', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
