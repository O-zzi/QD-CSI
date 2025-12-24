-- Fix CMS Content Table Structure for The Quarterdeck
-- The code expects: key, title, content, metadata, sort_order, is_active
-- But production has: page, section, content_key, content_value, content_type

-- Step 1: Add missing columns if they don't exist
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS key VARCHAR UNIQUE;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS title VARCHAR;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: Migrate any existing data from old columns to new columns
UPDATE cms_content 
SET key = content_key, 
    content = content_value 
WHERE key IS NULL AND content_key IS NOT NULL;

-- Step 3: Insert Terms & Conditions
INSERT INTO cms_content (id, key, title, content, is_active, sort_order) 
VALUES (
  gen_random_uuid()::text, 
  'terms_conditions', 
  'Terms & Conditions',
  '[
    {"section": "1. Acceptance of Terms", "content": "By accessing and using The Quarterdeck facilities and services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our facilities or services.", "items": []},
    {"section": "2. Membership", "content": "Membership at The Quarterdeck is subject to approval and payment of applicable fees. Members must provide accurate personal information and maintain current contact details.", "items": ["Membership is non-transferable unless explicitly approved by management", "Members must present valid identification when requested", "Annual membership fees are non-refundable after the 30-day cooling-off period", "Guest privileges are subject to availability and member tier"]},
    {"section": "3. Facility Usage", "content": "All members and guests must adhere to facility rules and regulations:", "items": ["Proper athletic attire and footwear required for all sports facilities", "Bookings must be made in advance through the official booking system", "Cancellations must be made at least 24 hours before the scheduled time", "No-shows may result in forfeiture of booking credits", "Equipment must be used responsibly and returned in good condition"]},
    {"section": "4. Safety & Liability", "content": "Members participate in activities at their own risk. The Quarterdeck provides safety equipment and guidelines, but members are responsible for:", "items": ["Completing required safety certifications before using specialized equipment", "Following all safety instructions provided by staff", "Reporting any injuries or safety concerns immediately", "Ensuring guests understand and follow all safety protocols"]},
    {"section": "5. Code of Conduct", "content": "Members and guests are expected to conduct themselves professionally and respectfully:", "items": ["Treat all staff, members, and guests with respect", "Maintain appropriate noise levels in all areas", "No smoking, alcohol, or prohibited substances on premises", "Harassment of any kind will result in immediate membership termination"]},
    {"section": "6. Payment Terms", "content": "All fees and charges are due as specified at the time of booking or membership renewal. Late payments may result in suspension of booking privileges. Disputed charges must be reported within 30 days of the transaction date.", "items": []},
    {"section": "7. Modifications", "content": "The Quarterdeck reserves the right to modify these terms at any time. Members will be notified of significant changes via email or through the member portal. Continued use of facilities after changes constitutes acceptance of modified terms.", "items": []},
    {"section": "8. Contact", "content": "For questions about these Terms and Conditions, please contact us at legal@thequarterdeck.pk", "items": []}
  ]',
  true,
  1
)
ON CONFLICT (key) DO UPDATE 
SET content = EXCLUDED.content, 
    title = EXCLUDED.title,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Step 4: Insert Privacy Policy
INSERT INTO cms_content (id, key, title, content, is_active, sort_order) 
VALUES (
  gen_random_uuid()::text, 
  'privacy_policy', 
  'Privacy Policy',
  '[
    {"section": "1. Information We Collect", "content": "The Quarterdeck collects information to provide and improve our services:", "items": ["Personal Information: Name, email, phone number, address, date of birth", "Membership Data: Membership tier, payment history, booking records", "Usage Information: Facility usage patterns, preferences, feedback", "Technical Data: Device information, IP address, browser type when using our website"]},
    {"section": "2. How We Use Your Information", "content": "Your information is used to:", "items": ["Process membership applications and renewals", "Manage facility bookings and reservations", "Communicate important updates and announcements", "Improve our facilities and services based on usage patterns", "Ensure safety and security of all members and guests", "Process payments and maintain financial records"]},
    {"section": "3. Information Sharing", "content": "We do not sell your personal information. We may share information with:", "items": ["Service Providers: Payment processors, IT support, communication platforms", "Legal Requirements: When required by law or to protect our rights", "Emergency Services: In case of safety emergencies", "With Consent: When you explicitly authorize sharing"]},
    {"section": "4. Data Security", "content": "We implement industry-standard security measures to protect your information, including encrypted data transmission, secure storage, access controls, and regular security audits. However, no system is completely secure, and we cannot guarantee absolute security.", "items": []},
    {"section": "5. Your Rights", "content": "You have the right to:", "items": ["Access your personal information", "Correct inaccurate information", "Request deletion of your data (subject to legal requirements)", "Opt out of marketing communications", "Export your data in a portable format"]},
    {"section": "6. Cookies and Tracking", "content": "Our website uses cookies to enhance your experience, remember preferences, and analyze usage patterns. You can control cookie settings through your browser preferences. Essential cookies are required for the website to function properly.", "items": []},
    {"section": "7. Data Retention", "content": "We retain your information for as long as necessary to provide our services and comply with legal obligations. Booking records are kept for 7 years for accounting purposes. You may request deletion of non-essential data at any time.", "items": []},
    {"section": "8. Updates to This Policy", "content": "We may update this Privacy Policy periodically. Significant changes will be communicated via email or through our member portal. The date of the last update is shown at the top of this page.", "items": []},
    {"section": "9. Contact Us", "content": "For privacy-related inquiries or to exercise your rights, contact our Data Protection Officer at privacy@thequarterdeck.pk", "items": []}
  ]',
  true,
  2
)
ON CONFLICT (key) DO UPDATE 
SET content = EXCLUDED.content, 
    title = EXCLUDED.title,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Step 5: Verify the data
SELECT key, title, LEFT(content, 50) as content_preview, is_active 
FROM cms_content 
WHERE key IN ('terms_conditions', 'privacy_policy');
