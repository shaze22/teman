-- SenioCare v2 Migration — Locum Platform Pivot
-- 2026-06-15
-- Pivot dari Meal Companion → Professional Locum + Companion Services
-- SOP Classification: Class A (rekod kesihatan, sijil profesional)

-- ============================================================
-- 1. UPDATE USERS TABLE — new roles
-- ============================================================

-- Add new role values to users.role column
-- (Supabase stores role as TEXT, so no enum migration needed)
-- New roles: locum_nurse, locum_physio, locum_care_aide, medical_escort, companion
-- Keep: customer, waris, super_admin
-- Legacy (preserve existing data): single_mother, ngo_admin, care_center

-- Update users table: add missing columns if not present
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- ============================================================
-- 2. CREATE provider_profiles — replaces single_mother_profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Basic info
  full_name             TEXT,
  location_state        TEXT NOT NULL DEFAULT '',
  location_city         TEXT NOT NULL DEFAULT '',
  location_postcode     TEXT,
  location_lat          DECIMAL(10,8),
  location_lng          DECIMAL(11,8),
  bio                   TEXT,
  languages             TEXT[]        DEFAULT ARRAY['bm'],
  has_transport         TEXT          DEFAULT 'none', -- 'none' | 'motorcycle' | 'car'
  avatar_url            TEXT,

  -- Identity verification (PII_HIGH)
  ic_number             TEXT,
  ic_url                TEXT,
  selfie_url            TEXT,
  ic_verified           BOOLEAN       DEFAULT false,
  gemini_confidence     TEXT,
  gemini_face_match     BOOLEAN,
  gemini_verified_at    TIMESTAMPTZ,

  -- Professional verification (locum roles only)
  license_number        TEXT,          -- LJM reg number / LFM reg number / IHRAM cert number
  license_type          TEXT,          -- 'LJM_SRN' | 'LJM_SEM' | 'LFM' | 'IHRAM_HOMECARE' | 'OTHER'
  license_url           TEXT,          -- sijil PDF/image URL
  license_expiry        DATE,
  license_verified      BOOLEAN        DEFAULT false,
  license_verified_at   TIMESTAMPTZ,
  license_verified_by   TEXT           REFERENCES users(id),
  license_rejection_reason TEXT,
  has_indemnity_insurance BOOLEAN      DEFAULT false,
  insurance_url         TEXT,

  -- Stats
  rating_avg            DECIMAL(3,1)  DEFAULT 0.0,
  total_reviews         INT           DEFAULT 0,
  total_bookings        INT           DEFAULT 0,
  earnings_total        DECIMAL(10,2) DEFAULT 0.00,
  wallet_balance        DECIMAL(10,2) DEFAULT 0.00,

  -- Consent
  provider_consent      BOOLEAN       DEFAULT false,
  provider_consent_at   TIMESTAMPTZ,
  companion_consent     BOOLEAN       DEFAULT false,  -- extra consent for companion rules
  companion_consent_at  TIMESTAMPTZ,

  -- Gemini rate limiting
  gemini_verify_attempts INT          DEFAULT 0,
  gemini_last_attempt   TIMESTAMPTZ,

  -- Status
  is_active             BOOLEAN       DEFAULT true,
  is_available          BOOLEAN       DEFAULT true,
  created_at            TIMESTAMPTZ   DEFAULT now(),
  updated_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_provider_profiles_user_id   ON provider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_city      ON provider_profiles(location_city);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_state     ON provider_profiles(location_state);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_verified  ON provider_profiles(ic_verified, license_verified);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_active    ON provider_profiles(is_active);

ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider can read own profile"
  ON provider_profiles FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "provider can update own profile"
  ON provider_profiles FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "public can read active providers"
  ON provider_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "admin full access to provider_profiles"
  ON provider_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND role = 'super_admin'
    )
  );

-- ============================================================
-- 3. CREATE professional_licenses — detailed license records
-- ============================================================

CREATE TABLE IF NOT EXISTS professional_licenses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  license_type      TEXT NOT NULL,  -- 'LJM_SRN' | 'LJM_SEM' | 'LFM' | 'IHRAM_HOMECARE' | 'KKM_PARAMEDIC'
  license_number    TEXT NOT NULL,
  license_url       TEXT,           -- PII_HIGH
  issued_by         TEXT,           -- 'Lembaga Jururawat Malaysia' etc
  issue_date        DATE,
  expiry_date       DATE,

  -- Verification
  verified          BOOLEAN         DEFAULT false,
  verified_at       TIMESTAMPTZ,
  verified_by       TEXT            REFERENCES users(id),
  rejection_reason  TEXT,

  -- Status
  is_primary        BOOLEAN         DEFAULT true,  -- main license for role
  is_active         BOOLEAN         DEFAULT true,
  created_at        TIMESTAMPTZ     DEFAULT now(),
  updated_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_professional_licenses_provider ON professional_licenses(provider_id);
CREATE INDEX IF NOT EXISTS idx_professional_licenses_type     ON professional_licenses(license_type);
CREATE INDEX IF NOT EXISTS idx_professional_licenses_verified ON professional_licenses(verified);

ALTER TABLE professional_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider can read own licenses"
  ON professional_licenses FOR SELECT
  USING (provider_id = auth.uid()::text);

CREATE POLICY "provider can insert own licenses"
  ON professional_licenses FOR INSERT
  WITH CHECK (provider_id = auth.uid()::text);

CREATE POLICY "admin full access to professional_licenses"
  ON professional_licenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND role = 'super_admin'
    )
  );

-- ============================================================
-- 4. CREATE provider_pricing — updated service types
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_pricing (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_type  TEXT NOT NULL,  -- 'nursing' | 'physiotherapy' | 'home_care' | 'medical_escort' | 'riadah' | 'ibadah' | 'makan'
  pricing_type  TEXT NOT NULL DEFAULT 'per_session',  -- 'per_hour' | 'per_session' | 'per_day'
  price         DECIMAL(10,2) NOT NULL,
  currency      TEXT DEFAULT 'MYR',
  description   TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_provider_pricing_provider ON provider_pricing(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_pricing_service  ON provider_pricing(service_type);

ALTER TABLE provider_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider can manage own pricing"
  ON provider_pricing FOR ALL
  USING (provider_id = auth.uid()::text)
  WITH CHECK (provider_id = auth.uid()::text);

CREATE POLICY "public can read active pricing"
  ON provider_pricing FOR SELECT
  USING (is_active = true);

CREATE POLICY "admin full access to provider_pricing"
  ON provider_pricing FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'super_admin')
  );

-- ============================================================
-- 5. CREATE provider_availabilities
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_availabilities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week     INT NOT NULL,       -- 0=Sun, 1=Mon, ..., 6=Sat
  start_time      TEXT NOT NULL,      -- 'HH:MM'
  end_time        TEXT NOT NULL,      -- 'HH:MM'
  is_recurring    BOOLEAN DEFAULT true,
  specific_date   DATE,
  is_available    BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_avail_provider ON provider_availabilities(provider_id);

ALTER TABLE provider_availabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider manages own availability"
  ON provider_availabilities FOR ALL
  USING (provider_id = auth.uid()::text)
  WITH CHECK (provider_id = auth.uid()::text);

CREATE POLICY "public can read availability"
  ON provider_availabilities FOR SELECT
  USING (true);

-- ============================================================
-- 6. UPDATE bookings table — new service types + locum fields
-- ============================================================

-- Add locum-specific fields to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS service_notes        TEXT,           -- additional booking notes
  ADD COLUMN IF NOT EXISTS health_conditions    TEXT[],         -- senior health info (PII_HIGH)
  ADD COLUMN IF NOT EXISTS medications          TEXT,           -- current medications (PII_HIGH)
  ADD COLUMN IF NOT EXISTS mobility_status      TEXT,           -- 'independent' | 'walking_stick' | 'wheelchair' | 'bedridden'
  ADD COLUMN IF NOT EXISTS emergency_contact    TEXT,           -- name + phone (PII_MED)
  ADD COLUMN IF NOT EXISTS platform_fee_pct     DECIMAL(5,2),   -- fee % at time of booking
  ADD COLUMN IF NOT EXISTS provider_amount      DECIMAL(10,2),  -- amount provider receives
  ADD COLUMN IF NOT EXISTS funds_released       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS funds_released_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_sent        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS companion_checkin_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_checkin_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reschedule_count     INT DEFAULT 0;

-- ============================================================
-- 7. UPDATE customer_profiles — health tracking fields
-- ============================================================

ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS registrant_dob       DATE,           -- PII_MED
  ADD COLUMN IF NOT EXISTS customer_consent     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_consent_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preferred_gender     TEXT,           -- 'female_only' | 'no_preference'
  ADD COLUMN IF NOT EXISTS senior_health_notes  TEXT;           -- PII_HIGH

-- ============================================================
-- 8. SYSTEM TABLES
-- ============================================================

-- Gemini verify rate limiting (keep existing if present)
CREATE TABLE IF NOT EXISTS gemini_verify_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address  TEXT NOT NULL,
  provider_id TEXT,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gemini_attempts_ip   ON gemini_verify_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_gemini_attempts_time ON gemini_verify_attempts(attempted_at);

ALTER TABLE gemini_verify_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin read gemini attempts"
  ON gemini_verify_attempts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'super_admin')
  );

-- Withdrawal requests (keep existing structure)
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          DECIMAL(10,2) NOT NULL,
  bank_name       TEXT,
  bank_account    TEXT,           -- PII_HIGH
  duitnow_number  TEXT,           -- PII_MED
  status          TEXT DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected' | 'completed'
  admin_note      TEXT,
  requested_at    TIMESTAMPTZ DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  processed_by    TEXT REFERENCES users(id),
  is_active       BOOLEAN DEFAULT true
);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider reads own withdrawals"
  ON withdrawal_requests FOR SELECT
  USING (provider_id = auth.uid()::text);

CREATE POLICY "provider creates own withdrawal"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (provider_id = auth.uid()::text);

CREATE POLICY "admin manages withdrawals"
  ON withdrawal_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'super_admin')
  );

-- Reports / disputes
CREATE TABLE IF NOT EXISTS reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       TEXT NOT NULL REFERENCES users(id),
  reported_user_id  TEXT NOT NULL REFERENCES users(id),
  booking_id        TEXT REFERENCES bookings(id),
  category          TEXT NOT NULL,  -- 'no_show' | 'misconduct' | 'fraud' | 'harassment' | 'other'
  description       TEXT,
  status            TEXT DEFAULT 'pending',  -- 'pending' | 'investigating' | 'resolved' | 'dismissed'
  admin_note        TEXT,
  resolved_at       TIMESTAMPTZ,
  resolved_by       TEXT REFERENCES users(id),
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user reads own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid()::text);

CREATE POLICY "user creates report"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid()::text);

CREATE POLICY "admin manages reports"
  ON reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'super_admin')
  );

-- Reschedule requests
CREATE TABLE IF NOT EXISTS reschedule_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  requested_by  TEXT NOT NULL REFERENCES users(id),
  new_date      DATE NOT NULL,
  new_time      TEXT NOT NULL,
  note          TEXT,
  status        TEXT DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected'
  responded_at  TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reschedule_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking parties read reschedule"
  ON reschedule_requests FOR SELECT
  USING (
    requested_by = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reschedule_requests.booking_id
      AND (bookings.customer_id = auth.uid()::text OR bookings.provider_id = auth.uid()::text)
    )
  );

-- ============================================================
-- 9. HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::text
    AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- 10. STORAGE BUCKETS (run via Supabase Dashboard if needed)
-- ============================================================
-- Buckets required:
--   ic-documents     → private, 10MB limit, image/pdf
--   license-certs    → private, 20MB limit, image/pdf (NEW)
--   insurance-docs   → private, 20MB limit, image/pdf (NEW)
--   provider-gallery → public, 5MB limit, image/*

-- NOTE: Create these via Supabase Dashboard → Storage
-- or via supabase CLI: supabase storage create-bucket ...
