import { supabaseAdmin } from '@/lib/supabase/admin'
import { Errors } from '@/lib/errors'
import { compareFaceWithIC } from '@/lib/gemini'
import { requiresLicenseVerification, PROVIDER_ROLES } from '@/lib/types'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export interface RegisterLocumInput {
  role: string
  fullName: string
  email: string
  password: string
  phone: string
  locationState: string
  locationCity: string
  providerConsent: boolean
  licenseType: string
  licenseNumber: string
  licenseExpiry: string
  icFile: File
  selfieFile: File
  licenseFile: File | null
}

export interface RegisterLocumResult {
  userId: string
  requiresLicenseVerification: boolean
  message: string
}

export async function registerLocum(input: RegisterLocumInput): Promise<RegisterLocumResult> {
  const { role, fullName, email, password, phone, locationState, locationCity,
    providerConsent, licenseType, licenseNumber, licenseExpiry,
    icFile, selfieFile, licenseFile } = input

  if (!PROVIDER_ROLES.includes(role as never))
    throw Errors.badRequest('Invalid role')
  if (password.length < 8)
    throw Errors.badRequest('Password must be at least 8 characters')
  if (!providerConsent)
    throw Errors.badRequest('Consent is required')
  if (icFile.size > MAX_FILE_SIZE || selfieFile.size > MAX_FILE_SIZE)
    throw Errors.badRequest('File size exceeds 10MB limit')
  if (licenseFile && licenseFile.size > 20 * 1024 * 1024)
    throw Errors.badRequest('Certificate file size exceeds 20MB limit')
  if (!ALLOWED_MIME.includes(icFile.type) || !ALLOWED_MIME.includes(selfieFile.type))
    throw Errors.badRequest('Invalid file type. Use JPG, PNG, or PDF.')

  const needsLicense = requiresLicenseVerification(role)
  if (needsLicense && (!licenseType || !licenseNumber))
    throw Errors.badRequest('Professional license details are required')

  const icBuffer = Buffer.from(await icFile.arrayBuffer())
  const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer())

  const geminiResult = await compareFaceWithIC(
    icBuffer.toString('base64'), icFile.type,
    selfieBuffer.toString('base64'), selfieFile.type,
  )

  if (!geminiResult.faceMatch || !geminiResult.icAuthentic || !geminiResult.isAdult) {
    const err = new Error('IC and selfie verification failed.')
    Object.assign(err, { status: 422, issues: geminiResult.issues })
    throw err
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: false,
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes('already'))
      throw Errors.conflict('This email is already registered.')
    throw Errors.serverError(authError?.message ?? 'Failed to create account.')
  }

  const userId = authData.user.id

  const { error: userError } = await supabaseAdmin.from('users').insert({
    id: userId, email, phone: phone || '', full_name: fullName,
    role, status: 'pending', email_verified: false,
  })

  if (userError) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    throw Errors.serverError('Failed to save user record.')
  }

  // Upload IC + selfie
  const icExt = icFile.type === 'image/png' ? 'png' : 'jpg'
  const [icUpload, selfieUpload] = await Promise.all([
    supabaseAdmin.storage.from('ic-documents')
      .upload(`${userId}/ic_front.${icExt}`, icBuffer, { contentType: icFile.type, upsert: true }),
    supabaseAdmin.storage.from('ic-documents')
      .upload(`${userId}/selfie.jpg`, selfieBuffer, { contentType: 'image/jpeg', upsert: true }),
  ])

  const icUrl = icUpload.data
    ? supabaseAdmin.storage.from('ic-documents').getPublicUrl(`${userId}/ic_front.${icExt}`).data.publicUrl
    : null
  const selfieUrl = selfieUpload.data
    ? supabaseAdmin.storage.from('ic-documents').getPublicUrl(`${userId}/selfie.jpg`).data.publicUrl
    : null

  // Upload license cert
  let licenseUrl: string | null = null
  if (licenseFile && licenseFile.size > 0) {
    const licBuf = Buffer.from(await licenseFile.arrayBuffer())
    const licExt = licenseFile.type === 'application/pdf' ? 'pdf' : 'jpg'
    const { data: licUpload } = await supabaseAdmin.storage
      .from('license-certs')
      .upload(`${userId}/license.${licExt}`, licBuf, { contentType: licenseFile.type, upsert: true })
    if (licUpload) {
      licenseUrl = supabaseAdmin.storage.from('license-certs')
        .getPublicUrl(`${userId}/license.${licExt}`).data.publicUrl
    }
  }

  const profileId = crypto.randomUUID()
  await supabaseAdmin.from('provider_profiles').insert({
    id: profileId, user_id: userId, full_name: fullName,
    location_state: locationState, location_city: locationCity,
    ic_url: icUrl, selfie_url: selfieUrl,
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
    is_available: !needsLicense,
  })

  if (needsLicense && licenseType && licenseNumber) {
    await supabaseAdmin.from('professional_licenses').insert({
      provider_id: userId, license_type: licenseType, license_number: licenseNumber,
      license_url: licenseUrl, expiry_date: licenseExpiry || null,
      verified: false, is_primary: true, is_active: true,
    }).then(null, () => {})
  }

  // Default pricing
  const locumServiceMap: Record<string, string[]> = {
    locum_nurse: ['nursing', 'medical_escort'],
    locum_physio: ['physiotherapy', 'medical_escort'],
    locum_care_aide: ['home_care', 'medical_escort'],
    medical_escort: ['medical_escort'],
    companion: ['riadah', 'ibadah', 'makan'],
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
        id: crypto.randomUUID(), profile_id: profileId, service_type: svc,
        pricing_type: defaultPriceMap[svc]?.type ?? 'per_session',
        price: defaultPriceMap[svc]?.price ?? 50, is_active: true,
      }))
    )
  }

  if (needsLicense) {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId, type: 'registration_pending',
      title: 'Registration Received',
      message: `Thank you ${fullName}. Your license is being reviewed by our admin team. This usually takes 1-3 business days.`,
      sent_via: ['in_app'],
    }).then(null, () => {})
  }

  return {
    userId,
    requiresLicenseVerification: needsLicense,
    message: needsLicense
      ? 'Registration successful. Your license is under review. We will notify you via email.'
      : 'Registration successful! You can start accepting bookings.',
  }
}
