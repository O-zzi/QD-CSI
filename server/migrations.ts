import { pool } from "./db";

export async function runStartupMigrations() {
  console.log("[migrations] Running startup migrations...");
  
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
    console.log("[migrations] membership_tier_definitions table created/verified");

    // Add metadata column to notifications if not exists
    await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS metadata JSONB
    `).catch(() => {
      // Column might already exist or table structure differs
    });
    
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
      console.log("[migrations] Seeded default tier definitions");
    }
    
    console.log("[migrations] All startup migrations completed successfully");
  } catch (error) {
    console.error("[migrations] Error running startup migrations:", error);
    // Don't throw - allow app to continue even if migrations fail
  }
}
