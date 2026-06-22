-- =====================================================
-- emrSoft demo users — INSERT queries (one per user)
-- Schema: emrsoft_encrypted (change SET search_path if needed)
-- Tenant org: organization_id = 1 (emrSoft Healthcare / subdomain emrsoft)
-- SaaS admin: organization_id = 0
--
-- Requires: CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Passwords match shared/demo-credentials.ts and login screen
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

SET search_path TO emrsoft_encrypted;

-- Replace 1 with your tenant organization id if different:
-- SELECT id, name, subdomain FROM organizations WHERE subdomain = 'emrsoft';

-- -----------------------------------------------------
-- Doctor: paul@emrsoft.ai / doctor123
-- -----------------------------------------------------
INSERT INTO users (
  organization_id,
  email,
  username,
  password_hash,
  first_name,
  last_name,
  role,
  department,
  medical_specialty_category,
  sub_specialty,
  working_days,
  working_hours,
  permissions,
  is_active,
  is_saas_owner,
  created_at
)
SELECT
  1,
  'paul@emrsoft.ai',
  'paul',
  crypt('doctor123', gen_salt('bf', 12)),
  'Paul',
  'Smith',
  'doctor',
  'Cardiology',
  NULL,
  NULL,
  '["Monday","Tuesday","Wednesday","Thursday","Friday"]'::jsonb,
  '{"start":"08:00","end":"17:00"}'::jsonb,
  '{}'::jsonb,
  true,
  false,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users u
  WHERE u.organization_id = 1 AND u.email = 'paul@emrsoft.ai'
);

-- -----------------------------------------------------
-- Nurse: emma@emrsoft.ai / nurse123
-- -----------------------------------------------------
INSERT INTO users (
  organization_id,
  email,
  username,
  password_hash,
  first_name,
  last_name,
  role,
  department,
  medical_specialty_category,
  sub_specialty,
  working_days,
  working_hours,
  permissions,
  is_active,
  is_saas_owner,
  created_at
)
SELECT
  1,
  'emma@emrsoft.ai',
  'emma',
  crypt('nurse123', gen_salt('bf', 12)),
  'Emma',
  'Johnson',
  'nurse',
  'General Medicine',
  NULL,
  NULL,
  '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]'::jsonb,
  '{"start":"07:00","end":"19:00"}'::jsonb,
  '{}'::jsonb,
  true,
  false,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users u
  WHERE u.organization_id = 1 AND u.email = 'emma@emrsoft.ai'
);

-- -----------------------------------------------------
-- Patient: john@emrsoft.ai / patient123
-- -----------------------------------------------------
INSERT INTO users (
  organization_id,
  email,
  username,
  password_hash,
  first_name,
  last_name,
  role,
  department,
  medical_specialty_category,
  sub_specialty,
  working_days,
  working_hours,
  permissions,
  is_active,
  is_saas_owner,
  created_at
)
SELECT
  1,
  'john@emrsoft.ai',
  'john',
  crypt('patient123', gen_salt('bf', 12)),
  'John',
  'Patient',
  'patient',
  NULL,
  NULL,
  NULL,
  '[]'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  true,
  false,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users u
  WHERE u.organization_id = 1 AND u.email = 'john@emrsoft.ai'
);

-- -----------------------------------------------------
-- Lab-Technician: amelia@emrsoft.ai / lab123
-- -----------------------------------------------------
INSERT INTO users (
  organization_id,
  email,
  username,
  password_hash,
  first_name,
  last_name,
  role,
  department,
  medical_specialty_category,
  sub_specialty,
  working_days,
  working_hours,
  permissions,
  is_active,
  is_saas_owner,
  created_at
)
SELECT
  1,
  'amelia@emrsoft.ai',
  'amelia',
  crypt('lab123', gen_salt('bf', 12)),
  'Amelia',
  'Rodriguez',
  'lab_technician',
  'Laboratory',
  NULL,
  NULL,
  '["Monday","Tuesday","Wednesday","Thursday","Friday"]'::jsonb,
  '{"start":"06:00","end":"14:00"}'::jsonb,
  '{}'::jsonb,
  true,
  false,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users u
  WHERE u.organization_id = 1 AND u.email = 'amelia@emrsoft.ai'
);

-- -----------------------------------------------------
-- Sample-Taker: sampletaker@emrsoft.ai / sample123
-- -----------------------------------------------------
INSERT INTO users (
  organization_id,
  email,
  username,
  password_hash,
  first_name,
  last_name,
  role,
  department,
  medical_specialty_category,
  sub_specialty,
  working_days,
  working_hours,
  permissions,
  is_active,
  is_saas_owner,
  created_at
)
SELECT
  1,
  'sampletaker@emrsoft.ai',
  'sampletaker',
  crypt('sample123', gen_salt('bf', 12)),
  'James',
  'Wilson',
  'sample_taker',
  'Laboratory',
  NULL,
  NULL,
  '["Monday","Tuesday","Wednesday","Thursday","Friday"]'::jsonb,
  '{"start":"06:00","end":"14:00"}'::jsonb,
  '{}'::jsonb,
  true,
  false,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users u
  WHERE u.organization_id = 1 AND u.email = 'sampletaker@emrsoft.ai'
);

-- -----------------------------------------------------
-- Pharmacist: Pharmacist@emrsoft.ai / pharmacist123
-- -----------------------------------------------------
INSERT INTO users (
  organization_id,
  email,
  username,
  password_hash,
  first_name,
  last_name,
  role,
  department,
  medical_specialty_category,
  sub_specialty,
  working_days,
  working_hours,
  permissions,
  is_active,
  is_saas_owner,
  created_at
)
SELECT
  1,
  'Pharmacist@emrsoft.ai',
  'pharmacist',
  crypt('pharmacist123', gen_salt('bf', 12)),
  'Sarah',
  'Thompson',
  'pharmacist',
  'Pharmacy',
  NULL,
  NULL,
  '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]'::jsonb,
  '{"start":"08:00","end":"18:00"}'::jsonb,
  '{}'::jsonb,
  true,
  false,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users u
  WHERE u.organization_id = 1 AND u.email = 'Pharmacist@emrsoft.ai'
);

-- -----------------------------------------------------
-- Admin (tenant org): james@emrsoft.ai / 467fe887
-- -----------------------------------------------------
INSERT INTO users (
  organization_id,
  email,
  username,
  password_hash,
  first_name,
  last_name,
  role,
  department,
  medical_specialty_category,
  sub_specialty,
  working_days,
  working_hours,
  permissions,
  is_active,
  is_saas_owner,
  created_at
)
SELECT
  1,
  'james@emrsoft.ai',
  'james',
  crypt('467fe887', gen_salt('bf', 12)),
  'James',
  'Administrator',
  'admin',
  'Administration',
  NULL,
  NULL,
  '["Monday","Tuesday","Wednesday","Thursday","Friday"]'::jsonb,
  '{"start":"09:00","end":"17:00"}'::jsonb,
  '{}'::jsonb,
  true,
  false,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users u
  WHERE u.organization_id = 1 AND u.email = 'james@emrsoft.ai'
);

-- -----------------------------------------------------
-- SaaS Admin (platform): saas_admin@emrsoft.ai / admin123
-- organization_id = 0, is_saas_owner = true
-- -----------------------------------------------------
INSERT INTO users (
  organization_id,
  email,
  username,
  password_hash,
  first_name,
  last_name,
  role,
  department,
  medical_specialty_category,
  sub_specialty,
  working_days,
  working_hours,
  permissions,
  is_active,
  is_saas_owner,
  created_at
)
SELECT
  0,
  'saas_admin@emrsoft.ai',
  'saas_admin',
  crypt('admin123', gen_salt('bf', 12)),
  'SaaS',
  'Administrator',
  'admin',
  NULL,
  NULL,
  NULL,
  '[]'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  true,
  true,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users u
  WHERE u.organization_id = 0 AND u.username = 'saas_admin'
);

-- =====================================================
-- LOGIN REFERENCE
-- =====================================================
-- Doctor          | paul@emrsoft.ai          | doctor123
-- Nurse           | emma@emrsoft.ai          | nurse123
-- Patient         | john@emrsoft.ai          | patient123
-- Lab-Technician  | amelia@emrsoft.ai        | lab123
-- Sample-Taker    | sampletaker@emrsoft.ai   | sample123
-- Pharmacist      | Pharmacist@emrsoft.ai    | pharmacist123
-- Admin           | james@emrsoft.ai         | 467fe887
-- SaaS Admin      | saas_admin@emrsoft.ai    | admin123  (org 0, /saas)
