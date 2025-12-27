import { pool } from "./db";
import logger from "./logger";
import { seedVenuesAndAddons } from "./seeds/seedVenuesAndAddons";

export async function runStartupMigrations() {
  logger.info("Running startup migrations...", { source: "migrations" });
  
  try {
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
    
    logger.info("All startup migrations completed successfully", { source: "migrations" });
  } catch (error) {
    logger.error("Error running startup migrations", { source: "migrations", error });
    // Don't throw - allow app to continue even if migrations fail
  }
}
