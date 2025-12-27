import { db } from "../server/db";
import { siteImages, heroSections, facilities, galleryImages } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedImages() {
  console.log("Starting image seeding...");

  const siteImageData = [
    {
      key: "landing_hero_background",
      imageUrl: "/assets/sports_facility_cons_aa71e508-BJWEQx7e.jpg",
      page: "landing",
      section: "hero",
      alt: "The Quarterdeck sports complex construction",
      dimensions: "1920x1080"
    },
    {
      key: "footer_background",
      imageUrl: "/assets/architectural_render_c7f63aa7-m2TWghKc.jpg",
      page: "global",
      section: "footer",
      alt: "The Quarterdeck architectural render",
      dimensions: "1920x400"
    },
    {
      key: "navbar_background",
      imageUrl: "/assets/architectural_render_b118ee78-hmTi1mjz.jpg",
      page: "global",
      section: "navbar",
      alt: "Navbar texture",
      dimensions: "1920x100"
    }
  ];

  const heroSectionData = [
    { page: "facilities", title: "Our Facilities", subtitle: "World-class sports and recreation amenities", backgroundImageUrl: "/assets/padel_tennis_court_i_a0e484ae-Dqizodew.jpg", overlayOpacity: 60 },
    { page: "events", title: "Events", subtitle: "Join our community events and tournaments", backgroundImageUrl: "/assets/large_event_hall_int_39cfb773-D7tynaMB.jpg", overlayOpacity: 60 },
    { page: "contact", title: "Contact Us", subtitle: "Get in touch with our team", backgroundImageUrl: "/assets/architectural_render_cd4dce75-BruYoWlw.jpg", overlayOpacity: 60 },
    { page: "careers", title: "Join Our Team", subtitle: "Build your career at The Quarterdeck", backgroundImageUrl: "/assets/modern_cafe_bar_inte_bc2874c0-DokhLEuU.jpg", overlayOpacity: 60 },
    { page: "membership", title: "Membership", subtitle: "Exclusive benefits for our members", backgroundImageUrl: "/assets/elegant_card_game_ro_42b0454d-y4j-Rn8N.jpg", overlayOpacity: 60 },
    { page: "gallery", title: "Gallery", subtitle: "See our progress and facilities", backgroundImageUrl: "/assets/sports_facility_cons_aa71e508-BJWEQx7e.jpg", overlayOpacity: 60 },
    { page: "roadmap", title: "Our Journey", subtitle: "From vision to reality", backgroundImageUrl: "/assets/architectural_render_c7f63aa7-m2TWghKc.jpg", overlayOpacity: 60 },
    { page: "faq", title: "FAQ", subtitle: "Frequently asked questions", backgroundImageUrl: "/assets/indoor_squash_court__c97e350b-C624hay8.jpg", overlayOpacity: 60 },
    { page: "rules", title: "Rules & Safety", subtitle: "Guidelines for all members and guests", backgroundImageUrl: "/assets/air_rifle_shooting_r_931e6002-CX81Opd3.jpg", overlayOpacity: 60 },
    { page: "leaderboard", title: "Leaderboard", subtitle: "Top performers at The Quarterdeck", backgroundImageUrl: "/assets/indoor_squash_court__3447d74a-DPwnnr4G.jpg", overlayOpacity: 60 }
  ];

  const facilityImages: Record<string, string> = {
    "padel-tennis": "/assets/padel_tennis_court_i_a0e484ae-Dqizodew.jpg",
    "squash": "/assets/indoor_squash_court__c97e350b-C624hay8.jpg",
    "air-rifle-range": "/assets/air_rifle_shooting_r_931e6002-CX81Opd3.jpg",
    "bridge-room": "/assets/elegant_card_game_ro_42b0454d-y4j-Rn8N.jpg",
    "multipurpose-hall": "/assets/large_event_hall_int_39cfb773-D7tynaMB.jpg",
    "cafe-bar": "/assets/modern_cafe_bar_inte_bc2874c0-DokhLEuU.jpg"
  };

  const galleryData = [
    { imageUrl: "/assets/sports_facility_cons_aa71e508-BJWEQx7e.jpg", caption: "Construction Progress - Main Building", category: "construction", sortOrder: 1 },
    { imageUrl: "/assets/architectural_render_c7f63aa7-m2TWghKc.jpg", caption: "Architectural Render - Exterior View", category: "renders", sortOrder: 2 },
    { imageUrl: "/assets/architectural_render_b118ee78-hmTi1mjz.jpg", caption: "Architectural Render - Side View", category: "renders", sortOrder: 3 },
    { imageUrl: "/assets/architectural_render_cd4dce75-BruYoWlw.jpg", caption: "Architectural Render - Entrance", category: "renders", sortOrder: 4 },
    { imageUrl: "/assets/padel_tennis_court_i_a0e484ae-Dqizodew.jpg", caption: "Padel Tennis Courts", category: "facilities", sortOrder: 5 },
    { imageUrl: "/assets/indoor_squash_court__c97e350b-C624hay8.jpg", caption: "Squash Courts", category: "facilities", sortOrder: 6 },
    { imageUrl: "/assets/large_event_hall_int_39cfb773-D7tynaMB.jpg", caption: "Multipurpose Event Hall", category: "facilities", sortOrder: 7 },
    { imageUrl: "/assets/modern_cafe_bar_inte_bc2874c0-DokhLEuU.jpg", caption: "Cafe & Bar", category: "facilities", sortOrder: 8 }
  ];

  try {
    // Seed site images
    console.log("Seeding site images...");
    for (const img of siteImageData) {
      const existing = await db.select().from(siteImages).where(eq(siteImages.key, img.key));
      if (existing.length === 0) {
        await db.insert(siteImages).values(img);
        console.log(`  Created: ${img.key}`);
      } else {
        await db.update(siteImages).set(img).where(eq(siteImages.key, img.key));
        console.log(`  Updated: ${img.key}`);
      }
    }

    // Seed hero sections
    console.log("Seeding hero sections...");
    for (const hero of heroSectionData) {
      const existing = await db.select().from(heroSections).where(eq(heroSections.page, hero.page));
      if (existing.length === 0) {
        await db.insert(heroSections).values(hero);
        console.log(`  Created hero: ${hero.page}`);
      } else {
        await db.update(heroSections).set(hero).where(eq(heroSections.page, hero.page));
        console.log(`  Updated hero: ${hero.page}`);
      }
    }

    // Update facility images
    console.log("Updating facility images...");
    for (const [slug, imageUrl] of Object.entries(facilityImages)) {
      const result = await db.update(facilities).set({ imageUrl }).where(eq(facilities.slug, slug));
      console.log(`  Updated facility: ${slug}`);
    }

    // Seed gallery
    console.log("Seeding gallery images...");
    const existingGallery = await db.select().from(galleryImages);
    if (existingGallery.length === 0) {
      for (const g of galleryData) {
        await db.insert(galleryImages).values({
          ...g,
          title: g.caption,
        });
        console.log(`  Created gallery: ${g.caption}`);
      }
    } else {
      console.log("  Gallery already has images, skipping...");
    }

    console.log("\nImage seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedImages();
