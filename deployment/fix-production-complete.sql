-- The Quarterdeck - Production Database Fix Script
-- ================================================
-- Run this script on your Supabase production database to:
-- 1. Create missing tables (event_registrations, career_applications)
-- 2. Add missing CMS content (social links, contact info)
-- 3. Seed site images
--
-- NOTE: Supabase PostgreSQL has pgcrypto enabled by default.
-- If gen_random_uuid() fails, run: CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- STEP 1: Create Missing Tables
-- ================================

-- Event Registrations table (fixes 500 error on event registration)
CREATE TABLE IF NOT EXISTS event_registrations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id VARCHAR NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    guest_count INTEGER DEFAULT 0,
    notes TEXT,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON event_registrations(email);

-- Career Applications table (fixes 500 error on career applications)
CREATE TABLE IF NOT EXISTS career_applications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    career_id VARCHAR REFERENCES careers(id),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    cv_url VARCHAR,
    linkedin_url VARCHAR,
    cover_letter TEXT,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_applications_career_id ON career_applications(career_id);

-- ================================
-- STEP 2: Add Missing CMS Content
-- ================================

-- Insert social media links if not exists
INSERT INTO cms_content (id, key, title, content, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid()::text, 'social_youtube', 'YouTube URL', 'https://youtube.com/@thequarterdeck', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'social_twitter', 'Twitter/X URL', 'https://twitter.com/thequarterdeck', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'social_whatsapp', 'WhatsApp Number', '+92 300 1234567', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'contact_operating_hours', 'Operating Hours', 'Mon-Fri: 6:00 AM - 11:00 PM | Sat-Sun: 7:00 AM - 10:00 PM', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'contact_site_status', 'Site Status', 'The complex is currently under active construction. No public access or walk-ins are permitted for safety reasons.', true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Make sure existing social links are in CMS
INSERT INTO cms_content (id, key, title, content, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid()::text, 'social_instagram', 'Instagram URL', 'https://instagram.com/thequarterdeck', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'social_facebook', 'Facebook URL', 'https://facebook.com/thequarterdeck', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'social_linkedin', 'LinkedIn URL', 'https://linkedin.com/company/thequarterdeck', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'contact_email', 'Contact Email', 'info@thequarterdeck.pk', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'contact_phone', 'Contact Phone', '+92 51 1234567', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'contact_address', 'Contact Address', 'Sector F-7, Islamabad, Pakistan', true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ================================
-- STEP 3: Verify Tables Exist
-- ================================

-- Run this SELECT to verify the tables were created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('event_registrations', 'career_applications', 'cms_content');

-- ================================
-- STEP 4: Seed Site Images
-- ================================

-- Add site images if they don't exist
INSERT INTO site_images (id, image_key, image_url, alt_text, created_at, updated_at)
VALUES
  (gen_random_uuid()::text, 'landing_hero_background', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80', 'Sports complex hero background', NOW(), NOW()),
  (gen_random_uuid()::text, 'footer_background', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80', 'Footer background texture', NOW(), NOW()),
  (gen_random_uuid()::text, 'navbar_background', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1920&q=80', 'Navbar texture', NOW(), NOW())
ON CONFLICT (image_key) DO NOTHING;

-- ================================
-- STEP 5: Print Success Message
-- ================================
SELECT 'Production database fix complete!' as status,
       (SELECT COUNT(*) FROM event_registrations) as event_registrations_count,
       (SELECT COUNT(*) FROM career_applications) as career_applications_count,
       (SELECT COUNT(*) FROM cms_content WHERE key LIKE 'social_%' OR key LIKE 'contact_%') as cms_contact_social_count,
       (SELECT COUNT(*) FROM site_images) as site_images_count;
