-- Comprehensive CMS Seed for The Quarterdeck
-- Run this in Supabase SQL Editor to populate all CMS content
-- Safe to run multiple times (uses ON CONFLICT or checks for existing data)

-- ============================================
-- 1. VENUES (Required for Facility linking)
-- ============================================
INSERT INTO venues (id, name, slug, city, country, status, is_default)
VALUES (
  gen_random_uuid()::text,
  'The Quarterdeck Islamabad',
  'islamabad',
  'Islamabad',
  'Pakistan',
  'ACTIVE',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. FACILITY ADD-ONS (Link to existing facilities)
-- ============================================
DO $$
DECLARE
  padel_id TEXT;
  squash_id TEXT;
  rifle_id TEXT;
  hall_id TEXT;
  bridge_id TEXT;
BEGIN
  -- Get facility IDs
  SELECT id INTO padel_id FROM facilities WHERE slug = 'padel-tennis' LIMIT 1;
  SELECT id INTO squash_id FROM facilities WHERE slug = 'squash' LIMIT 1;
  SELECT id INTO rifle_id FROM facilities WHERE slug = 'air-rifle-range' LIMIT 1;
  SELECT id INTO hall_id FROM facilities WHERE slug = 'multipurpose-hall' LIMIT 1;
  SELECT id INTO bridge_id FROM facilities WHERE slug = 'bridge-room' LIMIT 1;

  -- Clear existing add-ons and insert fresh
  DELETE FROM facility_add_ons WHERE facility_id IN (padel_id, squash_id, rifle_id, hall_id, bridge_id);

  -- Padel Tennis Add-ons
  IF padel_id IS NOT NULL THEN
    INSERT INTO facility_add_ons (id, facility_id, label, price, icon) VALUES
    (gen_random_uuid()::text, padel_id, 'Padel Racket Rental', 500, 'racket'),
    (gen_random_uuid()::text, padel_id, 'Ball Pack (3 balls)', 800, 'balls'),
    (gen_random_uuid()::text, padel_id, 'Professional Coaching (1hr)', 3000, 'coach'),
    (gen_random_uuid()::text, padel_id, 'Towel Service', 200, 'towel'),
    (gen_random_uuid()::text, padel_id, 'Mineral Water', 100, 'water');
  END IF;

  -- Squash Add-ons
  IF squash_id IS NOT NULL THEN
    INSERT INTO facility_add_ons (id, facility_id, label, price, icon) VALUES
    (gen_random_uuid()::text, squash_id, 'Squash Racket Rental', 400, 'racket'),
    (gen_random_uuid()::text, squash_id, 'Ball Tube (3 balls)', 600, 'balls'),
    (gen_random_uuid()::text, squash_id, 'Professional Coaching (1hr)', 2500, 'coach'),
    (gen_random_uuid()::text, squash_id, 'Towel Service', 200, 'towel'),
    (gen_random_uuid()::text, squash_id, 'Mineral Water', 100, 'water');
  END IF;

  -- Air Rifle Add-ons
  IF rifle_id IS NOT NULL THEN
    INSERT INTO facility_add_ons (id, facility_id, label, price, icon) VALUES
    (gen_random_uuid()::text, rifle_id, 'Extra Pellet Pack (100)', 500, 'ammo'),
    (gen_random_uuid()::text, rifle_id, 'Eye Protection', 300, 'glasses'),
    (gen_random_uuid()::text, rifle_id, 'Ear Protection', 200, 'headphones'),
    (gen_random_uuid()::text, rifle_id, 'Private Instructor (1hr)', 3500, 'coach');
  END IF;

  -- Multipurpose Hall Add-ons
  IF hall_id IS NOT NULL THEN
    INSERT INTO facility_add_ons (id, facility_id, label, price, icon) VALUES
    (gen_random_uuid()::text, hall_id, 'Sound System Setup', 5000, 'speaker'),
    (gen_random_uuid()::text, hall_id, 'Projector & Screen', 3000, 'projector'),
    (gen_random_uuid()::text, hall_id, 'Catering (per person)', 1500, 'utensils'),
    (gen_random_uuid()::text, hall_id, 'Stage Setup', 10000, 'stage');
  END IF;

  -- Bridge Room Add-ons
  IF bridge_id IS NOT NULL THEN
    INSERT INTO facility_add_ons (id, facility_id, label, price, icon) VALUES
    (gen_random_uuid()::text, bridge_id, 'Playing Cards (New Deck)', 500, 'cards'),
    (gen_random_uuid()::text, bridge_id, 'Refreshments Package', 1000, 'coffee'),
    (gen_random_uuid()::text, bridge_id, 'Tournament Director', 5000, 'director');
  END IF;
END $$;

-- ============================================
-- 3. HERO SECTIONS (Per-page heroes)
-- ============================================
INSERT INTO hero_sections (id, page, title, subtitle, background_image_url, overlay_opacity, is_active)
VALUES
  (gen_random_uuid()::text, 'facilities', 'Our Facilities', 'World-class sports and recreation facilities', NULL, 60, true),
  (gen_random_uuid()::text, 'events', 'Events & Tournaments', 'Join exciting competitions and community gatherings', NULL, 60, true),
  (gen_random_uuid()::text, 'membership', 'Become a Member', 'Join The Quarterdeck community and unlock exclusive benefits', NULL, 60, true),
  (gen_random_uuid()::text, 'contact', 'Contact Us', 'Get in touch with our team', NULL, 60, true),
  (gen_random_uuid()::text, 'careers', 'Join Our Team', 'Build your career with The Quarterdeck', NULL, 60, true),
  (gen_random_uuid()::text, 'gallery', 'Photo Gallery', 'Explore our facilities and events', NULL, 60, true),
  (gen_random_uuid()::text, 'roadmap', 'Construction Progress', 'Follow our journey to completion', NULL, 60, true),
  (gen_random_uuid()::text, 'faq', 'Frequently Asked Questions', 'Find answers to common questions', NULL, 60, true),
  (gen_random_uuid()::text, 'rules', 'Club Rules', 'Guidelines for all members and guests', NULL, 60, true),
  (gen_random_uuid()::text, 'leaderboard', 'Leaderboard', 'See our top performers', NULL, 60, true)
ON CONFLICT (page) DO NOTHING;

-- ============================================
-- 4. CTAs (Call-to-Action components)
-- ============================================
INSERT INTO ctas (id, page, section, title, subtitle, button_text, button_url, variant, is_active)
VALUES
  (gen_random_uuid()::text, 'home', 'hero', 'Book Your Court', 'Reserve your spot today', 'Book Now', '/booking', 'primary', true),
  (gen_random_uuid()::text, 'home', 'facilities', 'Explore Facilities', 'Discover our world-class amenities', 'View All', '/facilities', 'secondary', true),
  (gen_random_uuid()::text, 'membership', 'main', 'Apply for Membership', 'Join our exclusive community', 'Apply Now', '/membership/apply', 'primary', true),
  (gen_random_uuid()::text, 'facilities', 'footer', 'Ready to Play?', 'Book your session now', 'Book Now', '/booking', 'primary', true),
  (gen_random_uuid()::text, 'events', 'footer', 'Want to Participate?', 'Register for upcoming events', 'View Events', '/events', 'secondary', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. COMPARISON FEATURES (Membership comparison)
-- ============================================
INSERT INTO comparison_features (id, feature, founding, gold, silver, bronze, guest, sort_order, is_active)
VALUES
  (gen_random_uuid()::text, 'Off-Peak Discount', '25%', '20%', '15%', '10%', 'None', 1, true),
  (gen_random_uuid()::text, 'Guest Passes (Monthly)', '8', '4', '2', '1', 'N/A', 2, true),
  (gen_random_uuid()::text, 'Priority Booking', 'Yes', 'Yes', 'Yes', 'No', 'No', 3, true),
  (gen_random_uuid()::text, 'Tournament Entry', 'Free', 'Free', 'Discounted', 'Regular Price', 'N/A', 4, true),
  (gen_random_uuid()::text, 'Locker Rental', 'Free', 'Discounted', 'Discounted', 'Regular Price', 'N/A', 5, true),
  (gen_random_uuid()::text, 'Pro Shop Discount', '20%', '15%', '10%', '5%', 'None', 6, true),
  (gen_random_uuid()::text, 'Cafe & Bar Discount', '15%', '10%', '5%', 'None', 'None', 7, true),
  (gen_random_uuid()::text, 'Exclusive Events Access', 'Yes', 'Yes', 'Limited', 'No', 'No', 8, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. MEMBER BENEFITS (Why join section)
-- ============================================
INSERT INTO member_benefits (id, title, description, icon, sort_order, is_active)
VALUES
  (gen_random_uuid()::text, 'Priority Booking', 'Book courts up to 14 days in advance, before non-members', 'calendar', 1, true),
  (gen_random_uuid()::text, 'Exclusive Discounts', 'Save up to 25% on off-peak bookings and pro shop purchases', 'percent', 2, true),
  (gen_random_uuid()::text, 'Guest Privileges', 'Bring friends and family with included guest passes', 'users', 3, true),
  (gen_random_uuid()::text, 'Members-Only Events', 'Access exclusive tournaments, social events, and workshops', 'star', 4, true),
  (gen_random_uuid()::text, 'Premium Facilities', 'Enjoy our locker rooms, lounge areas, and member amenities', 'building', 5, true),
  (gen_random_uuid()::text, 'Community Access', 'Join a network of sports enthusiasts and professionals', 'heart', 6, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. TESTIMONIALS
-- ============================================
INSERT INTO testimonials (id, name, title, quote, rating, is_featured, is_active)
VALUES
  (gen_random_uuid()::text, 'Ahmed Khan', 'Founding Member', 'The Quarterdeck has transformed my fitness routine. The facilities are world-class and the staff is incredibly helpful.', 5, true, true),
  (gen_random_uuid()::text, 'Sarah Ali', 'Gold Member', 'Best padel courts in Islamabad! I love the atmosphere and the community of players here.', 5, true, true),
  (gen_random_uuid()::text, 'Hamza Malik', 'Corporate Member', 'We host all our company events at The Quarterdeck. The multipurpose hall is perfect for our needs.', 5, false, true),
  (gen_random_uuid()::text, 'Fatima Hassan', 'Silver Member', 'The squash courts are fantastic. Clean, well-maintained, and the coaching staff is excellent.', 5, false, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. VERIFY SEEDED DATA
-- ============================================
SELECT 'Venues' as data_type, COUNT(*) as count FROM venues
UNION ALL SELECT 'Facility Add-ons', COUNT(*) FROM facility_add_ons
UNION ALL SELECT 'Hero Sections', COUNT(*) FROM hero_sections
UNION ALL SELECT 'CTAs', COUNT(*) FROM ctas
UNION ALL SELECT 'Comparison Features', COUNT(*) FROM comparison_features
UNION ALL SELECT 'Member Benefits', COUNT(*) FROM member_benefits
UNION ALL SELECT 'Testimonials', COUNT(*) FROM testimonials
ORDER BY data_type;
