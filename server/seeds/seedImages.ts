import { db } from "../db";
import { siteImages, heroSections, facilities, galleryImages } from "@shared/schema";
import { eq } from "drizzle-orm";

const ASSET_BASE = "/assets/stock_images";

export interface SeedResult {
  siteImages: { created: number; updated: number };
  heroSections: { created: number; updated: number };
  facilities: { updated: number; notFound: string[] };
  gallery: { created: number };
}

export async function seedAllImages(): Promise<SeedResult> {
  console.log("Seeding CMS images...");
  
  const result: SeedResult = {
    siteImages: { created: 0, updated: 0 },
    heroSections: { created: 0, updated: 0 },
    facilities: { updated: 0, notFound: [] },
    gallery: { created: 0 },
  };

  // 1. SITE IMAGES - Global images controlled via Admin > Site Images
  const siteImageSeeds = [
    {
      key: "landing_hero_background",
      imageUrl: `${ASSET_BASE}/padel_tennis_court_i_37ae0ba3.jpg`,
      alt: "Landing page hero background",
      title: "Landing Page Hero Background",
      description: "Main hero background image on the home/landing page. Recommended: 1920x1080 or larger.",
      page: "landing",
      section: "hero",
      dimensions: "1920x1080",
      sortOrder: 1,
      isActive: true,
    },
    {
      key: "footer_background",
      imageUrl: `${ASSET_BASE}/dark_elegant_sports__61a0b4ec.jpg`,
      alt: "Footer background",
      title: "Footer Background Image",
      description: "Background image for the site footer. Should be dark/elegant. Recommended: 1920x400.",
      page: "global",
      section: "footer",
      dimensions: "1920x400",
      sortOrder: 2,
      isActive: true,
    },
    {
      key: "navbar_background",
      imageUrl: `${ASSET_BASE}/dark_elegant_sports__61a0b4ec.jpg`,
      alt: "Navbar background",
      title: "Navbar Background Image",
      description: "Background texture for the navigation bar. Should be dark/elegant. Recommended: 1920x100.",
      page: "global",
      section: "navbar",
      dimensions: "1920x100",
      sortOrder: 3,
      isActive: true,
    },
  ];

  // 2. HERO SECTIONS - Per-page hero images controlled via Admin > Hero Sections
  const heroSectionSeeds = [
    {
      page: "facilities",
      title: "Facilities Page Hero",
      subtitle: "World-class sports and recreation facilities in Islamabad",
      backgroundImageUrl: `${ASSET_BASE}/modern_sports_comple_97c8483a.jpg`,
      overlayOpacity: 50,
      alignment: "center",
      height: "medium",
      isActive: true,
    },
    {
      page: "events",
      title: "Events Page Hero",
      subtitle: "Tournaments, academies, and community events",
      backgroundImageUrl: `${ASSET_BASE}/modern_sports_comple_db8b6ad3.jpg`,
      overlayOpacity: 50,
      alignment: "center",
      height: "medium",
      isActive: true,
    },
    {
      page: "contact",
      title: "Contact Page Hero",
      subtitle: "Get in touch with The Quarterdeck team",
      backgroundImageUrl: `${ASSET_BASE}/modern_indoor_sports_8b182ff8.jpg`,
      overlayOpacity: 50,
      alignment: "center",
      height: "medium",
      isActive: true,
    },
    {
      page: "careers",
      title: "Careers Page Hero",
      subtitle: "Join our growing team at The Quarterdeck",
      backgroundImageUrl: `${ASSET_BASE}/modern_sports_comple_97c8483a.jpg`,
      overlayOpacity: 50,
      alignment: "center",
      height: "medium",
      isActive: true,
    },
    {
      page: "membership",
      title: "Membership Page Hero",
      subtitle: "Join The Quarterdeck community",
      backgroundImageUrl: `${ASSET_BASE}/elegant_card_game_ro_42b0454d.jpg`,
      overlayOpacity: 50,
      alignment: "center",
      height: "medium",
      isActive: true,
    },
    {
      page: "gallery",
      title: "Gallery Page Hero",
      subtitle: "Visual updates and progress photos",
      backgroundImageUrl: `${ASSET_BASE}/construction_site_fo_987f2281.jpg`,
      overlayOpacity: 50,
      alignment: "center",
      height: "medium",
      isActive: true,
    },
    {
      page: "roadmap",
      title: "Roadmap/Updates Page Hero",
      subtitle: "Construction progress and timeline",
      backgroundImageUrl: `${ASSET_BASE}/sports_facility_cons_42f46556.jpg`,
      overlayOpacity: 50,
      alignment: "center",
      height: "medium",
      isActive: true,
    },
    {
      page: "faq",
      title: "FAQ Page Hero",
      subtitle: "Frequently asked questions about The Quarterdeck",
      backgroundImageUrl: `${ASSET_BASE}/modern_indoor_sports_8b182ff8.jpg`,
      overlayOpacity: 50,
      alignment: "center",
      height: "medium",
      isActive: true,
    },
    {
      page: "rules",
      title: "Rules Page Hero",
      subtitle: "Facility rules and guidelines",
      backgroundImageUrl: `${ASSET_BASE}/modern_sports_comple_97c8483a.jpg`,
      overlayOpacity: 50,
      alignment: "center",
      height: "medium",
      isActive: true,
    },
    {
      page: "leaderboard",
      title: "Leaderboard Page Hero",
      subtitle: "Rankings and achievements",
      backgroundImageUrl: `${ASSET_BASE}/padel_tennis_court_i_a0e484ae.jpg`,
      overlayOpacity: 50,
      alignment: "center",
      height: "medium",
      isActive: true,
    },
  ];

  // 3. FACILITY IMAGES - Controlled via Admin > Facilities
  const facilityImageUpdates = [
    {
      slug: "padel-tennis",
      imageUrl: `${ASSET_BASE}/padel_tennis_court_i_a0e484ae.jpg`,
    },
    {
      slug: "squash",
      imageUrl: `${ASSET_BASE}/indoor_squash_court__c97e350b.jpg`,
    },
    {
      slug: "air-rifle-range",
      imageUrl: `${ASSET_BASE}/air_rifle_shooting_r_931e6002.jpg`,
    },
    {
      slug: "bridge-room",
      imageUrl: `${ASSET_BASE}/elegant_card_game_ro_26fec1dc.jpg`,
    },
    {
      slug: "multipurpose-hall",
      imageUrl: `${ASSET_BASE}/large_event_hall_int_39cfb773.jpg`,
    },
    {
      slug: "cafe-bar",
      imageUrl: `${ASSET_BASE}/modern_cafe_bar_inte_bc2874c0.jpg`,
    },
  ];

  // 4. GALLERY IMAGES - Construction progress and renders
  const galleryImageSeeds = [
    {
      title: "Construction Progress - Foundation",
      description: "Foundation work in progress at the main complex site",
      imageUrl: `${ASSET_BASE}/sports_facility_cons_42f46556.jpg`,
      category: "construction",
      sortOrder: 1,
      isActive: true,
    },
    {
      title: "Construction Progress - Structure",
      description: "Structural framework taking shape",
      imageUrl: `${ASSET_BASE}/sports_facility_cons_44a23ac3.jpg`,
      category: "construction",
      sortOrder: 2,
      isActive: true,
    },
    {
      title: "Site Overview",
      description: "Aerial view of construction site",
      imageUrl: `${ASSET_BASE}/construction_site_fo_987f2281.jpg`,
      category: "construction",
      sortOrder: 3,
      isActive: true,
    },
    {
      title: "Architectural Render - Exterior",
      description: "Artist impression of the completed facility exterior",
      imageUrl: `${ASSET_BASE}/architectural_render_b118ee78.jpg`,
      category: "renders",
      sortOrder: 10,
      isActive: true,
    },
    {
      title: "Architectural Render - Interior",
      description: "Artist impression of the main hall interior",
      imageUrl: `${ASSET_BASE}/architectural_render_c7f63aa7.jpg`,
      category: "renders",
      sortOrder: 11,
      isActive: true,
    },
    {
      title: "Architectural Render - Courts",
      description: "Artist impression of the padel tennis courts",
      imageUrl: `${ASSET_BASE}/architectural_render_cd4dce75.jpg`,
      category: "renders",
      sortOrder: 12,
      isActive: true,
    },
  ];

  try {
    // Insert site images (upsert based on key)
    for (const img of siteImageSeeds) {
      const existing = await db.select().from(siteImages).where(eq(siteImages.key, img.key));
      if (existing.length === 0) {
        await db.insert(siteImages).values(img);
        console.log(`  Created site image: ${img.key}`);
        result.siteImages.created++;
      } else {
        await db.update(siteImages).set(img).where(eq(siteImages.key, img.key));
        console.log(`  Updated site image: ${img.key}`);
        result.siteImages.updated++;
      }
    }

    // Insert hero sections (upsert based on page)
    for (const hero of heroSectionSeeds) {
      const existing = await db.select().from(heroSections).where(eq(heroSections.page, hero.page));
      if (existing.length === 0) {
        await db.insert(heroSections).values(hero);
        console.log(`  Created hero section: ${hero.page}`);
        result.heroSections.created++;
      } else {
        await db.update(heroSections).set(hero).where(eq(heroSections.page, hero.page));
        console.log(`  Updated hero section: ${hero.page}`);
        result.heroSections.updated++;
      }
    }

    // Update facility images (check if facility exists first)
    for (const facility of facilityImageUpdates) {
      const existing = await db.select().from(facilities).where(eq(facilities.slug, facility.slug));
      if (existing.length > 0) {
        await db.update(facilities).set({ imageUrl: facility.imageUrl }).where(eq(facilities.slug, facility.slug));
        console.log(`  Updated facility image: ${facility.slug}`);
        result.facilities.updated++;
      } else {
        console.log(`  Facility not found (skipped): ${facility.slug}`);
        result.facilities.notFound.push(facility.slug);
      }
    }

    // Insert gallery images (check if already exists by title to avoid duplicates)
    for (const img of galleryImageSeeds) {
      const existing = await db.select().from(galleryImages).where(eq(galleryImages.title, img.title));
      if (existing.length === 0) {
        await db.insert(galleryImages).values(img);
        console.log(`  Created gallery image: ${img.title}`);
        result.gallery.created++;
      } else {
        console.log(`  Gallery image exists (skipped): ${img.title}`);
      }
    }

    console.log("\nImage seeding complete!");
    console.log(`  Site images: ${result.siteImages.created} created, ${result.siteImages.updated} updated`);
    console.log(`  Hero sections: ${result.heroSections.created} created, ${result.heroSections.updated} updated`);
    console.log(`  Facilities: ${result.facilities.updated} updated, ${result.facilities.notFound.length} not found`);
    console.log(`  Gallery: ${result.gallery.created} created`);

    return result;

  } catch (error) {
    console.error("Error seeding images:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAllImages()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
