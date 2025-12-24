-- The Quarterdeck - Seed Data for Supabase
-- ==========================================
-- Run this after schema.sql to populate initial data

-- Membership Tier Definitions
INSERT INTO membership_tier_definitions (slug, display_name, description, color, discount_percent, guest_passes_included, benefits, sort_order, is_active)
VALUES 
    ('founding', 'Founding Member', 'Exclusive founding membership with premium benefits', '#FFD700', 25, 10, ARRAY['Lifetime priority booking (14-day window)', '25% discount on off-peak bookings', '10 guest passes per month', 'VIP parking & locker'], 1, true),
    ('gold', 'Gold Member', 'Premium membership with enhanced benefits', '#F59E0B', 20, 4, ARRAY['7-day advance booking window', '20% discount on off-peak bookings', '4 guest passes per month', 'Priority event registration'], 2, true),
    ('silver', 'Silver Member', 'Standard membership with core benefits', '#9CA3AF', 10, 2, ARRAY['5-day advance booking window', '10% discount on off-peak bookings', '2 guest passes per month'], 3, true),
    ('guest', 'Pay-to-Play', 'Access without membership commitment', '#6B7280', 0, 0, ARRAY['2-day advance booking window', 'Access after member priority', 'Equipment rental available'], 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Default Venue
INSERT INTO venues (id, name, slug, city, address, status, is_default, sort_order)
VALUES 
    ('default-venue', 'The Quarterdeck Islamabad', 'islamabad', 'Islamabad', 'Sector E-11, Islamabad', 'COMING_SOON', true, 1)
ON CONFLICT DO NOTHING;

-- Facilities
INSERT INTO facilities (slug, name, description, icon, category, base_price, min_players, resource_count, status)
VALUES 
    ('padel-tennis', 'Padel Tennis', 'State-of-the-art padel courts with professional lighting and equipment', 'target', 'racquet', 6000, 4, 3, 'ACTIVE'),
    ('squash', 'Squash Courts', 'Professional squash courts with glass back walls', 'dumbbell', 'racquet', 4000, 2, 1, 'PLANNED'),
    ('air-rifle-range', 'Air Rifle Range', '10m air rifle shooting range with Olympic-standard equipment', 'crosshair', 'shooting', 6000, 1, 2, 'PLANNED'),
    ('bridge-room', 'Bridge Room', 'Comfortable card room for bridge enthusiasts', 'spade', 'cards', 0, 4, 4, 'PLANNED'),
    ('multipurpose-hall', 'Multipurpose Hall', 'Elegant venue for events and celebrations', 'building', 'venue', 6000, 10, 1, 'PLANNED')
ON CONFLICT (slug) DO NOTHING;

-- Pricing Tiers
INSERT INTO pricing_tiers (name, tier, price, billing_period, benefits, is_popular, sort_order, is_active)
VALUES 
    ('Founding Member', 'FOUNDING', 35000, 'monthly', ARRAY['Lifetime priority booking (14-day window)', '25% discount on off-peak bookings (10 AM - 5 PM)', '10 guest passes per month', 'Access to exclusive Bridge Room', 'Permanent credit bonus (10%)', 'VIP parking & locker', 'Invitation to all exclusive events', 'Founding member recognition wall'], false, 1, true),
    ('Gold Membership', 'GOLD', 15000, 'monthly', ARRAY['7-day advance booking window', '20% discount on off-peak bookings (10 AM - 5 PM)', '4 guest passes per month', 'Priority event registration', '15% off coaching & clinics', 'Free equipment rental (2x/month)', 'Access to member lounge'], true, 2, true),
    ('Silver Membership', 'SILVER', 5000, 'monthly', ARRAY['5-day advance booking window', '10% discount on off-peak bookings (10 AM - 5 PM)', '2 guest passes per month', '10% off coaching & clinics', 'Member newsletter & updates', 'Discounted event entry'], false, 3, true),
    ('Pay-to-Play', 'GUEST', 0, 'per-use', ARRAY['2-day advance booking window', 'Access after member priority', 'Equipment rental available', 'Guest registration required', 'Can be upgraded to membership'], false, 4, true)
ON CONFLICT DO NOTHING;

-- Site Settings
INSERT INTO site_settings (setting_key, setting_value)
VALUES 
    ('contact_email', 'info@thequarterdeck.pk'),
    ('contact_phone', '+92 51 123 4567'),
    ('contact_address', 'Sector E-11, Islamabad, Pakistan'),
    ('facebook_url', 'https://facebook.com/thequarterdeckpk'),
    ('instagram_url', 'https://instagram.com/thequarterdeckpk'),
    ('whatsapp_phone', '923001234567'),
    ('whatsapp_button_visible', 'true'),
    ('whatsapp_button_text', 'Chat on WhatsApp'),
    ('whatsapp_default_message', 'Hello! I have a question about The Quarterdeck.'),
    ('operating_hours', '6:00 AM - 11:00 PM')
ON CONFLICT (setting_key) DO NOTHING;

-- Sample Announcements
INSERT INTO announcements (title, content, category, is_active)
VALUES 
    ('Welcome to The Quarterdeck', 'We are excited to announce our upcoming sports complex in Islamabad. Stay tuned for updates!', 'general', true),
    ('Founding Member Registration Open', 'Limited founding memberships are now available. Lock in exclusive benefits for life!', 'membership', true),
    ('Construction Progress Update', 'Phase 1 construction is on schedule. Padel courts will be ready by Q4 2026.', 'construction', true)
ON CONFLICT DO NOTHING;

-- Sample Rules
INSERT INTO rules (title, category, content, sort_order, is_active)
VALUES 
    ('Court Etiquette', 'general', 'Respect playing time and vacate courts promptly. Clean up after yourself. Return equipment to designated areas.', 1, true),
    ('Booking Policy', 'booking', 'Bookings must be made through the app or website. Cancellations require 24-hour notice. No-shows may result in temporary booking restrictions.', 2, true),
    ('Dress Code', 'general', 'Appropriate sports attire required. Non-marking indoor shoes mandatory on all courts. No outdoor shoes on playing surfaces.', 3, true),
    ('Guest Policy', 'membership', 'Members may bring guests subject to guest pass allowance. Guests must register at reception. Guest fees apply for non-members.', 4, true),
    ('Safety First', 'safety', 'Follow all safety signage and instructions. Report any equipment issues immediately. First aid available at reception.', 5, true),
    ('Air Rifle Range Rules', 'safety', 'Strict supervision required at all times. Safety goggles and ear protection mandatory. Follow range officer instructions.', 6, true)
ON CONFLICT DO NOTHING;

-- Construction Phases
INSERT INTO construction_phases (name, description, status, progress_percent, sort_order)
VALUES 
    ('Phase 1: Foundation & Structure', 'Site preparation, foundation laying, and main structure construction', 'IN_PROGRESS', 45, 1),
    ('Phase 2: Court Construction', 'Construction of Padel courts, Squash courts, and shooting range', 'NOT_STARTED', 0, 2),
    ('Phase 3: Interior Finishing', 'Interior design, lighting, air conditioning, and finishing touches', 'NOT_STARTED', 0, 3),
    ('Phase 4: Equipment & Testing', 'Installation of sports equipment, testing, and final preparations', 'NOT_STARTED', 0, 4)
ON CONFLICT DO NOTHING;

-- Sample Careers
INSERT INTO careers (title, department, location, type, description, requirements, salary, salary_hidden, is_active)
VALUES 
    ('Facility Manager', 'Operations', 'Islamabad', 'Full-time', 'Oversee daily operations of The Quarterdeck sports complex, ensuring world-class service delivery and facility maintenance.', 'Minimum 5 years experience in facility management|Strong leadership and team management skills|Experience in sports or hospitality industry preferred|Excellent communication skills', 'PKR 150,000 - 200,000/month', true, true),
    ('Padel Tennis Coach', 'Sports', 'Islamabad', 'Full-time', 'Lead padel tennis coaching programs for members of all skill levels, from beginners to advanced players.', 'Certified Padel coach with minimum 3 years experience|Experience coaching adults and juniors|Strong communication and motivational skills|Fluent in English and Urdu', 'PKR 80,000 - 120,000/month', true, true),
    ('Front Desk Executive', 'Customer Service', 'Islamabad', 'Full-time', 'First point of contact for members and guests. Manage bookings, handle inquiries, and ensure smooth facility access.', 'Excellent customer service skills|Computer proficient|Good communication in English and Urdu|Previous hospitality experience preferred', 'PKR 40,000 - 55,000/month', true, true)
ON CONFLICT DO NOTHING;

-- Operating Hours (generic hours for all days - 6 AM to 11 PM)
-- Days: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
INSERT INTO operating_hours (id, venue_id, facility_id, day_of_week, open_time, close_time, slot_duration_minutes, is_holiday, is_closed)
VALUES 
    ('oh-sun', NULL, NULL, 0, '06:00', '23:00', 60, false, false),
    ('oh-mon', NULL, NULL, 1, '06:00', '23:00', 60, false, false),
    ('oh-tue', NULL, NULL, 2, '06:00', '23:00', 60, false, false),
    ('oh-wed', NULL, NULL, 3, '06:00', '23:00', 60, false, false),
    ('oh-thu', NULL, NULL, 4, '06:00', '23:00', 60, false, false),
    ('oh-fri', NULL, NULL, 5, '06:00', '23:00', 60, false, false),
    ('oh-sat', NULL, NULL, 6, '06:00', '23:00', 60, false, false)
ON CONFLICT DO NOTHING;

-- Sample Events (use subquery to get facility_id from slug)
INSERT INTO events (id, facility_id, title, description, type, instructor, schedule_day, schedule_time, price, capacity, enrolled_count, image_url, slug, is_active)
SELECT 
    'event-1', 
    (SELECT id FROM facilities WHERE slug = 'padel-tennis' LIMIT 1),
    'Grand Opening Celebration',
    'Join us for the grand opening of The Quarterdeck! Special exhibitions, free trials, and refreshments.',
    'SOCIAL', NULL, 'Wednesday', '16:00', 0, 200, 0, '', 'grand-opening-celebration', true
WHERE EXISTS (SELECT 1 FROM facilities WHERE slug = 'padel-tennis')
ON CONFLICT DO NOTHING;

INSERT INTO events (id, facility_id, title, description, type, instructor, schedule_day, schedule_time, price, capacity, enrolled_count, image_url, slug, is_active)
SELECT 
    'event-2',
    (SELECT id FROM facilities WHERE slug = 'padel-tennis' LIMIT 1),
    'Padel Introductory Clinic',
    'Learn the basics of Padel Tennis from our professional coaches. Equipment provided.',
    'CLASS', 'Coach Ali', 'Saturday', '10:00', 2000, 16, 0, '', 'padel-introductory-clinic', true
WHERE EXISTS (SELECT 1 FROM facilities WHERE slug = 'padel-tennis')
ON CONFLICT DO NOTHING;

INSERT INTO events (id, facility_id, title, description, type, instructor, schedule_day, schedule_time, price, capacity, enrolled_count, image_url, slug, is_active)
SELECT 
    'event-3',
    (SELECT id FROM facilities WHERE slug = 'padel-tennis' LIMIT 1),
    'New Year Eve Party',
    'Ring in 2026 at The Quarterdeck with live music, food, and festivities!',
    'SOCIAL', NULL, 'Tuesday', '20:00', 5000, 150, 0, '', 'new-year-eve-party', true
WHERE EXISTS (SELECT 1 FROM facilities WHERE slug = 'padel-tennis')
ON CONFLICT DO NOTHING;

-- Create admin user (update password hash after deployment)
-- This creates an admin with a placeholder password - you MUST update this
INSERT INTO users (id, email, password_hash, first_name, last_name, role, email_verified)
VALUES 
    ('admin-user', 'admin@thequarterdeck.pk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.ttvC4V.yp5UVZS', 'Admin', 'User', 'SUPER_ADMIN', true)
ON CONFLICT DO NOTHING;

-- Note: The password hash above is for 'AdminQD2026!' - change immediately in production!
