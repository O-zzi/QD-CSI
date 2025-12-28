-- Safe Production Migration Script
-- This script ONLY adds new tables and columns - NO deletions
-- Run this through Hostinger's PostgreSQL database manager (phpPgAdmin or hPanel)

-- =====================================================
-- NEW TABLES
-- =====================================================

-- CMS Fields table
CREATE TABLE IF NOT EXISTS cms_fields (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id VARCHAR,
    field_key VARCHAR NOT NULL,
    field_type VARCHAR DEFAULT 'text',
    label VARCHAR,
    value TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CMS Pages table
CREATE TABLE IF NOT EXISTS cms_pages (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR UNIQUE NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Facility Venues table (links facilities to venues)
CREATE TABLE IF NOT EXISTS facility_venues (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id VARCHAR NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    venue_id VARCHAR NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'ACTIVE',
    resource_count INTEGER DEFAULT 1,
    price_override INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Time Slot Blocks table
CREATE TABLE IF NOT EXISTS time_slot_blocks (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id VARCHAR REFERENCES facilities(id) ON DELETE CASCADE,
    venue_id VARCHAR REFERENCES venues(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time VARCHAR NOT NULL,
    end_time VARCHAR NOT NULL,
    reason VARCHAR,
    created_by VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- NEW COLUMNS ON EXISTING TABLES
-- =====================================================

-- Venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS country VARCHAR;

-- Facility Add-ons table
ALTER TABLE facility_add_ons ADD COLUMN IF NOT EXISTS icon VARCHAR;

-- Leaderboard table
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS ranking_points INTEGER DEFAULT 0;

-- Peak Windows table
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS is_peak BOOLEAN DEFAULT true;
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS discount_disabled BOOLEAN DEFAULT false;
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS founding_discount INTEGER DEFAULT 0;
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS gold_discount INTEGER DEFAULT 0;
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS silver_discount INTEGER DEFAULT 0;
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS guest_discount INTEGER DEFAULT 0;
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS founding_booking_window INTEGER DEFAULT 14;
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS gold_booking_window INTEGER DEFAULT 7;
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS silver_booking_window INTEGER DEFAULT 3;
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS guest_booking_window INTEGER DEFAULT 1;
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS season_start DATE;
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS season_end DATE;
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE peak_windows ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Hall Activities table
ALTER TABLE hall_activities ADD COLUMN IF NOT EXISTS slug VARCHAR;
ALTER TABLE hall_activities ADD COLUMN IF NOT EXISTS icon VARCHAR;
ALTER TABLE hall_activities ADD COLUMN IF NOT EXISTS base_price INTEGER DEFAULT 0;
ALTER TABLE hall_activities ADD COLUMN IF NOT EXISTS max_hours INTEGER;
ALTER TABLE hall_activities ADD COLUMN IF NOT EXISTS max_capacity INTEGER;
ALTER TABLE hall_activities ADD COLUMN IF NOT EXISTS min_capacity INTEGER;
ALTER TABLE hall_activities ADD COLUMN IF NOT EXISTS resources_required INTEGER DEFAULT 1;
ALTER TABLE hall_activities ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;
ALTER TABLE hall_activities ADD COLUMN IF NOT EXISTS requires_deposit BOOLEAN DEFAULT false;
ALTER TABLE hall_activities ADD COLUMN IF NOT EXISTS deposit_amount INTEGER;

-- Admin Audit Logs table
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS resource VARCHAR;

-- Memberships table
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS payment_rejected_reason TEXT;

-- =====================================================
-- DONE!
-- =====================================================
-- After running this, your addons should work properly.
-- Go to your admin panel and add the facility add-ons.
