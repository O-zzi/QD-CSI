import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createFaqTables() {
  console.log("Creating FAQ tables if they don't exist...");

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS faq_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  faq_categories table created/verified");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS faq_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID REFERENCES faq_categories(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  faq_items table created/verified");

    console.log("FAQ tables ready!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to create tables:", error);
    process.exit(1);
  }
}

createFaqTables();
