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
    // Coming Soon page carousel images
    {
      key: "coming_soon_carousel_1",
      imageUrl: `${ASSET_BASE}/architectural_render_b118ee78.jpg`,
      alt: "Complex Exterior Render",
      title: "Premium Sports Complex Design",
      description: "Coming Soon carousel image 1 - Architectural render",
      page: "coming-soon",
      section: "coming-soon-1",
      dimensions: "800x600",
      sortOrder: 10,
      isActive: true,
    },
    {
      key: "coming_soon_carousel_2",
      imageUrl: `${ASSET_BASE}/padel_tennis_court_i_a0e484ae.jpg`,
      alt: "Padel Tennis Courts",
      title: "World-Class Padel Courts",
      description: "Coming Soon carousel image 2 - Padel courts",
      page: "coming-soon",
      section: "coming-soon-2",
      dimensions: "800x600",
      sortOrder: 11,
      isActive: true,
    },
    {
      key: "coming_soon_carousel_3",
      imageUrl: `${ASSET_BASE}/indoor_squash_court__c97e350b.jpg`,
      alt: "Squash Court",
      title: "Professional Squash Facility",
      description: "Coming Soon carousel image 3 - Squash court",
      page: "coming-soon",
      section: "coming-soon-3",
      dimensions: "800x600",
      sortOrder: 12,
      isActive: true,
    },
    {
      key: "coming_soon_carousel_4",
      imageUrl: `${ASSET_BASE}/architectural_render_cd4dce75.jpg`,
      alt: "Sports Arena",
      title: "Modern Architecture",
      description: "Coming Soon carousel image 4 - Sports arena render",
      page: "coming-soon",
      section: "coming-soon-4",
      dimensions: "800x600",
      sortOrder: 13,
      isActive: true,
    },
    {
      key: "coming_soon_carousel_5",
      imageUrl: `${ASSET_BASE}/sports_facility_cons_6b087ae8.jpg`,
      alt: "Construction Progress",
      title: "Building Your Future",
      description: "Coming Soon carousel image 5 - Construction progress",
      page: "coming-soon",
      section: "coming-soon-5",
      dimensions: "800x600",
      sortOrder: 14,
      isActive: true,
    },
    // Membership tier images
    {
      key: "membership_tier_founding",
      imageUrl: `${ASSET_BASE}/padel_tennis_court_i_a0e484ae.jpg`,
      alt: "Founding Member",
      title: "Founding Member Tier",
      description: "Membership tier image for Founding Members",
      page: "membership",
      section: "tier-founding",
      dimensions: "400x300",
      sortOrder: 20,
      isActive: true,
    },
    {
      key: "membership_tier_associate",
      imageUrl: `${ASSET_BASE}/indoor_squash_court__c97e350b.jpg`,
      alt: "Associate Member",
      title: "Associate Member Tier",
      description: "Membership tier image for Associate Members",
      page: "membership",
      section: "tier-associate",
      dimensions: "400x300",
      sortOrder: 21,
      isActive: true,
    },
    {
      key: "membership_tier_family",
      imageUrl: `${ASSET_BASE}/modern_sports_comple_97c8483a.jpg`,
      alt: "Family Member",
      title: "Family Member Tier",
      description: "Membership tier image for Family Members",
      page: "membership",
      section: "tier-family",
      dimensions: "400x300",
      sortOrder: 22,
      isActive: true,
    },
    {
      key: "membership_tier_corporate",
      imageUrl: `${ASSET_BASE}/large_event_hall_int_39cfb773.jpg`,
      alt: "Corporate Member",
      title: "Corporate Member Tier",
      description: "Membership tier image for Corporate Members",
      page: "membership",
      section: "tier-corporate",
      dimensions: "400x300",
      sortOrder: 23,
      isActive: true,
    },
    {
      key: "membership_tier_forces",
      imageUrl: `${ASSET_BASE}/air_rifle_shooting_r_931e6002.jpg`,
      alt: "Armed Forces Member",
      title: "Armed Forces Member Tier",
      description: "Membership tier image for Armed Forces Members",
      page: "membership",
      section: "tier-forces",
      dimensions: "400x300",
      sortOrder: 24,
      isActive: true,
    },
    // Gallery section homepage images
    {
      key: "gallery_homepage_1",
      imageUrl: `${ASSET_BASE}/sports_facility_cons_42f46556.jpg`,
      alt: "Foundation work in progress",
      title: "Foundation Work",
      description: "Gallery homepage image 1 - Construction progress",
      page: "landing",
      section: "gallery-1",
      dimensions: "600x400",
      sortOrder: 30,
      isActive: true,
    },
    {
      key: "gallery_homepage_2",
      imageUrl: `${ASSET_BASE}/sports_facility_cons_44a23ac3.jpg`,
      alt: "Structural framework taking shape",
      title: "Structure Progress",
      description: "Gallery homepage image 2 - Structural work",
      page: "landing",
      section: "gallery-2",
      dimensions: "600x400",
      sortOrder: 31,
      isActive: true,
    },
    {
      key: "gallery_homepage_3",
      imageUrl: `${ASSET_BASE}/construction_site_fo_987f2281.jpg`,
      alt: "Aerial view of construction",
      title: "Site Overview",
      description: "Gallery homepage image 3 - Aerial view",
      page: "landing",
      section: "gallery-3",
      dimensions: "600x400",
      sortOrder: 32,
      isActive: true,
    },
    {
      key: "gallery_homepage_4",
      imageUrl: `${ASSET_BASE}/architectural_render_b118ee78.jpg`,
      alt: "Architectural exterior render",
      title: "Exterior Render",
      description: "Gallery homepage image 4 - Exterior render",
      page: "landing",
      section: "gallery-4",
      dimensions: "600x400",
      sortOrder: 33,
      isActive: true,
    },
    {
      key: "gallery_homepage_5",
      imageUrl: `${ASSET_BASE}/architectural_render_c7f63aa7.jpg`,
      alt: "Interior hall render",
      title: "Interior Render",
      description: "Gallery homepage image 5 - Interior render",
      page: "landing",
      section: "gallery-5",
      dimensions: "600x400",
      sortOrder: 34,
      isActive: true,
    },
    {
      key: "gallery_homepage_6",
      imageUrl: `${ASSET_BASE}/architectural_render_cd4dce75.jpg`,
      alt: "Courts render",
      title: "Courts Render",
      description: "Gallery homepage image 6 - Courts render",
      page: "landing",
      section: "gallery-6",
      dimensions: "600x400",
      sortOrder: 35,
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

// Run if called directly with ESM
const isRunDirectly = import.meta.url === `file://${process.argv[1]}`;
if (isRunDirectly) {
  seedAllImages()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
