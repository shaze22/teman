// SenioCare v2 — Database Types
// Supabase direct (no Prisma)
// SOP: Class A — rekod kesihatan + sijil profesional

export type UserRole =
  | 'locum_nurse'
  | 'locum_physio'
  | 'locum_care_aide'
  | 'medical_escort'
  | 'companion'
  | 'customer'
  | 'waris'
  | 'super_admin'

export type UserStatus = 'active' | 'pending' | 'suspended' | 'verified'

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'refunded'

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded'

export type LicenseType =
  | 'LJM_SRN'
  | 'LJM_SEM'
  | 'LFM'
  | 'IHRAM_HOMECARE'
  | 'KKM_PARAMEDIC'
  | 'OTHER'

export type ServiceId =
  | 'nursing'
  | 'physiotherapy'
  | 'home_care'
  | 'medical_escort'
  | 'riadah'
  | 'ibadah'
  | 'makan'

// ── DB Row Types ─────────────────────────────────────────────

export interface DbUser {
  id: string
  email: string | null
  phone: string | null
  full_name: string
  role: UserRole
  status: UserStatus
  avatar_url: string | null
  email_verified: boolean
  referred_by: string | null
  created_at: string
  updated_at: string
}

export interface DbProviderProfile {
  id: string
  user_id: string
  full_name: string | null
  location_state: string
  location_city: string
  location_postcode: string | null
  location_lat: number | null
  location_lng: number | null
  bio: string | null
  languages: string[]
  has_transport: 'none' | 'motorcycle' | 'car'
  avatar_url: string | null

  // Identity (PII_HIGH)
  ic_number: string | null
  ic_url: string | null
  selfie_url: string | null
  ic_verified: boolean
  gemini_confidence: string | null
  gemini_face_match: boolean | null
  gemini_verified_at: string | null

  // Professional
  license_number: string | null
  license_type: LicenseType | null
  license_url: string | null
  license_expiry: string | null
  license_verified: boolean
  license_verified_at: string | null
  license_verified_by: string | null
  license_rejection_reason: string | null
  has_indemnity_insurance: boolean
  insurance_url: string | null

  // Stats
  rating_avg: number
  total_reviews: number
  total_bookings: number
  earnings_total: number
  wallet_balance: number

  // Consent
  provider_consent: boolean
  provider_consent_at: string | null
  companion_consent: boolean
  companion_consent_at: string | null

  is_active: boolean
  is_available: boolean
  created_at: string
  updated_at: string | null
}

export interface DbProfessionalLicense {
  id: string
  provider_id: string
  license_type: LicenseType
  license_number: string
  license_url: string | null
  issued_by: string | null
  issue_date: string | null
  expiry_date: string | null
  verified: boolean
  verified_at: string | null
  verified_by: string | null
  rejection_reason: string | null
  is_primary: boolean
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface DbProviderPricing {
  id: string
  provider_id: string
  service_type: ServiceId
  pricing_type: 'per_hour' | 'per_session' | 'per_day'
  price: number
  currency: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface DbProviderAvailability {
  id: string
  provider_id: string
  day_of_week: number  // 0=Sun, 6=Sat
  start_time: string   // 'HH:MM'
  end_time: string
  is_recurring: boolean
  specific_date: string | null
  is_available: boolean
  created_at: string
}

export interface DbCustomerProfile {
  id: string
  user_id: string
  is_for_self: boolean
  senior_full_name: string | null
  senior_age: number | null
  senior_phone: string | null
  senior_avatar_url: string | null
  location_state: string
  location_city: string
  health_conditions: string[]
  allergies: string[]
  medications: string | null
  mobility_status: 'independent' | 'walking_stick' | 'wheelchair' | 'bedridden' | null
  dietary_requirements: string[]
  preferred_gender: 'female_only' | 'no_preference' | null
  registrant_dob: string | null
  customer_consent: boolean
  customer_consent_at: string | null
  senior_health_notes: string | null
  created_at: string
  updated_at: string
}

export interface DbBooking {
  id: string
  booking_code: string
  customer_id: string
  provider_id: string
  service_type: ServiceId
  status: BookingStatus
  scheduled_date: string   // DATE
  start_time: string
  end_time: string | null
  duration_hours: number | null
  location_address: string | null
  requirements: string | null
  special_notes: string | null
  service_notes: string | null
  // Health info (PII_HIGH)
  health_conditions: string[] | null
  medications: string | null
  mobility_status: string | null
  emergency_contact: string | null
  // Payment
  provider_price: number
  platform_fee: number
  platform_fee_pct: number | null
  total_amount: number
  provider_amount: number | null
  payment_status: PaymentStatus
  payment_method: string | null
  funds_released: boolean
  funds_released_at: string | null
  // Timestamps
  requested_at: string
  confirmed_at: string | null
  companion_checkin_at: string | null
  customer_checkin_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  // Reminders
  reminder_sent: boolean
  reminder_2h_sent: boolean
  reschedule_count: number
  created_at: string
  updated_at: string
}

export interface DbNotification {
  id: string
  user_id: string
  type: string
  title: string
  message: string | null
  data: Record<string, unknown> | null
  is_read: boolean
  read_at: string | null
  action_url: string | null
  sent_via: string[]
  created_at: string
}

export interface DbReview {
  id: string
  booking_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  categories: Record<string, number> | null
  is_public: boolean
  response_text: string | null
  responded_at: string | null
  created_at: string
}

export interface DbReport {
  id: string
  reporter_id: string
  reported_user_id: string
  booking_id: string | null
  category: 'no_show' | 'misconduct' | 'fraud' | 'harassment' | 'other'
  description: string | null
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  admin_note: string | null
  resolved_at: string | null
  resolved_by: string | null
  is_active: boolean
  created_at: string
}

export interface DbWithdrawalRequest {
  id: string
  provider_id: string
  amount: number
  bank_name: string | null
  bank_account: string | null   // PII_HIGH
  duitnow_number: string | null // PII_MED
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  admin_note: string | null
  requested_at: string
  processed_at: string | null
  processed_by: string | null
  is_active: boolean
}

// ── Joined / Enriched Types ───────────────────────────────────

export interface ProviderWithProfile extends DbUser {
  provider_profiles: DbProviderProfile | null
  provider_pricing: DbProviderPricing[]
  provider_availabilities: DbProviderAvailability[]
}

export interface BookingWithParties extends DbBooking {
  customer: Pick<DbUser, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
  provider: Pick<DbUser, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
  provider_profile: Pick<DbProviderProfile, 'location_city' | 'rating_avg' | 'ic_verified' | 'license_verified'> | null
}

// ── Helper Guards ─────────────────────────────────────────────

export const LOCUM_ROLES: UserRole[] = ['locum_nurse', 'locum_physio', 'locum_care_aide']
export const PROVIDER_ROLES: UserRole[] = ['locum_nurse', 'locum_physio', 'locum_care_aide', 'medical_escort', 'companion']
export const CUSTOMER_ROLES: UserRole[] = ['customer', 'waris']

export function isLocumRole(role: string): boolean {
  return LOCUM_ROLES.includes(role as UserRole)
}

export function isProviderRole(role: string): boolean {
  return PROVIDER_ROLES.includes(role as UserRole)
}

export function isCustomerRole(role: string): boolean {
  return CUSTOMER_ROLES.includes(role as UserRole)
}

export function requiresLicenseVerification(role: string): boolean {
  return ['locum_nurse', 'locum_physio', 'locum_care_aide'].includes(role)
}
