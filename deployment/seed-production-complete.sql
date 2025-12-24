-- Complete Production Seed Script for The Quarterdeck
-- Run this on your Supabase production database

-- ==============================================
-- SEED ALL RULES (31 total)
-- ==============================================
DELETE FROM rules;

INSERT INTO rules (id, title, category, content, sort_order, is_active) VALUES
-- General Rules
(gen_random_uuid()::text, 'Court Etiquette', 'general', 'Respect playing time and vacate courts promptly. Clean up after yourself. Return equipment to designated areas.', 1, true),
(gen_random_uuid()::text, 'Check-in Required', 'general', 'All members and guests must check in at reception upon arrival. Valid membership cards must be presented when requested by staff.', 2, true),
(gen_random_uuid()::text, 'Children Policy', 'general', 'Children under 16 must be accompanied by a member at all times. Photography and video recording require prior management approval.', 3, true),
(gen_random_uuid()::text, 'Dress Code', 'general', 'Appropriate sports attire required. Non-marking indoor shoes mandatory on all courts. No outdoor shoes on playing surfaces.', 4, true),
(gen_random_uuid()::text, 'Lost and Found', 'general', 'Lost and found items should be reported to reception immediately. Management reserves the right to refuse entry or ask anyone to leave.', 5, true),

-- Booking Rules
(gen_random_uuid()::text, 'Booking Policy', 'booking', 'Bookings must be made through the app or website. Cancellations require 24-hour notice. No-shows may result in temporary booking restrictions.', 10, true),
(gen_random_uuid()::text, 'Booking System', 'booking', 'Bookings must be made through the official booking system or app. Maximum booking window: 14 days for Founding members, 7 days for Gold, 5 days for Silver, 2 days for guests.', 11, true),
(gen_random_uuid()::text, 'Cancellation Policy', 'booking', 'Cancellations must be made at least 24 hours before the scheduled time. No-shows will result in forfeiture of booking credits and potential penalties.', 12, true),
(gen_random_uuid()::text, 'Late Arrival', 'booking', 'Late arrivals have a 15-minute grace period, after which the booking may be released. Back-to-back bookings by the same member require a 30-minute gap.', 13, true),

-- Conduct Rules
(gen_random_uuid()::text, 'Respectful Behavior', 'conduct', 'Respectful behavior towards all staff, members, and guests is mandatory. Harassment, discrimination, or intimidation of any kind is prohibited.', 20, true),
(gen_random_uuid()::text, 'Noise and Disruption', 'conduct', 'Excessive noise, profanity, and disruptive behavior are not permitted. Mobile phones must be on silent in all playing areas.', 21, true),
(gen_random_uuid()::text, 'Gambling Prohibited', 'conduct', 'Gambling or betting on premises is strictly prohibited. Any disputes should be reported to management for resolution.', 22, true),

-- Safety Rules
(gen_random_uuid()::text, 'Safety First', 'safety', 'Follow all safety signage and instructions. Report any equipment issues immediately. First aid available at reception.', 30, true),
(gen_random_uuid()::text, 'Air Rifle Range Rules', 'safety', 'Strict supervision required at all times. Safety goggles and ear protection mandatory. Follow range officer instructions.', 31, true),
(gen_random_uuid()::text, 'Safety Orientation', 'safety', 'All members must complete facility-specific safety orientations. Air Rifle Range requires mandatory safety certification before use.', 32, true),
(gen_random_uuid()::text, 'Protective Equipment', 'safety', 'Protective equipment must be worn as required for each facility. Report any injuries, accidents, or safety hazards immediately.', 33, true),
(gen_random_uuid()::text, 'Emergency Exits', 'safety', 'Emergency exits must be kept clear at all times. Fire alarms and safety equipment are for emergencies only.', 34, true),

-- Dress Code Rules
(gen_random_uuid()::text, 'Athletic Attire', 'dresscode', 'Appropriate athletic attire required for all sports facilities. Non-marking indoor shoes mandatory for Padel and Squash courts.', 40, true),
(gen_random_uuid()::text, 'Footwear Requirements', 'dresscode', 'Proper enclosed footwear required in Air Rifle Range. Smart casual dress code in Bridge Room and common areas.', 41, true),
(gen_random_uuid()::text, 'Inappropriate Clothing', 'dresscode', 'Offensive or inappropriate clothing will not be permitted on premises.', 42, true),

-- Equipment Rules
(gen_random_uuid()::text, 'Equipment Care', 'equipment', 'Handle all equipment with care; damage may result in charges. Return rented equipment in the same condition as received.', 50, true),
(gen_random_uuid()::text, 'Personal Equipment', 'equipment', 'Personal equipment must meet safety standards and be approved. Do not leave personal belongings unattended in facility areas.', 51, true),
(gen_random_uuid()::text, 'Equipment Malfunctions', 'equipment', 'Report any equipment malfunctions to staff immediately. Outside food and beverages not permitted in playing areas.', 52, true),

-- Guest Rules
(gen_random_uuid()::text, 'Guest Policy', 'membership', 'Members may bring guests subject to guest pass allowance. Guests must register at reception. Guest fees apply for non-members.', 60, true),
(gen_random_uuid()::text, 'Guest Passes', 'guests', 'Guest passes subject to availability based on membership tier. Members are responsible for their guests'' conduct at all times.', 61, true),
(gen_random_uuid()::text, 'Guest Registration', 'guests', 'Guests must complete registration and sign waivers before facility use. Same guest may visit maximum 3 times before membership required.', 62, true),
(gen_random_uuid()::text, 'Guest Fees', 'guests', 'Guest fees apply as per current pricing schedule. Corporate members have separate guest allocation policies.', 63, true),

-- Emergency Rules
(gen_random_uuid()::text, 'Fire Evacuation', 'emergency', 'In case of fire, evacuate via nearest exit and assemble at designated point. Do not re-enter building until all-clear is given by staff.', 70, true),
(gen_random_uuid()::text, 'Medical Emergencies', 'emergency', 'Medical emergencies: Contact reception or any staff member immediately. First aid kits available at reception and all facility areas.', 71, true),
(gen_random_uuid()::text, 'Emergency Contacts', 'emergency', 'Emergency contact numbers posted at all facility entrances. AED (Automated External Defibrillator) located at main reception.', 72, true);

-- ==============================================
-- SEED ALL CAREERS (5 total)
-- ==============================================
DELETE FROM careers;

INSERT INTO careers (id, title, department, location, type, description, requirements, salary_hidden, is_active) VALUES
(gen_random_uuid()::text, 'Facility Manager', 'Operations', 'Islamabad', 'Full-time', 'Oversee daily operations of The Quarterdeck sports complex, ensuring world-class service delivery and facility maintenance.', 'Minimum 5 years experience in facility management|Strong leadership and team management skills|Experience in sports or hospitality industry preferred|Excellent communication skills', true, true),
(gen_random_uuid()::text, 'Padel Tennis Coach', 'Sports', 'Islamabad', 'Full-time', 'Lead padel tennis coaching programs for members of all skill levels, from beginners to advanced players.', 'Certified Padel coach with minimum 3 years experience|Experience coaching adults and juniors|Strong communication and motivational skills|Fluent in English and Urdu', true, true),
(gen_random_uuid()::text, 'Squash Coach', 'Sports', 'Islamabad', 'Full-time', 'Develop and deliver squash coaching programs, organize tournaments, and help build our squash community.', 'PSA certified or equivalent|Minimum 3 years coaching experience|Tournament organization experience|Player development track record', true, true),
(gen_random_uuid()::text, 'Front Desk Executive', 'Customer Service', 'Islamabad', 'Full-time', 'First point of contact for members and guests. Manage bookings, handle inquiries, and ensure smooth facility access.', 'Excellent customer service skills|Computer proficient|Good communication in English and Urdu|Previous hospitality experience preferred', true, true),
(gen_random_uuid()::text, 'Marketing Executive', 'Marketing', 'Islamabad', 'Full-time', 'Drive brand awareness and member acquisition through digital marketing, events, and community engagement.', 'Degree in Marketing or related field|2+ years digital marketing experience|Social media management skills|Creative mindset', true, true);

-- ==============================================
-- FIX CMS CONTENT (Terms & Privacy)
-- Production uses: page, section, content_key, content_value structure
-- ==============================================

-- Fix HTML entities in existing content
UPDATE cms_content 
SET content_value = REPLACE(content_value, '&amp;', '&')
WHERE content_key IN ('terms_conditions', 'privacy_policy', 'terms', 'privacy');

-- Insert/Update Terms & Conditions if using page/section/content_key structure
INSERT INTO cms_content (id, page, section, content_key, content_value, content_type) 
VALUES (
  gen_random_uuid()::text, 
  'legal', 
  'terms', 
  'terms_conditions', 
  '[
    {"section": "1. Acceptance of Terms", "content": "By accessing and using The Quarterdeck facilities and services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our facilities or services.", "items": []},
    {"section": "2. Membership", "content": "Membership at The Quarterdeck is subject to approval and payment of applicable fees. Members must provide accurate personal information and maintain current contact details.", "items": ["Membership is non-transferable unless explicitly approved by management", "Members must present valid identification when requested", "Annual membership fees are non-refundable after the 30-day cooling-off period", "Guest privileges are subject to availability and member tier"]},
    {"section": "3. Facility Usage", "content": "All members and guests must adhere to facility rules and regulations:", "items": ["Proper athletic attire and footwear required for all sports facilities", "Bookings must be made in advance through the official booking system", "Cancellations must be made at least 24 hours before the scheduled time", "No-shows may result in forfeiture of booking credits", "Equipment must be used responsibly and returned in good condition"]},
    {"section": "4. Safety & Liability", "content": "Members participate in activities at their own risk. The Quarterdeck provides safety equipment and guidelines, but members are responsible for:", "items": ["Completing required safety certifications before using specialized equipment", "Following all safety instructions provided by staff", "Reporting any injuries or safety concerns immediately", "Ensuring guests understand and follow all safety protocols"]},
    {"section": "5. Code of Conduct", "content": "Members and guests are expected to conduct themselves professionally and respectfully:", "items": ["Treat all staff, members, and guests with respect", "Maintain appropriate noise levels in all areas", "No smoking, alcohol, or prohibited substances on premises", "Harassment of any kind will result in immediate membership termination"]},
    {"section": "6. Payment Terms", "content": "All fees and charges are due as specified at the time of booking or membership renewal. Late payments may result in suspension of booking privileges. Disputed charges must be reported within 30 days of the transaction date.", "items": []},
    {"section": "7. Modifications", "content": "The Quarterdeck reserves the right to modify these terms at any time. Members will be notified of significant changes via email or through the member portal. Continued use of facilities after changes constitutes acceptance of modified terms.", "items": []},
    {"section": "8. Contact", "content": "For questions about these Terms & Conditions, please contact us at legal@thequarterdeck.pk", "items": []}
  ]',
  'json'
)
ON CONFLICT (page, section, content_key) DO UPDATE 
SET content_value = EXCLUDED.content_value, updated_at = NOW();

INSERT INTO cms_content (id, page, section, content_key, content_value, content_type) 
VALUES (
  gen_random_uuid()::text, 
  'legal', 
  'privacy', 
  'privacy_policy', 
  '[
    {"section": "1. Information We Collect", "content": "The Quarterdeck collects information to provide and improve our services:", "items": ["Personal Information: Name, email, phone number, address, date of birth", "Membership Data: Membership tier, payment history, booking records", "Usage Information: Facility usage patterns, preferences, feedback", "Technical Data: Device information, IP address, browser type when using our website"]},
    {"section": "2. How We Use Your Information", "content": "Your information is used to:", "items": ["Process membership applications and renewals", "Manage facility bookings and reservations", "Communicate important updates and announcements", "Improve our facilities and services based on usage patterns", "Ensure safety and security of all members and guests", "Process payments and maintain financial records"]},
    {"section": "3. Information Sharing", "content": "We do not sell your personal information. We may share information with:", "items": ["Service Providers: Payment processors, IT support, communication platforms", "Legal Requirements: When required by law or to protect our rights", "Emergency Services: In case of safety emergencies", "With Consent: When you explicitly authorize sharing"]},
    {"section": "4. Data Security", "content": "We implement industry-standard security measures to protect your information, including encrypted data transmission, secure storage, access controls, and regular security audits. However, no system is completely secure, and we cannot guarantee absolute security.", "items": []},
    {"section": "5. Your Rights", "content": "You have the right to:", "items": ["Access your personal information", "Correct inaccurate information", "Request deletion of your data (subject to legal requirements)", "Opt out of marketing communications", "Export your data in a portable format"]},
    {"section": "6. Cookies & Tracking", "content": "Our website uses cookies to enhance your experience, remember preferences, and analyze usage patterns. You can control cookie settings through your browser preferences. Essential cookies are required for the website to function properly.", "items": []},
    {"section": "7. Data Retention", "content": "We retain your information for as long as necessary to provide our services and comply with legal obligations. Booking records are kept for 7 years for accounting purposes. You may request deletion of non-essential data at any time.", "items": []},
    {"section": "8. Updates to This Policy", "content": "We may update this Privacy Policy periodically. Significant changes will be communicated via email or through our member portal. The date of the last update is shown at the top of this page.", "items": []},
    {"section": "9. Contact Us", "content": "For privacy-related inquiries or to exercise your rights, contact our Data Protection Officer at privacy@thequarterdeck.pk", "items": []}
  ]',
  'json'
)
ON CONFLICT (page, section, content_key) DO UPDATE 
SET content_value = EXCLUDED.content_value, updated_at = NOW();

-- ==============================================
-- VERIFY COUNTS
-- ==============================================
SELECT 'Rules' as data_type, COUNT(*) as count FROM rules WHERE is_active = true
UNION ALL
SELECT 'Careers' as data_type, COUNT(*) as count FROM careers WHERE is_active = true
UNION ALL
SELECT 'CMS Content' as data_type, COUNT(*) as count FROM cms_content;
