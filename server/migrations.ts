import { pool } from "./db";
import logger from "./logger";
import { seedVenuesAndAddons } from "./seeds/seedVenuesAndAddons";
import { seedCmsPhase2 } from "./seeds/seedCmsPhase2";

export async function runStartupMigrations() {
  logger.info("Running startup migrations...", { source: "migrations" });
  
  try {
    // Add EDITOR to user_role enum if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e 
          JOIN pg_type t ON e.enumtypid = t.oid 
          WHERE t.typname = 'user_role' AND e.enumlabel = 'EDITOR'
        ) THEN
          ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'EDITOR' BEFORE 'ADMIN';
        END IF;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    logger.info("user_role enum EDITOR value verified", { source: "migrations" });

    // Create membership_tier_definitions table if not exists
    await pool.query(`
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
      )
    `);
    logger.info("membership_tier_definitions table created/verified", { source: "migrations" });

    // Create blogs table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        slug VARCHAR UNIQUE NOT NULL,
        title VARCHAR NOT NULL,
        excerpt TEXT,
        content TEXT,
        featured_image_url VARCHAR,
        author VARCHAR,
        category VARCHAR,
        tags TEXT[],
        read_time_minutes INTEGER DEFAULT 5,
        published_at TIMESTAMP,
        is_published BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("blogs table created/verified", { source: "migrations" });

    // Create hero_sections table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hero_sections (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        page VARCHAR UNIQUE NOT NULL,
        title VARCHAR NOT NULL,
        subtitle TEXT,
        description TEXT,
        background_image_url VARCHAR,
        background_video_url VARCHAR,
        overlay_opacity INTEGER DEFAULT 50,
        cta_text VARCHAR,
        cta_link VARCHAR,
        cta_secondary_text VARCHAR,
        cta_secondary_link VARCHAR,
        alignment VARCHAR DEFAULT 'center',
        height VARCHAR DEFAULT 'large',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("hero_sections table created/verified", { source: "migrations" });

    // Create ctas table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ctas (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        key VARCHAR UNIQUE NOT NULL,
        title VARCHAR NOT NULL,
        subtitle TEXT,
        description TEXT,
        button_text VARCHAR,
        button_link VARCHAR,
        secondary_button_text VARCHAR,
        secondary_button_link VARCHAR,
        background_image_url VARCHAR,
        background_color VARCHAR,
        style VARCHAR DEFAULT 'default',
        page VARCHAR,
        section VARCHAR,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("ctas table created/verified", { source: "migrations" });

    // Create testimonials table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name VARCHAR NOT NULL,
        title VARCHAR,
        company VARCHAR,
        avatar_url VARCHAR,
        quote TEXT NOT NULL,
        rating INTEGER DEFAULT 5,
        facility_id VARCHAR REFERENCES facilities(id) ON DELETE SET NULL,
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("testimonials table created/verified", { source: "migrations" });

    // Create event_galleries table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_galleries (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        event_id VARCHAR NOT NULL,
        image_url VARCHAR NOT NULL,
        caption VARCHAR,
        alt_text VARCHAR,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("event_galleries table created/verified", { source: "migrations" });

    // Create event_registrations table if not exists (fixes 500 error on event registration)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        event_id VARCHAR NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        phone VARCHAR,
        guest_count INTEGER DEFAULT 0,
        notes TEXT,
        status VARCHAR DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id)`).catch(() => {});
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id)`).catch(() => {});
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON event_registrations(email)`).catch(() => {});
    logger.info("event_registrations table created/verified", { source: "migrations" });

    // Add payment fields to event_registrations for paid events
    await pool.query(`
      ALTER TABLE event_registrations 
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR DEFAULT 'NOT_REQUIRED',
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR,
      ADD COLUMN IF NOT EXISTS payment_amount INTEGER,
      ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
      ADD COLUMN IF NOT EXISTS payment_notes TEXT,
      ADD COLUMN IF NOT EXISTS payment_verified_by VARCHAR,
      ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP
    `).catch(() => {});
    logger.info("event_registrations payment columns verified", { source: "migrations" });

    // Add receipt columns to bookings for auto-generated receipts
    await pool.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS receipt_number VARCHAR,
      ADD COLUMN IF NOT EXISTS receipt_generated_at TIMESTAMP
    `).catch(() => {});
    logger.info("bookings receipt columns verified", { source: "migrations" });

    // Create career_applications table if not exists (fixes 500 error on career applications)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS career_applications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        career_id VARCHAR REFERENCES careers(id),
        name VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        phone VARCHAR NOT NULL,
        cv_url VARCHAR,
        linkedin_url VARCHAR,
        cover_letter TEXT,
        status VARCHAR DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_career_applications_career_id ON career_applications(career_id)`).catch(() => {});
    logger.info("career_applications table created/verified", { source: "migrations" });

    // Add metadata column to notifications if not exists
    await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS metadata JSONB
    `).catch(() => {
      // Column might already exist or table structure differs
    });

    // Add is_hidden column to facilities if not exists
    await pool.query(`
      ALTER TABLE facilities 
      ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false
    `).catch(() => {
      // Column might already exist
    });
    logger.info("facilities.is_hidden column verified", { source: "migrations" });
    
    // Add extended CMS fields to facilities table
    await pool.query(`
      ALTER TABLE facilities 
      ADD COLUMN IF NOT EXISTS about_content TEXT,
      ADD COLUMN IF NOT EXISTS features TEXT[],
      ADD COLUMN IF NOT EXISTS amenities TEXT[],
      ADD COLUMN IF NOT EXISTS keywords TEXT[],
      ADD COLUMN IF NOT EXISTS quick_info JSONB,
      ADD COLUMN IF NOT EXISTS pricing_notes TEXT,
      ADD COLUMN IF NOT EXISTS certification_info JSONB,
      ADD COLUMN IF NOT EXISTS gallery_images TEXT[]
    `).catch(() => {});
    logger.info("facilities extended CMS columns verified", { source: "migrations" });
    
    // Add educational content columns to facilities table
    await pool.query(`
      ALTER TABLE facilities 
      ADD COLUMN IF NOT EXISTS how_to_play_content TEXT,
      ADD COLUMN IF NOT EXISTS scoring_rules_content TEXT,
      ADD COLUMN IF NOT EXISTS winning_criteria_content TEXT,
      ADD COLUMN IF NOT EXISTS points_system_content TEXT
    `).catch(() => {});
    logger.info("facilities educational content columns verified", { source: "migrations" });
    
    // Add extended CMS fields to pricing_tiers table
    await pool.query(`
      ALTER TABLE pricing_tiers 
      ADD COLUMN IF NOT EXISTS tagline VARCHAR,
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false
    `).catch(() => {});
    logger.info("pricing_tiers extended CMS columns verified", { source: "migrations" });
    
    // Add booking privilege columns to pricing_tiers table
    await pool.query(`
      ALTER TABLE pricing_tiers 
      ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS advance_booking_days INTEGER DEFAULT 2,
      ADD COLUMN IF NOT EXISTS guest_passes_included INTEGER DEFAULT 0
    `).catch(() => {});
    logger.info("pricing_tiers booking privilege columns verified", { source: "migrations" });
    
    // Seed booking privilege values if not already set (update only if value is 0/2 default)
    await pool.query(`
      UPDATE pricing_tiers SET 
        discount_percent = 25,
        advance_booking_days = 14,
        guest_passes_included = 10
      WHERE tier = 'FOUNDING' AND (advance_booking_days = 2 OR advance_booking_days IS NULL);
      
      UPDATE pricing_tiers SET 
        discount_percent = 20,
        advance_booking_days = 7,
        guest_passes_included = 4
      WHERE tier = 'GOLD' AND (advance_booking_days = 2 OR advance_booking_days IS NULL);
      
      UPDATE pricing_tiers SET 
        discount_percent = 10,
        advance_booking_days = 5,
        guest_passes_included = 2
      WHERE tier = 'SILVER' AND (advance_booking_days = 2 OR advance_booking_days IS NULL);
    `).catch((err) => {
      logger.warn("pricing_tiers booking privilege seed may have failed", { source: "migrations", error: String(err) });
    });
    logger.info("pricing_tiers booking privileges seeded", { source: "migrations" });
    
    // Create membership_application_status enum if not exists
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE membership_application_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    
    // Create membership_applications table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS membership_applications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tier_desired membership_tier NOT NULL,
        payment_method VARCHAR DEFAULT 'bank_transfer',
        payment_amount INTEGER DEFAULT 0,
        payment_proof_url VARCHAR,
        payment_reference VARCHAR,
        status membership_application_status DEFAULT 'PENDING',
        admin_notes TEXT,
        reviewed_by VARCHAR REFERENCES users(id),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("membership_applications table created/verified", { source: "migrations" });
    
    // Create certifications table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certifications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        slug VARCHAR UNIQUE NOT NULL,
        name VARCHAR NOT NULL,
        description TEXT,
        facility_id VARCHAR REFERENCES facilities(id) ON DELETE SET NULL,
        validity_months INTEGER DEFAULT 12,
        requirements TEXT,
        icon VARCHAR,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("certifications table created/verified", { source: "migrations" });
    
    // Create certification_classes table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certification_classes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        certification_id VARCHAR NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
        title VARCHAR NOT NULL,
        description TEXT,
        instructor VARCHAR,
        scheduled_date TIMESTAMP,
        duration INTEGER DEFAULT 60,
        capacity INTEGER DEFAULT 10,
        enrolled_count INTEGER DEFAULT 0,
        price INTEGER DEFAULT 0,
        location VARCHAR,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("certification_classes table created/verified", { source: "migrations" });
    
    // Create certification_enrollments table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certification_enrollments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        class_id VARCHAR NOT NULL REFERENCES certification_classes(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR DEFAULT 'ENROLLED',
        completed_at TIMESTAMP,
        score INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("certification_enrollments table created/verified", { source: "migrations" });
    
    // Create user_certifications table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_certifications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        certification_id VARCHAR NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
        certificate_number VARCHAR UNIQUE,
        issued_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        status VARCHAR DEFAULT 'ACTIVE',
        issued_by VARCHAR REFERENCES users(id),
        proof_document_url VARCHAR,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("user_certifications table created/verified", { source: "migrations" });
    
    // Create page_content table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_content (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        page VARCHAR NOT NULL,
        section VARCHAR NOT NULL,
        key VARCHAR NOT NULL,
        title VARCHAR,
        content TEXT,
        icon VARCHAR,
        image_url VARCHAR,
        metadata JSONB,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("page_content table created/verified", { source: "migrations" });
    
    // Create comparison_features table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comparison_features (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        feature VARCHAR NOT NULL,
        founding_value VARCHAR,
        gold_value VARCHAR,
        silver_value VARCHAR,
        guest_value VARCHAR,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("comparison_features table created/verified", { source: "migrations" });
    
    // Create member_benefits table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS member_benefits (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        icon VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("member_benefits table created/verified", { source: "migrations" });
    
    // Add tier_id column to member_benefits if not exists
    await pool.query(`
      ALTER TABLE member_benefits 
      ADD COLUMN IF NOT EXISTS tier_id VARCHAR
    `).catch(() => {
      // Column might already exist
    });
    logger.info("member_benefits.tier_id column verified", { source: "migrations" });
    
    // Create career_benefits table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS career_benefits (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        icon VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("career_benefits table created/verified", { source: "migrations" });
    
    // Add image_url column to facility_add_ons if not exists
    await pool.query(`
      ALTER TABLE facility_add_ons 
      ADD COLUMN IF NOT EXISTS image_url TEXT
    `).catch(() => {
      // Column might already exist
    });
    logger.info("facility_add_ons.image_url column verified", { source: "migrations" });
    
    // Seed default tier definitions if table is empty
    const { rows } = await pool.query(`SELECT COUNT(*) as count FROM membership_tier_definitions`);
    if (parseInt(rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO membership_tier_definitions (slug, display_name, description, color, discount_percent, guest_passes_included, benefits, sort_order, is_active)
        VALUES 
          ('founding', 'Founding Member', 'Exclusive founding membership with premium benefits', '#FFD700', 25, 10, ARRAY['Lifetime priority booking (14-day window)', '25% discount on off-peak bookings', '10 guest passes per month', 'VIP parking & locker'], 1, true),
          ('gold', 'Gold Member', 'Premium membership with enhanced benefits', '#F59E0B', 20, 4, ARRAY['7-day advance booking window', '20% discount on off-peak bookings', '4 guest passes per month', 'Priority event registration'], 2, true),
          ('silver', 'Silver Member', 'Standard membership with core benefits', '#9CA3AF', 10, 2, ARRAY['5-day advance booking window', '10% discount on off-peak bookings', '2 guest passes per month'], 3, true),
          ('guest', 'Pay-to-Play', 'Access without membership commitment', '#6B7280', 0, 0, ARRAY['2-day advance booking window', 'Access after member priority', 'Equipment rental available'], 4, true)
      `);
      logger.info("Seeded default tier definitions", { source: "migrations" });
    }
    
    // Seed venues and facility addons
    try {
      await seedVenuesAndAddons();
      logger.info("Venues and addons seeded", { source: "migrations" });
    } catch (seedError) {
      logger.warn("Failed to seed venues and addons", { source: "migrations", error: seedError });
    }
    
    // Seed CMS Phase 2 content (Hero Sections, CTAs, Comparison Features, Member Benefits)
    try {
      await seedCmsPhase2();
      logger.info("CMS Phase 2 content seeded", { source: "migrations" });
    } catch (seedError) {
      logger.warn("Failed to seed CMS Phase 2 content", { source: "migrations", error: seedError });
    }
    
    // Add location column to navbar_items if not exists (for header vs footer navigation)
    await pool.query(`
      ALTER TABLE navbar_items 
      ADD COLUMN IF NOT EXISTS location VARCHAR DEFAULT 'header' NOT NULL
    `).catch(() => {
      // Column might already exist
    });
    logger.info("navbar_items.location column verified", { source: "migrations" });

    // Ensure dev bypass user exists in database (for development mode only)
    if (process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === 'true') {
      try {
        await pool.query(`
          INSERT INTO users (id, email, first_name, last_name, role, email_verified, created_at)
          VALUES ('dev-user-bypass', 'dev@quarterdeck.local', 'Dev', 'User', 'SUPER_ADMIN', true, NOW())
          ON CONFLICT (id) DO NOTHING
        `);
        logger.info("Dev bypass user ensured in database", { source: "migrations" });
      } catch (devUserError) {
        logger.warn("Failed to create dev bypass user", { source: "migrations", error: devUserError });
      }
    }
    
    logger.info("All startup migrations completed successfully", { source: "migrations" });
  } catch (error) {
    logger.error("Error running startup migrations", { source: "migrations", error });
    // Don't throw - allow app to continue even if migrations fail
  }
}
