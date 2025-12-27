-- The Quarterdeck - Production Database Fix Script
-- ================================================
-- Run this script on your Supabase production database to:
-- 1. Create missing tables (event_registrations, career_applications)
-- 2. Add missing CMS content (social links, contact info)
-- 3. Seed site images (including new CMS images for carousel, membership, gallery)
--
-- NOTE: Supabase PostgreSQL has pgcrypto enabled by default.
-- If gen_random_uuid() fails, run: CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- STEP 1: Create Missing Tables
-- ================================

-- Event Registrations table (fixes 500 error on event registration)
CREATE TABLE IF NOT EXISTS event_registrations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id VARCHAR NOT NULL,
    user_id VARCHAR,
    full_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    guest_count INTEGER DEFAULT 0,
    notes TEXT,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to event_registrations if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'email') THEN
        ALTER TABLE event_registrations ADD COLUMN email VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'full_name') THEN
        ALTER TABLE event_registrations ADD COLUMN full_name VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'phone') THEN
        ALTER TABLE event_registrations ADD COLUMN phone VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'guest_count') THEN
        ALTER TABLE event_registrations ADD COLUMN guest_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'notes') THEN
        ALTER TABLE event_registrations ADD COLUMN notes TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);

-- Career Applications table (fixes 500 error on career applications)
CREATE TABLE IF NOT EXISTS career_applications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    career_id VARCHAR REFERENCES careers(id) ON DELETE SET NULL,
    full_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    cover_letter TEXT,
    cv_url VARCHAR,
    cv_file_name VARCHAR,
    linkedin_url VARCHAR,
    status VARCHAR DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to career_applications if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'career_applications' AND column_name = 'email') THEN
        ALTER TABLE career_applications ADD COLUMN email VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'career_applications' AND column_name = 'full_name') THEN
        ALTER TABLE career_applications ADD COLUMN full_name VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'career_applications' AND column_name = 'cv_file_name') THEN
        ALTER TABLE career_applications ADD COLUMN cv_file_name VARCHAR;
    END IF;
END $$;

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
-- STEP 3: Seed Site Images (using production column names: image_key, image_url)
-- ================================

-- Landing page hero background
INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'landing_hero_background', '/assets/stock_images/padel_tennis_court_i_37ae0ba3.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'landing_hero_background');

-- Coming Soon carousel images
INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'coming_soon_carousel_1', '/assets/stock_images/architectural_render_b118ee78.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'coming_soon_carousel_1');

INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'coming_soon_carousel_2', '/assets/stock_images/padel_tennis_court_i_a0e484ae.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'coming_soon_carousel_2');

INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'coming_soon_carousel_3', '/assets/stock_images/indoor_squash_court__c97e350b.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'coming_soon_carousel_3');

INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'coming_soon_carousel_4', '/assets/stock_images/architectural_render_cd4dce75.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'coming_soon_carousel_4');

INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'coming_soon_carousel_5', '/assets/stock_images/sports_facility_cons_6b087ae8.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'coming_soon_carousel_5');

-- Membership tier images
INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'membership_tier_founding', '/assets/stock_images/padel_tennis_court_i_a0e484ae.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'membership_tier_founding');

INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'membership_tier_associate', '/assets/stock_images/indoor_squash_court__c97e350b.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'membership_tier_associate');

INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'membership_tier_family', '/assets/stock_images/modern_sports_comple_97c8483a.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'membership_tier_family');

INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'membership_tier_corporate', '/assets/stock_images/large_event_hall_int_39cfb773.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'membership_tier_corporate');

INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'membership_tier_forces', '/assets/stock_images/air_rifle_shooting_r_931e6002.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'membership_tier_forces');

-- Gallery homepage images
INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'gallery_homepage_1', '/assets/stock_images/sports_facility_cons_42f46556.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'gallery_homepage_1');

INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'gallery_homepage_2', '/assets/stock_images/sports_facility_cons_44a23ac3.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'gallery_homepage_2');

INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'gallery_homepage_3', '/assets/stock_images/construction_site_fo_987f2281.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'gallery_homepage_3');

INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'gallery_homepage_4', '/assets/stock_images/architectural_render_b118ee78.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'gallery_homepage_4');

INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'gallery_homepage_5', '/assets/stock_images/architectural_render_c7f63aa7.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'gallery_homepage_5');

INSERT INTO site_images (id, image_key, image_url, created_at, updated_at)
SELECT gen_random_uuid()::text, 'gallery_homepage_6', '/assets/stock_images/architectural_render_cd4dce75.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_images WHERE image_key = 'gallery_homepage_6');

-- ================================
-- STEP 4: Update Facility Images
-- ================================

-- Update facilities with image URLs
UPDATE facilities SET image_url = '/assets/stock_images/padel_tennis_court_i_a0e484ae.jpg', updated_at = NOW() WHERE slug = 'padel-tennis';
UPDATE facilities SET image_url = '/assets/stock_images/indoor_squash_court__c97e350b.jpg', updated_at = NOW() WHERE slug = 'squash';
UPDATE facilities SET image_url = '/assets/stock_images/air_rifle_shooting_r_931e6002.jpg', updated_at = NOW() WHERE slug = 'air-rifle-range';
UPDATE facilities SET image_url = '/assets/stock_images/bridge_card_game_clu_6f83cf65.jpg', updated_at = NOW() WHERE slug = 'bridge-room';
UPDATE facilities SET image_url = '/assets/stock_images/large_event_hall_int_39cfb773.jpg', updated_at = NOW() WHERE slug = 'multipurpose-hall';
UPDATE facilities SET image_url = '/assets/stock_images/modern_cafe_bar_inte_bc2874c0.jpg', updated_at = NOW() WHERE slug = 'cafe-bar';

-- ================================
-- STEP 5: Update Hero Sections
-- ================================

-- Update hero sections with background images
UPDATE hero_sections SET background_image_url = '/assets/stock_images/padel_tennis_court_i_a0e484ae.jpg', updated_at = NOW() WHERE page = 'facilities';
UPDATE hero_sections SET background_image_url = '/assets/stock_images/large_event_hall_int_39cfb773.jpg', updated_at = NOW() WHERE page = 'events';
UPDATE hero_sections SET background_image_url = '/assets/stock_images/modern_cafe_bar_inte_bc2874c0.jpg', updated_at = NOW() WHERE page = 'contact';
UPDATE hero_sections SET background_image_url = '/assets/stock_images/modern_sports_comple_97c8483a.jpg', updated_at = NOW() WHERE page = 'careers';
UPDATE hero_sections SET background_image_url = '/assets/stock_images/architectural_render_b118ee78.jpg', updated_at = NOW() WHERE page = 'membership';
UPDATE hero_sections SET background_image_url = '/assets/stock_images/sports_facility_cons_6b087ae8.jpg', updated_at = NOW() WHERE page = 'gallery';
UPDATE hero_sections SET background_image_url = '/assets/stock_images/architectural_render_cd4dce75.jpg', updated_at = NOW() WHERE page = 'roadmap';
UPDATE hero_sections SET background_image_url = '/assets/stock_images/elegant_card_game_ro_42b0454d.jpg', updated_at = NOW() WHERE page = 'faq';
UPDATE hero_sections SET background_image_url = '/assets/stock_images/indoor_squash_court__c97e350b.jpg', updated_at = NOW() WHERE page = 'rules';
UPDATE hero_sections SET background_image_url = '/assets/stock_images/air_rifle_shooting_r_931e6002.jpg', updated_at = NOW() WHERE page = 'leaderboard';

-- ================================
-- STEP 6: Verify Results
-- ================================

SELECT 'Production database fix complete!' as status,
       (SELECT COUNT(*) FROM event_registrations) as event_registrations_count,
       (SELECT COUNT(*) FROM career_applications) as career_applications_count,
       (SELECT COUNT(*) FROM cms_content WHERE key LIKE 'social_%' OR key LIKE 'contact_%') as cms_contact_social_count,
       (SELECT COUNT(*) FROM site_images) as site_images_count,
       (SELECT COUNT(*) FROM facilities WHERE image_url IS NOT NULL) as facilities_with_images;
