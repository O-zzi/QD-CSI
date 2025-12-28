-- Cleanup Duplicates for The Quarterdeck
-- Run this in Supabase SQL Editor to remove any duplicate records
-- Safe to run multiple times

-- ============================================
-- 1. Remove duplicate site_settings (keep first by created_at)
-- ============================================
DELETE FROM site_settings a
USING site_settings b
WHERE a.id > b.id 
  AND a.key = b.key;

-- ============================================
-- 2. Remove duplicate facilities (keep first by slug)
-- ============================================
DELETE FROM facilities a
USING facilities b
WHERE a.id > b.id 
  AND a.slug = b.slug;

-- ============================================
-- 3. Remove duplicate pricing_tiers (keep first by tier)
-- ============================================
DELETE FROM pricing_tiers a
USING pricing_tiers b
WHERE a.id > b.id 
  AND a.tier = b.tier;

-- ============================================
-- 4. Remove duplicate events (keep first by title + start_time)
-- ============================================
DELETE FROM events a
USING events b
WHERE a.id > b.id 
  AND a.title = b.title
  AND a.start_time = b.start_time;

-- ============================================
-- 5. Remove duplicate announcements (keep first by title)
-- ============================================
DELETE FROM announcements a
USING announcements b
WHERE a.id > b.id 
  AND a.title = b.title;

-- ============================================
-- 6. Remove duplicate rules (keep first by title)
-- ============================================
DELETE FROM rules a
USING rules b
WHERE a.id > b.id 
  AND a.title = b.title;

-- ============================================
-- 7. Remove duplicate careers (keep first by title)
-- ============================================
DELETE FROM careers a
USING careers b
WHERE a.id > b.id 
  AND a.title = b.title;

-- ============================================
-- 8. Remove duplicate users (keep first by email)
-- ============================================
DELETE FROM users a
USING users b
WHERE a.id > b.id 
  AND a.email = b.email;

-- ============================================
-- 9. Remove duplicate venues (keep first by slug)
-- ============================================
DELETE FROM venues a
USING venues b
WHERE a.id > b.id 
  AND a.slug = b.slug;

-- ============================================
-- 10. Remove duplicate membership_tier_definitions (keep first by slug)
-- ============================================
DELETE FROM membership_tier_definitions a
USING membership_tier_definitions b
WHERE a.id > b.id 
  AND a.slug = b.slug;

-- ============================================
-- 11. VERIFY - Show counts after cleanup
-- ============================================
SELECT 'Site Settings' as table_name, COUNT(*) as count FROM site_settings
UNION ALL SELECT 'Facilities', COUNT(*) FROM facilities
UNION ALL SELECT 'Pricing Tiers', COUNT(*) FROM pricing_tiers
UNION ALL SELECT 'Events', COUNT(*) FROM events
UNION ALL SELECT 'Announcements', COUNT(*) FROM announcements
UNION ALL SELECT 'Rules', COUNT(*) FROM rules
UNION ALL SELECT 'Careers', COUNT(*) FROM careers
UNION ALL SELECT 'Users', COUNT(*) FROM users
UNION ALL SELECT 'Venues', COUNT(*) FROM venues
UNION ALL SELECT 'Construction Phases', COUNT(*) FROM construction_phases
ORDER BY table_name;
