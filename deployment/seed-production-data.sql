-- Seed Production Data for The Quarterdeck
-- Run this in Supabase SQL Editor after the schema migration

-- ============================================
-- 1. FIX ADMIN PASSWORD (fresh bcrypt hash)
-- ============================================
UPDATE users 
SET password_hash = '$2b$10$1WU4GvCDbaCs4qvDLE06L.B93qWCq0VeKa9v2z2SLN7FnEKVslqh6'
WHERE email = 'admin@quarterdeck.pk';

-- ============================================
-- 2. CONSTRUCTION PHASES (for homepage timeline)
-- ============================================
INSERT INTO construction_phases (id, label, title, status, progress, is_active, is_complete, timeframe, milestones, highlights, icon, sort_order) VALUES
(gen_random_uuid()::text, 'Phase 1', 'Site Preparation & Foundation', 'COMPLETE', 100, false, true, 'Q1 2025', 
 '["Land clearing completed", "Foundation laid", "Underground utilities installed"]'::jsonb, 
 '["5,000 sqm site prepared", "Deep foundation work completed"]'::jsonb, 
 'check-circle', 1),
(gen_random_uuid()::text, 'Phase 2', 'Structural Framework', 'IN_PROGRESS', 65, true, false, 'Q2 2025', 
 '["Steel framework installation", "Roofing structure", "Primary walls construction"]'::jsonb, 
 '["Main building structure 65% complete", "Roof installation in progress"]'::jsonb, 
 'hammer', 2),
(gen_random_uuid()::text, 'Phase 3', 'Interior & Facilities', 'NOT_STARTED', 0, false, false, 'Q3 2025', 
 '["Court installations", "Locker rooms", "Reception and lounges", "Air conditioning"]'::jsonb, 
 '["Premium sports surfaces", "Modern amenities"]'::jsonb, 
 'hard-hat', 3),
(gen_random_uuid()::text, 'Phase 4', 'Grand Opening', 'NOT_STARTED', 0, false, false, 'Q4 2026', 
 '["Final inspections", "Staff training", "Soft launch", "Grand opening ceremony"]'::jsonb, 
 '["World-class facilities ready", "Premium membership launch"]'::jsonb, 
 'rocket', 4)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. SAMPLE EVENTS (for Events page)
-- ============================================
INSERT INTO events (id, title, description, event_type, start_time, end_time, location, capacity, registered_count, price, image_url, is_active, is_featured) VALUES
(gen_random_uuid()::text, 'Grand Opening Celebration', 
 'Join us for the grand opening of The Quarterdeck! Experience our world-class facilities, meet our coaches, and enjoy exclusive launch-day offers.',
 'SPECIAL', '2026-10-01 10:00:00', '2026-10-01 18:00:00', 'The Quarterdeck Main Hall', 500, 0, 0, NULL, true, true),
(gen_random_uuid()::text, 'Padel Tennis Championship', 
 'Compete in our inaugural Padel Tennis Championship. Open to all skill levels with separate brackets for beginners, intermediate, and advanced players.',
 'TOURNAMENT', '2026-10-15 09:00:00', '2026-10-15 17:00:00', 'Padel Courts 1-4', 64, 0, 5000, NULL, true, true),
(gen_random_uuid()::text, 'Youth Squash Academy Open Day', 
 'Discover our Youth Squash Academy program. Free trial sessions, meet our certified coaches, and learn about our junior development pathway.',
 'ACADEMY', '2026-10-20 14:00:00', '2026-10-20 18:00:00', 'Squash Courts', 40, 0, 0, NULL, true, false),
(gen_random_uuid()::text, 'Air Rifle Introduction Workshop', 
 'Learn the fundamentals of air rifle shooting in a safe, controlled environment. All equipment provided. Must be 16+ years old.',
 'WORKSHOP', '2026-11-05 10:00:00', '2026-11-05 13:00:00', 'Air Rifle Range', 20, 0, 2500, NULL, true, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. VERIFY DATA WAS INSERTED
-- ============================================
SELECT 'Construction Phases:' as data_type, COUNT(*) as count FROM construction_phases
UNION ALL
SELECT 'Events:' as data_type, COUNT(*) as count FROM events
UNION ALL
SELECT 'Site Settings:' as data_type, COUNT(*) as count FROM site_settings
UNION ALL
SELECT 'Admin Users:' as data_type, COUNT(*) as count FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN');
