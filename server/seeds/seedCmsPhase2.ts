import { db } from "../db";
import { heroSections, ctas, comparisonFeatures, memberBenefits, siteSettings } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface CmsPhase2SeedResult {
  heroSections: number;
  ctas: number;
  comparisonFeatures: number;
  memberBenefits: number;
  siteSettings: number;
}

const BANK_SETTINGS_SEEDS = [
  {
    key: "bank_name",
    value: "MCB Bank",
    type: "text",
    label: "Bank Name",
    category: "payment",
  },
  {
    key: "bank_account_title",
    value: "The Quarterdeck Sports Club",
    type: "text",
    label: "Account Title",
    category: "payment",
  },
  {
    key: "bank_account_number",
    value: "0123456789012345",
    type: "text",
    label: "Account Number",
    category: "payment",
  },
  {
    key: "bank_iban",
    value: "PK00MCBL0123456789012345",
    type: "text",
    label: "IBAN",
    category: "payment",
  },
  {
    key: "bank_branch_code",
    value: "0123",
    type: "text",
    label: "Branch Code",
    category: "payment",
  },
  {
    key: "bank_swift_code",
    value: "MUCBPKKA",
    type: "text",
    label: "SWIFT Code",
    category: "payment",
  },
];

const HERO_SECTIONS_SEEDS = [
  {
    page: "landing",
    title: "Welcome to The Quarterdeck",
    subtitle: "Pakistan's Premier Sports & Recreation Complex",
    description: "Experience world-class Padel Tennis, Squash, Air Rifle Range, and more in Islamabad",
    backgroundImageUrl: "/assets/stock_images/padel_tennis_court_i_37ae0ba3.jpg",
    overlayOpacity: 60,
    ctaText: "Explore Facilities",
    ctaLink: "/facilities",
    ctaSecondaryText: "View Roadmap",
    ctaSecondaryLink: "/roadmap",
    alignment: "center",
    height: "full",
    isActive: true,
  },
  {
    page: "facilities",
    title: "Our Facilities",
    subtitle: "World-class sports and recreation facilities designed for excellence",
    backgroundImageUrl: "/assets/stock_images/modern_indoor_sports_8b182ff8.jpg",
    overlayOpacity: 50,
    ctaText: "Book Now",
    ctaLink: "/booking",
    alignment: "center",
    height: "medium",
    isActive: true,
  },
  {
    page: "membership",
    title: "Membership",
    subtitle: "Join The Quarterdeck community and unlock exclusive benefits",
    backgroundImageUrl: "/assets/stock_images/elegant_card_game_ro_42b0454d.jpg",
    overlayOpacity: 55,
    ctaText: "Join Now",
    ctaLink: "#apply",
    alignment: "center",
    height: "medium",
    isActive: true,
  },
  {
    page: "events",
    title: "Events & Academies",
    subtitle: "Tournaments, leagues, and training programs",
    backgroundImageUrl: "/assets/stock_images/large_event_hall_int_32ffc7ae.jpg",
    overlayOpacity: 50,
    ctaText: "View Events",
    ctaLink: "/events",
    alignment: "center",
    height: "medium",
    isActive: true,
  },
  {
    page: "contact",
    title: "Contact Us",
    subtitle: "Get in touch with The Quarterdeck team",
    backgroundImageUrl: "/assets/stock_images/modern_cafe_bar_inte_bc2874c0.jpg",
    overlayOpacity: 55,
    alignment: "center",
    height: "small",
    isActive: true,
  },
  {
    page: "careers",
    title: "Join Our Team",
    subtitle: "Be part of Islamabad's premier sports destination",
    backgroundImageUrl: "/assets/stock_images/sports_facility_cons_44a23ac3.jpg",
    overlayOpacity: 50,
    ctaText: "View Positions",
    ctaLink: "#positions",
    alignment: "center",
    height: "medium",
    isActive: true,
  },
  {
    page: "gallery",
    title: "Gallery & Progress",
    subtitle: "Construction updates and architectural renders",
    backgroundImageUrl: "/assets/stock_images/architectural_render_b118ee78.jpg",
    overlayOpacity: 45,
    alignment: "center",
    height: "medium",
    isActive: true,
  },
  {
    page: "roadmap",
    title: "Development Roadmap",
    subtitle: "Follow our journey from groundbreaking to grand opening",
    backgroundImageUrl: "/assets/stock_images/sports_facility_cons_6b087ae8.jpg",
    overlayOpacity: 50,
    alignment: "center",
    height: "medium",
    isActive: true,
  },
  {
    page: "faq",
    title: "Frequently Asked Questions",
    subtitle: "Find answers to common questions about The Quarterdeck",
    overlayOpacity: 50,
    alignment: "center",
    height: "small",
    isActive: true,
  },
  {
    page: "rules",
    title: "Rules & Safety",
    subtitle: "For the safety and enjoyment of all members",
    overlayOpacity: 50,
    alignment: "center",
    height: "small",
    isActive: true,
  },
  {
    page: "leaderboard",
    title: "Leaderboard",
    subtitle: "Top players across all sports at The Quarterdeck",
    overlayOpacity: 50,
    alignment: "center",
    height: "small",
    isActive: true,
  },
];

const CTA_SEEDS = [
  {
    key: "landing-membership",
    title: "Ready to Join?",
    subtitle: "Become a member and unlock exclusive benefits",
    buttonText: "Join Now",
    buttonLink: "/membership",
    secondaryButtonText: "Learn More",
    secondaryButtonLink: "/membership#benefits",
    style: "gradient",
    page: "landing",
    section: "membership",
    sortOrder: 1,
    isActive: true,
  },
  {
    key: "landing-booking",
    title: "Book Your Session",
    subtitle: "Reserve your court today and experience world-class facilities",
    buttonText: "Book Now",
    buttonLink: "/booking",
    style: "default",
    page: "landing",
    section: "booking",
    sortOrder: 2,
    isActive: true,
  },
  {
    key: "facilities-booking",
    title: "Ready to Play?",
    subtitle: "Book your preferred facility and time slot",
    buttonText: "Book Now",
    buttonLink: "/booking",
    secondaryButtonText: "View Availability",
    secondaryButtonLink: "/booking",
    style: "default",
    page: "facilities",
    section: "footer",
    sortOrder: 1,
    isActive: true,
  },
  {
    key: "membership-apply",
    title: "Start Your Membership Today",
    subtitle: "Join our community of sports enthusiasts",
    buttonText: "Apply Now",
    buttonLink: "/membership#apply",
    style: "gradient",
    page: "membership",
    section: "footer",
    sortOrder: 1,
    isActive: true,
  },
  {
    key: "events-register",
    title: "Don't Miss Out",
    subtitle: "Register for upcoming events and tournaments",
    buttonText: "View Events",
    buttonLink: "/events",
    style: "default",
    page: "events",
    section: "footer",
    sortOrder: 1,
    isActive: true,
  },
  {
    key: "footer-newsletter",
    title: "Stay Updated",
    subtitle: "Subscribe to our newsletter for the latest news and updates",
    buttonText: "Subscribe",
    buttonLink: "#newsletter",
    style: "minimal",
    page: "global",
    section: "footer",
    sortOrder: 1,
    isActive: true,
  },
];

const COMPARISON_FEATURES_SEEDS = [
  { feature: "Monthly Fee", foundingValue: "PKR 35,000", goldValue: "PKR 15,000", silverValue: "PKR 5,000", guestValue: "Pay-per-use", sortOrder: 1 },
  { feature: "Advance Booking Window", foundingValue: "14 days", goldValue: "7 days", silverValue: "5 days", guestValue: "2 days", sortOrder: 2 },
  { feature: "Off-Peak Discount", foundingValue: "25%", goldValue: "20%", silverValue: "10%", guestValue: "None", sortOrder: 3 },
  { feature: "Guest Passes / Month", foundingValue: "10", goldValue: "4", silverValue: "2", guestValue: "N/A", sortOrder: 4 },
  { feature: "Priority Event Registration", foundingValue: "Yes", goldValue: "Yes", silverValue: "No", guestValue: "No", sortOrder: 5 },
  { feature: "Coaching Discount", foundingValue: "20%", goldValue: "15%", silverValue: "10%", guestValue: "None", sortOrder: 6 },
  { feature: "Equipment Rental", foundingValue: "Free", goldValue: "2x Free/Month", silverValue: "Standard Rate", guestValue: "Standard Rate", sortOrder: 7 },
  { feature: "Member Lounge Access", foundingValue: "VIP", goldValue: "Yes", silverValue: "Limited", guestValue: "No", sortOrder: 8 },
  { feature: "VIP Parking & Locker", foundingValue: "Yes", goldValue: "No", silverValue: "No", guestValue: "No", sortOrder: 9 },
  { feature: "Credit Bonus", foundingValue: "10%", goldValue: "5%", silverValue: "None", guestValue: "None", sortOrder: 10 },
  { feature: "Bridge Room Access", foundingValue: "Exclusive", goldValue: "Standard", silverValue: "Standard", guestValue: "Limited", sortOrder: 11 },
  { feature: "Recognition Wall", foundingValue: "Yes", goldValue: "No", silverValue: "No", guestValue: "No", sortOrder: 12 },
];

const MEMBER_BENEFITS_SEEDS = [
  { icon: "calendar", title: "Priority Booking", description: "Book courts before non-members with extended booking windows", sortOrder: 1 },
  { icon: "percent", title: "Exclusive Discounts", description: "Save on court bookings, equipment, and coaching sessions", sortOrder: 2 },
  { icon: "users", title: "Guest Passes", description: "Bring friends and family to enjoy our facilities", sortOrder: 3 },
  { icon: "trophy", title: "Tournament Access", description: "Participate in member-only tournaments and leagues", sortOrder: 4 },
  { icon: "coffee", title: "Lounge Access", description: "Relax in our exclusive member lounge and cafe area", sortOrder: 5 },
  { icon: "sparkles", title: "Premium Experience", description: "Enjoy premium amenities and personalized service", sortOrder: 6 },
  { icon: "gift", title: "Special Perks", description: "Birthday rewards, seasonal offers, and member events", sortOrder: 7 },
  { icon: "shield", title: "Lifetime Benefits", description: "Founding members enjoy permanent perks and recognition", sortOrder: 8 },
];

export async function seedCmsPhase2(): Promise<CmsPhase2SeedResult> {
  const result: CmsPhase2SeedResult = {
    heroSections: 0,
    ctas: 0,
    comparisonFeatures: 0,
    memberBenefits: 0,
    siteSettings: 0,
  };

  console.log("Seeding CMS Phase 2 content...");

  // Seed hero sections (unique by page)
  for (const hero of HERO_SECTIONS_SEEDS) {
    try {
      const existing = await db.select().from(heroSections).where(eq(heroSections.page, hero.page));
      if (existing.length === 0) {
        await db.insert(heroSections).values(hero);
        result.heroSections++;
      }
    } catch (error: any) {
      // Handle unique constraint violations silently (already exists)
      if (!error.message?.includes('duplicate key') && !error.message?.includes('unique constraint')) {
        console.error(`  Error seeding hero section for ${hero.page}:`, error.message);
      }
    }
  }
  console.log(`  Hero Sections: ${result.heroSections} created`);

  // Seed CTAs (unique by key)
  for (const cta of CTA_SEEDS) {
    try {
      const existing = await db.select().from(ctas).where(eq(ctas.key, cta.key));
      if (existing.length === 0) {
        await db.insert(ctas).values(cta);
        result.ctas++;
      }
    } catch (error: any) {
      if (!error.message?.includes('duplicate key') && !error.message?.includes('unique constraint')) {
        console.error(`  Error seeding CTA ${cta.key}:`, error.message);
      }
    }
  }
  console.log(`  CTAs: ${result.ctas} created`);

  // Seed comparison features (unique by feature name)
  for (const feature of COMPARISON_FEATURES_SEEDS) {
    try {
      const existing = await db.select().from(comparisonFeatures).where(eq(comparisonFeatures.feature, feature.feature));
      if (existing.length === 0) {
        await db.insert(comparisonFeatures).values(feature);
        result.comparisonFeatures++;
      }
    } catch (error: any) {
      if (!error.message?.includes('duplicate key') && !error.message?.includes('unique constraint')) {
        console.error(`  Error seeding comparison feature ${feature.feature}:`, error.message);
      }
    }
  }
  console.log(`  Comparison Features: ${result.comparisonFeatures} created`);

  // Seed member benefits (unique by title)
  for (const benefit of MEMBER_BENEFITS_SEEDS) {
    try {
      const existing = await db.select().from(memberBenefits).where(eq(memberBenefits.title, benefit.title));
      if (existing.length === 0) {
        await db.insert(memberBenefits).values(benefit);
        result.memberBenefits++;
      }
    } catch (error: any) {
      if (!error.message?.includes('duplicate key') && !error.message?.includes('unique constraint')) {
        console.error(`  Error seeding member benefit ${benefit.title}:`, error.message);
      }
    }
  }
  console.log(`  Member Benefits: ${result.memberBenefits} created`);

  // Seed bank/payment settings (unique by key)
  for (const setting of BANK_SETTINGS_SEEDS) {
    try {
      const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, setting.key));
      if (existing.length === 0) {
        await db.insert(siteSettings).values(setting);
        result.siteSettings++;
      }
    } catch (error: any) {
      if (!error.message?.includes('duplicate key') && !error.message?.includes('unique constraint')) {
        console.error(`  Error seeding site setting ${setting.key}:`, error.message);
      }
    }
  }
  console.log(`  Bank/Payment Settings: ${result.siteSettings} created`);

  console.log("CMS Phase 2 seeding complete!");
  return result;
}
