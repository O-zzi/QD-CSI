import { db } from "../server/db";
import {
  users,
  memberships,
  facilities,
  facilityAddOns,
  events,
  leaderboard,
  announcements,
  galleryImages,
  cmsContent,
} from "../shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Seed Facilities
  const [padel] = await db.insert(facilities).values({
    slug: "padel-tennis",
    name: "Padel Tennis",
    description: "State-of-the-art padel courts with professional lighting and equipment",
    icon: "target",
    category: "racquet",
    basePrice: 6000,
    minPlayers: 4,
    resourceCount: 4,
    requiresCertification: false,
    isRestricted: false,
    status: "ACTIVE",
  }).onConflictDoNothing().returning();

  const [squash] = await db.insert(facilities).values({
    slug: "squash",
    name: "Squash Courts",
    description: "Professional squash courts with glass back walls",
    icon: "dumbbell",
    category: "racquet",
    basePrice: 4000,
    minPlayers: 2,
    resourceCount: 2,
    requiresCertification: false,
    isRestricted: false,
    status: "ACTIVE",
  }).onConflictDoNothing().returning();

  const [rifle] = await db.insert(facilities).values({
    slug: "air-rifle-range",
    name: "Air Rifle Range",
    description: "10m air rifle shooting range with Olympic-standard equipment",
    icon: "crosshair",
    category: "shooting",
    basePrice: 6000,
    minPlayers: 1,
    resourceCount: 6,
    requiresCertification: true,
    isRestricted: false,
    status: "ACTIVE",
  }).onConflictDoNothing().returning();

  const [bridge] = await db.insert(facilities).values({
    slug: "bridge-room",
    name: "Bridge Room",
    description: "Elegant card room for bridge enthusiasts",
    icon: "spade",
    category: "cards",
    basePrice: 0,
    minPlayers: 4,
    resourceCount: 5,
    requiresCertification: false,
    isRestricted: true,
    status: "ACTIVE",
  }).onConflictDoNothing().returning();

  const [hall] = await db.insert(facilities).values({
    slug: "multipurpose-hall",
    name: "Multipurpose Hall",
    description: "Versatile 500-capacity hall for corporate events, fitness classes, and private functions",
    icon: "building",
    category: "venue",
    basePrice: 6000,
    minPlayers: 10,
    resourceCount: 1,
    requiresCertification: false,
    isRestricted: false,
    status: "ACTIVE",
  }).onConflictDoNothing().returning();

  console.log("Facilities seeded:", { padel, squash, rifle, bridge, hall });

  // Seed Facility Add-ons
  if (padel) {
    await db.insert(facilityAddOns).values([
      { facilityId: padel.id, label: "Equipment Rental", price: 500, icon: "racquet" },
      { facilityId: padel.id, label: "Mineral Water", price: 100, icon: "water" },
      { facilityId: padel.id, label: "Sports Drink", price: 200, icon: "bottle" },
    ]).onConflictDoNothing();
  }

  if (squash) {
    await db.insert(facilityAddOns).values([
      { facilityId: squash.id, label: "Racquet Rental", price: 300, icon: "racquet" },
      { facilityId: squash.id, label: "Ball (3 pack)", price: 150, icon: "ball" },
    ]).onConflictDoNothing();
  }

  if (rifle) {
    await db.insert(facilityAddOns).values([
      { facilityId: rifle.id, label: "Pellets (100)", price: 500, icon: "ammo" },
      { facilityId: rifle.id, label: "Target Paper (10)", price: 200, icon: "target" },
    ]).onConflictDoNothing();
  }

  console.log("Facility add-ons seeded");

  // Seed Demo Users and Memberships
  const demoUsers = [
    { id: "demo-001", firstName: "Ahmed", lastName: "Khan", email: "ahmed.khan@example.com" },
    { id: "demo-002", firstName: "Sara", lastName: "Ali", email: "sara.ali@example.com" },
    { id: "demo-003", firstName: "Bilal", lastName: "Hassan", email: "bilal.hassan@example.com" },
    { id: "demo-004", firstName: "Fatima", lastName: "Malik", email: "fatima.malik@example.com" },
    { id: "demo-005", firstName: "Omar", lastName: "Raza", email: "omar.raza@example.com" },
  ];

  for (const u of demoUsers) {
    await db.insert(users).values(u).onConflictDoNothing();
  }

  const membershipData = [
    { userId: "demo-001", membershipNumber: "QD-0001", tier: "FOUNDING" as const },
    { userId: "demo-002", membershipNumber: "QD-0002", tier: "GOLD" as const },
    { userId: "demo-003", membershipNumber: "QD-0003", tier: "GOLD" as const },
    { userId: "demo-004", membershipNumber: "QD-0004", tier: "SILVER" as const },
    { userId: "demo-005", membershipNumber: "QD-0005", tier: "SILVER" as const },
  ];

  const validTo = new Date();
  validTo.setFullYear(validTo.getFullYear() + 1);

  for (const m of membershipData) {
    await db.insert(memberships).values({
      ...m,
      validFrom: new Date(),
      validTo,
      status: "ACTIVE",
      guestPasses: m.tier === "FOUNDING" ? 12 : m.tier === "GOLD" ? 6 : 3,
    }).onConflictDoNothing();
  }

  console.log("Demo users and memberships seeded");

  // Seed Events
  if (padel) {
    await db.insert(events).values([
      {
        facilityId: padel.id,
        title: "Padel Beginner Academy",
        description: "Learn the fundamentals of padel with our certified coaches",
        type: "ACADEMY",
        instructor: "Coach Ahmad",
        scheduleDay: "Saturday",
        scheduleTime: "10:00 AM",
        price: 15000,
        capacity: 12,
        enrolledCount: 8,
        isActive: true,
      },
      {
        facilityId: padel.id,
        title: "Monthly Padel Tournament",
        description: "Compete against other members in our monthly tournament",
        type: "TOURNAMENT",
        scheduleDay: "Last Sunday",
        scheduleTime: "2:00 PM",
        price: 5000,
        capacity: 32,
        enrolledCount: 24,
        isActive: true,
      },
    ]).onConflictDoNothing();
  }

  if (squash) {
    await db.insert(events).values([
      {
        facilityId: squash.id,
        title: "Squash Pro Clinic",
        description: "Advanced techniques from professional squash players",
        type: "CLASS",
        instructor: "Pro Coach Zain",
        scheduleDay: "Wednesday",
        scheduleTime: "6:00 PM",
        price: 8000,
        capacity: 8,
        enrolledCount: 6,
        isActive: true,
      },
    ]).onConflictDoNothing();
  }

  if (rifle) {
    await db.insert(events).values([
      {
        facilityId: rifle.id,
        title: "Air Rifle Safety Course",
        description: "Mandatory safety certification for range access",
        type: "CLASS",
        instructor: "Range Master Ali",
        scheduleDay: "Tuesday & Thursday",
        scheduleTime: "4:00 PM",
        price: 3000,
        capacity: 6,
        enrolledCount: 4,
        isActive: true,
      },
    ]).onConflictDoNothing();
  }

  console.log("Events seeded");

  // Seed Leaderboard
  if (padel) {
    await db.insert(leaderboard).values([
      { userId: "demo-001", facilityId: padel.id, wins: 42, losses: 8, rankingPoints: 2450, score: 2450 },
      { userId: "demo-002", facilityId: padel.id, wins: 35, losses: 12, rankingPoints: 2180, score: 2180 },
      { userId: "demo-003", facilityId: padel.id, wins: 28, losses: 15, rankingPoints: 1920, score: 1920 },
    ]).onConflictDoNothing();
  }

  if (squash) {
    await db.insert(leaderboard).values([
      { userId: "demo-004", facilityId: squash.id, wins: 38, losses: 10, rankingPoints: 2320, score: 2320 },
      { userId: "demo-005", facilityId: squash.id, wins: 25, losses: 18, rankingPoints: 1680, score: 1680 },
    ]).onConflictDoNothing();
  }

  console.log("Leaderboard seeded");

  // Seed Announcements
  await db.insert(announcements).values([
    {
      title: "Grand Opening Celebration",
      content: "Join us for the grand opening of The Quarterdeck Sports Complex! Special discounts for founding members.",
      category: "general",
      isActive: true,
    },
    {
      title: "New Padel Courts Now Open",
      content: "We're excited to announce the opening of two new padel courts with enhanced lighting and facilities.",
      category: "facilities",
      isActive: true,
    },
    {
      title: "Holiday Schedule",
      content: "Modified operating hours during the upcoming holiday season. Please check the schedule for details.",
      category: "schedule",
      isActive: true,
    },
  ]).onConflictDoNothing();

  console.log("Announcements seeded");

  // Seed Gallery Images
  await db.insert(galleryImages).values([
    { title: "Padel Courts", description: "Our world-class padel facilities", imageUrl: "/images/padel-court.jpg", category: "facilities", sortOrder: 1, isActive: true },
    { title: "Squash Arena", description: "Professional glass-back squash courts", imageUrl: "/images/squash-court.jpg", category: "facilities", sortOrder: 2, isActive: true },
    { title: "Air Rifle Range", description: "Olympic-standard shooting range", imageUrl: "/images/rifle-range.jpg", category: "facilities", sortOrder: 3, isActive: true },
    { title: "Tournament Winners", description: "Champions of our monthly tournament", imageUrl: "/images/tournament.jpg", category: "events", sortOrder: 4, isActive: true },
    { title: "Community Event", description: "Members enjoying a social gathering", imageUrl: "/images/community.jpg", category: "events", sortOrder: 5, isActive: true },
  ]).onConflictDoNothing();

  console.log("Gallery images seeded");

  // Seed CMS Content
  await db.insert(cmsContent).values([
    {
      key: "hero_title",
      title: "Welcome to The Quarterdeck",
      content: "Pakistan's Premier Sports & Recreation Complex",
      isActive: true,
    },
    {
      key: "about_us",
      title: "About The Quarterdeck",
      content: "The Quarterdeck is Islamabad's most exclusive sports and recreation complex, offering world-class facilities for padel tennis, squash, air rifle shooting, bridge, and more. Our mission is to promote an active lifestyle and build a vibrant community of sports enthusiasts.",
      isActive: true,
    },
    {
      key: "contact_info",
      title: "Contact Information",
      content: JSON.stringify({
        address: "F-7/4, Islamabad, Pakistan",
        phone: "+92 51 1234567",
        email: "info@quarterdeck.pk",
        hours: "6:00 AM - 10:00 PM Daily",
      }),
      isActive: true,
    },
  ]).onConflictDoNothing();

  console.log("CMS content seeded");

  console.log("Database seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
