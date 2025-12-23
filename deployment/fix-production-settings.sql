-- Fix Production Settings for The Quarterdeck
-- Run this in Supabase SQL Editor

-- 1. Add WhatsApp Button Settings
INSERT INTO site_settings (key, value) VALUES 
  ('whatsapp_button_visible', 'true'),
  ('whatsapp_phone', '+923001234567'),
  ('whatsapp_default_message', 'Hello! I am interested in The Quarterdeck facilities.'),
  ('whatsapp_button_text', 'Chat with us')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Check if admin user exists
-- SELECT * FROM users WHERE role = 'ADMIN' OR role = 'SUPER_ADMIN';

-- 3. Create admin user (update email/password as needed)
-- Note: Password should be hashed. Use bcrypt hash for 'admin123':
-- $2b$10$K9c7.MaZt.iQf.7L.6h6/.uY8BKqO7LBzGZqPjWuJJ7U5e8KQEwG2
INSERT INTO users (
  id, 
  email, 
  password,
  first_name, 
  last_name, 
  role,
  email_verified
) VALUES (
  gen_random_uuid()::text,
  'admin@quarterdeck.pk',
  '$2b$10$K9c7.MaZt.iQf.7L.6h6/.uY8BKqO7LBzGZqPjWuJJ7U5e8KQEwG2',
  'Admin',
  'User',
  'SUPER_ADMIN',
  true
) ON CONFLICT (email) DO UPDATE SET 
  role = 'SUPER_ADMIN',
  password = '$2b$10$K9c7.MaZt.iQf.7L.6h6/.uY8BKqO7LBzGZqPjWuJJ7U5e8KQEwG2';

-- Verify WhatsApp settings
SELECT * FROM site_settings WHERE key LIKE 'whatsapp%';

-- Verify admin user
SELECT id, email, first_name, last_name, role FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN');
