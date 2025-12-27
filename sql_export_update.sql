-- ============================================
-- The Quarterdeck - SQL Export Update
-- Generated: 2025-12-27
-- ============================================

-- =============================================
-- COMPARISON FEATURES (Membership tier comparison table)
-- =============================================
-- Only insert if table is empty
INSERT INTO comparison_features (id, feature, founding_value, gold_value, silver_value, guest_value, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'Advance Booking Window', '14 days', '7 days', '5 days', '2 days', 1, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM comparison_features LIMIT 1);

INSERT INTO comparison_features (id, feature, founding_value, gold_value, silver_value, guest_value, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'Off-Peak Discount (10 AM - 5 PM)', '25%', '20%', '10%', 'None', 2, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM comparison_features WHERE feature = 'Off-Peak Discount (10 AM - 5 PM)');

INSERT INTO comparison_features (id, feature, founding_value, gold_value, silver_value, guest_value, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'Guest Passes per Month', '10', '4', '2', 'N/A', 3, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM comparison_features WHERE feature = 'Guest Passes per Month');

INSERT INTO comparison_features (id, feature, founding_value, gold_value, silver_value, guest_value, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'Priority Event Registration', 'Yes', 'Yes', 'No', 'No', 4, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM comparison_features WHERE feature = 'Priority Event Registration');

INSERT INTO comparison_features (id, feature, founding_value, gold_value, silver_value, guest_value, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'Equipment Rental Discount', 'Free', '50%', '25%', 'Standard Rate', 5, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM comparison_features WHERE feature = 'Equipment Rental Discount');

INSERT INTO comparison_features (id, feature, founding_value, gold_value, silver_value, guest_value, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'Access to Bridge Room', 'Exclusive', 'Yes', 'Limited', 'No', 6, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM comparison_features WHERE feature = 'Access to Bridge Room');

INSERT INTO comparison_features (id, feature, founding_value, gold_value, silver_value, guest_value, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'Coaching & Clinic Discount', '25%', '15%', '10%', 'None', 7, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM comparison_features WHERE feature = 'Coaching & Clinic Discount');

INSERT INTO comparison_features (id, feature, founding_value, gold_value, silver_value, guest_value, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'Member Lounge Access', 'VIP', 'Yes', 'Yes', 'No', 8, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM comparison_features WHERE feature = 'Member Lounge Access');

INSERT INTO comparison_features (id, feature, founding_value, gold_value, silver_value, guest_value, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'Credit Bonus', '10%', '5%', 'None', 'None', 9, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM comparison_features WHERE feature = 'Credit Bonus');

INSERT INTO comparison_features (id, feature, founding_value, gold_value, silver_value, guest_value, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'Recognition Wall', 'Yes', 'No', 'No', 'No', 10, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM comparison_features WHERE feature = 'Recognition Wall');

-- =============================================
-- MEMBER BENEFITS (Why Become a Member section)
-- =============================================
INSERT INTO member_benefits (id, icon, title, description, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'clock', 'Priority Booking', 'Book courts up to 14 days in advance with priority access during peak hours', 1, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM member_benefits LIMIT 1);

INSERT INTO member_benefits (id, icon, title, description, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'percent', 'Exclusive Discounts', 'Save up to 25% on off-peak bookings and enjoy discounts on equipment and coaching', 2, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM member_benefits WHERE title = 'Exclusive Discounts');

INSERT INTO member_benefits (id, icon, title, description, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'users', 'Guest Privileges', 'Bring friends and family with complimentary guest passes included in your membership', 3, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM member_benefits WHERE title = 'Guest Privileges');

INSERT INTO member_benefits (id, icon, title, description, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'calendar', 'Event Access', 'Priority registration for tournaments, social events, and exclusive member gatherings', 4, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM member_benefits WHERE title = 'Event Access');

INSERT INTO member_benefits (id, icon, title, description, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'gift', 'Member Perks', 'Enjoy complimentary equipment rental, member lounge access, and special promotions', 5, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM member_benefits WHERE title = 'Member Perks');

INSERT INTO member_benefits (id, icon, title, description, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'trophy', 'Recognition', 'Founding members receive permanent recognition on our member wall and exclusive benefits', 6, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM member_benefits WHERE title = 'Recognition');

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these to verify the data was inserted correctly:
-- SELECT COUNT(*) as comparison_features_count FROM comparison_features;
-- SELECT COUNT(*) as member_benefits_count FROM member_benefits;
-- SELECT * FROM comparison_features ORDER BY sort_order;
-- SELECT * FROM member_benefits ORDER BY sort_order;

