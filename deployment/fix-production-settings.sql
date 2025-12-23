-- Fix Production Settings for The Quarterdeck
-- Run this in Supabase SQL Editor

-- 1. Fix site_settings table schema (column rename to match code)
ALTER TABLE site_settings RENAME COLUMN setting_key TO key;
ALTER TABLE site_settings RENAME COLUMN setting_value TO value;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'text';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS label VARCHAR;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'general';

-- 2. Add WhatsApp Button Settings (update phone number!)
INSERT INTO site_settings (key, value, category) VALUES 
  ('whatsapp_button_visible', 'true', 'whatsapp'),
  ('whatsapp_phone', '+923001234567', 'whatsapp'),
  ('whatsapp_default_message', 'Hello! I am interested in The Quarterdeck facilities.', 'whatsapp'),
  ('whatsapp_button_text', 'Chat with us', 'whatsapp')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Create admin user (password is 'admin123' - CHANGE THIS AFTER FIRST LOGIN!)
-- The hash is for password: admin123
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

-- 4. Verify WhatsApp settings
SELECT * FROM site_settings WHERE key LIKE 'whatsapp%';

-- 5. Verify admin user
SELECT id, email, first_name, last_name, role FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN');
