-- The Quarterdeck - PostgreSQL Schema for Supabase
-- =================================================
-- Run this script to create all required tables

-- Create ENUMs
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_tier AS ENUM ('FOUNDING', 'GOLD', 'SILVER', 'GUEST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('PENDING_PAYMENT', 'PENDING_VERIFICATION', 'ACTIVE', 'EXPIRED', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payer_type AS ENUM ('SELF', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('ACADEMY', 'TOURNAMENT', 'CLASS', 'SOCIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE facility_status AS ENUM ('OPENING_SOON', 'PLANNED', 'ACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE venue_status AS ENUM ('ACTIVE', 'COMING_SOON', 'PLANNED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE construction_phase_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING_PAYMENT', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Sessions table (for express-session)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR UNIQUE,
    password_hash VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    phone VARCHAR,
    date_of_birth TIMESTAMP,
    role user_role DEFAULT 'USER' NOT NULL,
    is_safety_certified BOOLEAN DEFAULT false,
    has_signed_waiver BOOLEAN DEFAULT false,
    credit_balance INTEGER DEFAULT 0,
    total_hours_played INTEGER DEFAULT 0,
    stripe_customer_id VARCHAR,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR,
    email_verification_expires TIMESTAMP,
    password_reset_token VARCHAR,
    password_reset_expires TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    lockout_until TIMESTAMP,
    terms_accepted_at TIMESTAMP,
    last_authenticated_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Memberships table
CREATE TABLE IF NOT EXISTS memberships (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    membership_number VARCHAR UNIQUE NOT NULL,
    tier membership_tier DEFAULT 'GUEST' NOT NULL,
    valid_from TIMESTAMP DEFAULT NOW() NOT NULL,
    valid_to TIMESTAMP NOT NULL,
    status membership_status DEFAULT 'PENDING_PAYMENT' NOT NULL,
    guest_passes INTEGER DEFAULT 0,
    payment_reference VARCHAR,
    payment_proof_url VARCHAR,
    payment_verified_by VARCHAR,
    payment_verified_at TIMESTAMP,
    admin_notes TEXT,
    approved_by VARCHAR,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    stripe_subscription_id VARCHAR,
    stripe_price_id VARCHAR,
    auto_renew BOOLEAN DEFAULT false,
    renewal_reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL,
    city VARCHAR NOT NULL,
    address TEXT,
    phone VARCHAR,
    email VARCHAR,
    status venue_status DEFAULT 'PLANNED' NOT NULL,
    operating_hours_start VARCHAR,
    operating_hours_end VARCHAR,
    description TEXT,
    image_url VARCHAR,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    sort_order INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Facilities table
CREATE TABLE IF NOT EXISTS facilities (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slug VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    icon VARCHAR,
    category VARCHAR,
    base_price INTEGER DEFAULT 0 NOT NULL,
    min_players INTEGER DEFAULT 1,
    resource_count INTEGER DEFAULT 1,
    requires_certification BOOLEAN DEFAULT false,
    is_restricted BOOLEAN DEFAULT false,
    status facility_status DEFAULT 'PLANNED' NOT NULL,
    image_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Facility Add-Ons table
CREATE TABLE IF NOT EXISTS facility_add_ons (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    facility_id VARCHAR NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    label VARCHAR NOT NULL,
    price INTEGER DEFAULT 0 NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    facility_id VARCHAR NOT NULL REFERENCES facilities(id),
    venue VARCHAR DEFAULT 'Islamabad',
    resource_id INTEGER DEFAULT 1 NOT NULL,
    date VARCHAR NOT NULL,
    start_time VARCHAR NOT NULL,
    end_time VARCHAR NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status booking_status DEFAULT 'PENDING' NOT NULL,
    payment_method VARCHAR DEFAULT 'cash',
    payer_type payer_type DEFAULT 'SELF',
    payer_membership_number VARCHAR,
    base_price INTEGER DEFAULT 0 NOT NULL,
    discount INTEGER DEFAULT 0,
    add_on_total INTEGER DEFAULT 0,
    total_price INTEGER DEFAULT 0 NOT NULL,
    coach_booked BOOLEAN DEFAULT false,
    is_matchmaking BOOLEAN DEFAULT false,
    current_players INTEGER DEFAULT 1,
    max_players INTEGER DEFAULT 4,
    hall_activity VARCHAR,
    stripe_session_id VARCHAR,
    stripe_payment_intent_id VARCHAR,
    payment_status payment_status DEFAULT 'PENDING_PAYMENT',
    payment_proof_url VARCHAR,
    payment_verified_by VARCHAR,
    payment_verified_at TIMESTAMP,
    payment_notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Booking Add-Ons table
CREATE TABLE IF NOT EXISTS booking_add_ons (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    booking_id VARCHAR NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    add_on_id VARCHAR NOT NULL,
    label VARCHAR NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    price_per_unit INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    facility_id VARCHAR NOT NULL REFERENCES facilities(id),
    title VARCHAR NOT NULL,
    description TEXT,
    type event_type DEFAULT 'CLASS' NOT NULL,
    instructor VARCHAR,
    schedule_day VARCHAR,
    schedule_time VARCHAR,
    schedule_datetime TIMESTAMP,
    price INTEGER DEFAULT 0,
    capacity INTEGER DEFAULT 20,
    enrolled_count INTEGER DEFAULT 0,
    enrollment_deadline TIMESTAMP,
    image_url VARCHAR,
    slug VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Event Registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id VARCHAR NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'registered',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facility_id VARCHAR NOT NULL REFERENCES facilities(id),
    points INTEGER DEFAULT 0 NOT NULL,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CMS Content table
CREATE TABLE IF NOT EXISTS cms_content (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    page VARCHAR NOT NULL,
    section VARCHAR NOT NULL,
    content_key VARCHAR NOT NULL,
    content_value TEXT,
    content_type VARCHAR DEFAULT 'text',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(page, section, content_key)
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR DEFAULT 'general',
    published_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rules table
CREATE TABLE IF NOT EXISTS rules (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR NOT NULL,
    category VARCHAR DEFAULT 'general',
    content TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Gallery Images table
CREATE TABLE IF NOT EXISTS gallery_images (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR NOT NULL,
    description TEXT,
    image_url VARCHAR NOT NULL,
    category VARCHAR DEFAULT 'general',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Career Positions table
CREATE TABLE IF NOT EXISTS careers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR NOT NULL,
    department VARCHAR,
    location VARCHAR DEFAULT 'Islamabad',
    type VARCHAR DEFAULT 'Full-time',
    description TEXT,
    requirements TEXT,
    salary VARCHAR,
    salary_hidden BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Career Applications table
CREATE TABLE IF NOT EXISTS career_applications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    career_id VARCHAR NOT NULL REFERENCES careers(id),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    cv_url VARCHAR,
    linkedin_url VARCHAR,
    cover_letter TEXT,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Contact Submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    subject VARCHAR,
    message TEXT NOT NULL,
    status VARCHAR DEFAULT 'new',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Site Settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key VARCHAR UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR DEFAULT 'text',
    label VARCHAR,
    category VARCHAR DEFAULT 'general',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Site Images table
CREATE TABLE IF NOT EXISTS site_images (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    image_key VARCHAR UNIQUE NOT NULL,
    image_url VARCHAR NOT NULL,
    alt_text VARCHAR,
    caption TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Pricing Tiers table
CREATE TABLE IF NOT EXISTS pricing_tiers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR NOT NULL,
    tier membership_tier NOT NULL,
    price INTEGER DEFAULT 0 NOT NULL,
    billing_period VARCHAR DEFAULT 'monthly',
    benefits TEXT[],
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Construction Phases table
CREATE TABLE IF NOT EXISTS construction_phases (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR NOT NULL,
    description TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status construction_phase_status DEFAULT 'NOT_STARTED' NOT NULL,
    progress_percent INTEGER DEFAULT 0,
    milestone_text VARCHAR,
    image_url VARCHAR,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Construction Updates table
CREATE TABLE IF NOT EXISTS construction_updates (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    phase_id VARCHAR NOT NULL REFERENCES construction_phases(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    content TEXT,
    image_url VARCHAR,
    update_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Navbar Items table
CREATE TABLE IF NOT EXISTS navbar_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    label VARCHAR NOT NULL,
    href VARCHAR NOT NULL,
    icon VARCHAR,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    requires_auth BOOLEAN DEFAULT false,
    parent_id VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Operating Hours table
CREATE TABLE IF NOT EXISTS operating_hours (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    venue_id VARCHAR,
    facility_id VARCHAR REFERENCES facilities(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    open_time VARCHAR NOT NULL,
    close_time VARCHAR NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Peak Windows table
CREATE TABLE IF NOT EXISTS peak_windows (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    venue_id VARCHAR,
    facility_id VARCHAR REFERENCES facilities(id) ON DELETE CASCADE,
    day_of_week INTEGER,
    start_time VARCHAR NOT NULL,
    end_time VARCHAR NOT NULL,
    price_multiplier DECIMAL(3, 2) DEFAULT 1.00,
    label VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Hall Activities table
CREATE TABLE IF NOT EXISTS hall_activities (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    facility_id VARCHAR REFERENCES facilities(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    price_per_hour INTEGER DEFAULT 0 NOT NULL,
    min_hours INTEGER DEFAULT 1,
    description TEXT,
    capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    link VARCHAR,
    data JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Admin Audit Logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admin_id VARCHAR NOT NULL,
    admin_email VARCHAR,
    action VARCHAR NOT NULL,
    resource_type VARCHAR NOT NULL,
    resource_id VARCHAR,
    details JSONB,
    ip_address VARCHAR,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Membership Tier Definitions table
CREATE TABLE IF NOT EXISTS membership_tier_definitions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slug VARCHAR UNIQUE NOT NULL,
    display_name VARCHAR NOT NULL,
    description TEXT,
    color VARCHAR DEFAULT '#6B7280',
    discount_percent INTEGER DEFAULT 0,
    guest_passes_included INTEGER DEFAULT 0,
    benefits TEXT[],
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_facility_id ON bookings(facility_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_events_facility_id ON events(facility_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
