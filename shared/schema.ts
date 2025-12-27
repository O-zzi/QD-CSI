import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN', 'SUPER_ADMIN']);
export const membershipTierEnum = pgEnum('membership_tier', ['FOUNDING', 'GOLD', 'SILVER', 'GUEST']);
export const membershipStatusEnum = pgEnum('membership_status', ['PENDING_PAYMENT', 'PENDING_VERIFICATION', 'ACTIVE', 'EXPIRED', 'SUSPENDED']);
export const bookingStatusEnum = pgEnum('booking_status', ['PENDING', 'CONFIRMED', 'CANCELLED']);
export const payerTypeEnum = pgEnum('payer_type', ['SELF', 'MEMBER']);
export const eventTypeEnum = pgEnum('event_type', ['ACADEMY', 'TOURNAMENT', 'CLASS', 'SOCIAL']);
export const facilityStatusEnum = pgEnum('facility_status', ['OPENING_SOON', 'PLANNED', 'ACTIVE']);
export const venueStatusEnum = pgEnum('venue_status', ['ACTIVE', 'COMING_SOON', 'PLANNED']);
export const constructionPhaseStatusEnum = pgEnum('construction_phase_status', ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE']);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING_PAYMENT', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED']);

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - Local authentication with Passport.js
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  role: userRoleEnum("role").default('USER').notNull(),
  isSafetyCertified: boolean("is_safety_certified").default(false),
  hasSignedWaiver: boolean("has_signed_waiver").default(false),
  creditBalance: integer("credit_balance").default(0),
  totalHoursPlayed: integer("total_hours_played").default(0),
  stripeCustomerId: varchar("stripe_customer_id"),
  
  // Email verification
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  
  // Password reset
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  
  // Account lockout (after failed login attempts)
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockoutUntil: timestamp("lockout_until"),
  
  // Terms & conditions acceptance
  termsAcceptedAt: timestamp("terms_accepted_at"),
  
  // Session tracking
  lastAuthenticatedAt: timestamp("last_authenticated_at"),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Memberships table
export const memberships = pgTable("memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  membershipNumber: varchar("membership_number").unique().notNull(),
  tier: membershipTierEnum("tier").default('GUEST').notNull(),
  validFrom: timestamp("valid_from").defaultNow().notNull(),
  validTo: timestamp("valid_to").notNull(),
  status: membershipStatusEnum("status").default('PENDING_PAYMENT').notNull(),
  guestPasses: integer("guest_passes").default(0),
  
  // Payment workflow tracking
  paymentReference: varchar("payment_reference"),
  paymentClaimedAt: timestamp("payment_claimed_at"),
  paymentVerifiedAt: timestamp("payment_verified_at"),
  paymentVerifiedBy: varchar("payment_verified_by").references(() => users.id),
  paymentRejectedReason: text("payment_rejected_reason"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Facilities table
export const facilities = pgTable("facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").unique().notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon"),
  category: varchar("category"),
  basePrice: integer("base_price").default(0).notNull(),
  minPlayers: integer("min_players").default(1),
  resourceCount: integer("resource_count").default(1),
  requiresCertification: boolean("requires_certification").default(false),
  isRestricted: boolean("is_restricted").default(false),
  isHidden: boolean("is_hidden").default(false),
  status: facilityStatusEnum("status").default('PLANNED'),
  imageUrl: varchar("image_url"),
  // Extended CMS fields
  aboutContent: text("about_content"),
  features: text("features").array(),
  amenities: text("amenities").array(),
  keywords: text("keywords").array(),
  quickInfo: jsonb("quick_info").$type<{ label: string; value: string; icon?: string }[]>(),
  pricingNotes: text("pricing_notes"),
  certificationInfo: text("certification_info"),
  galleryImages: text("gallery_images").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Facility Add-ons table
export const facilityAddOns = pgTable("facility_add_ons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => facilities.id, { onDelete: 'cascade' }),
  label: varchar("label").notNull(),
  price: integer("price").default(0).notNull(),
  icon: varchar("icon"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  facilityId: varchar("facility_id").notNull().references(() => facilities.id),
  venue: varchar("venue").default('Islamabad').notNull(),
  resourceId: integer("resource_id").default(1).notNull(),
  date: varchar("date").notNull(),
  startTime: varchar("start_time").notNull(),
  endTime: varchar("end_time").notNull(),
  durationMinutes: integer("duration_minutes").default(60).notNull(),
  status: bookingStatusEnum("status").default('PENDING').notNull(),
  paymentMethod: varchar("payment_method").default('cash'),
  payerType: payerTypeEnum("payer_type").default('SELF'),
  payerMembershipNumber: varchar("payer_membership_number"),
  basePrice: integer("base_price").default(0),
  discount: integer("discount").default(0),
  addOnTotal: integer("add_on_total").default(0),
  totalPrice: integer("total_price").default(0).notNull(),
  coachBooked: boolean("coach_booked").default(false),
  isMatchmaking: boolean("is_matchmaking").default(false),
  currentPlayers: integer("current_players").default(1),
  maxPlayers: integer("max_players").default(4),
  hallActivity: varchar("hall_activity"),
  stripeSessionId: varchar("stripe_session_id"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  paymentStatus: paymentStatusEnum("payment_status").default('PENDING_PAYMENT'),
  paymentProofUrl: varchar("payment_proof_url"),
  paymentVerifiedBy: varchar("payment_verified_by"),
  paymentVerifiedAt: timestamp("payment_verified_at"),
  paymentNotes: text("payment_notes"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Booking Add-ons table
export const bookingAddOns = pgTable("booking_add_ons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  addOnId: varchar("add_on_id").notNull(),
  label: varchar("label").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  pricePerUnit: integer("price_per_unit").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => facilities.id),
  title: varchar("title").notNull(),
  description: text("description"),
  type: eventTypeEnum("type").default('CLASS').notNull(),
  instructor: varchar("instructor"),
  scheduleDay: varchar("schedule_day"),
  scheduleTime: varchar("schedule_time"),
  scheduleDatetime: timestamp("schedule_datetime"),
  price: integer("price").default(0),
  capacity: integer("capacity").default(20),
  enrolledCount: integer("enrolled_count").default(0),
  enrollmentDeadline: timestamp("enrollment_deadline"),
  imageUrl: varchar("image_url"),
  slug: varchar("slug"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event Registrations table
export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  fullName: varchar("full_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  guestCount: integer("guest_count").default(0),
  notes: text("notes"),
  status: varchar("status").default('REGISTERED'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leaderboard table
export const leaderboard = pgTable("leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  facilityId: varchar("facility_id").references(() => facilities.id),
  score: integer("score").default(0),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  rankingPoints: integer("ranking_points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CMS Content table
export const cmsContent = pgTable("cms_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").unique().notNull(),
  title: varchar("title"),
  content: text("content"),
  metadata: jsonb("metadata"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gallery Images table
export const galleryImages = pgTable("gallery_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url").notNull(),
  category: varchar("category"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content"),
  category: varchar("category"),
  publishedAt: timestamp("published_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Time Slot Blocks (for admin to block slots)
export const timeSlotBlocks = pgTable("time_slot_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => facilities.id, { onDelete: 'cascade' }),
  resourceId: integer("resource_id").default(1),
  date: varchar("date").notNull(),
  startTime: varchar("start_time").notNull(),
  endTime: varchar("end_time").notNull(),
  reason: varchar("reason"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Membership Tier Definitions table - Dynamic tier types (replaces hardcoded enum)
export const membershipTierDefinitions = pgTable("membership_tier_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").unique().notNull(), // e.g., 'founding', 'gold', 'silver', 'bronze', 'guest'
  displayName: varchar("display_name").notNull(), // e.g., 'Founding Member', 'Gold', 'Silver'
  description: text("description"),
  color: varchar("color").default('#6B7280'), // Hex color for badges
  discountPercent: integer("discount_percent").default(0), // Off-peak discount percentage
  guestPassesIncluded: integer("guest_passes_included").default(0),
  benefits: text("benefits").array(), // Array of benefit strings
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pricing Tiers table
export const pricingTiers = pgTable("pricing_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  tier: membershipTierEnum("tier").notNull(),
  price: integer("price").default(0).notNull(),
  billingPeriod: varchar("billing_period").default('yearly'),
  benefits: text("benefits").array(),
  isPopular: boolean("is_popular").default(false),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  // Extended CMS fields
  tagline: varchar("tagline"),
  description: text("description"),
  isClosed: boolean("is_closed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Careers/Jobs table
export const careers = pgTable("careers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  department: varchar("department"),
  location: varchar("location").default('Islamabad'),
  type: varchar("type").default('Full-time'),
  description: text("description"),
  requirements: text("requirements"),
  salary: varchar("salary"),
  salaryHidden: boolean("salary_hidden").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Career Applications table
export const careerApplications = pgTable("career_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  careerId: varchar("career_id").references(() => careers.id, { onDelete: 'set null' }),
  fullName: varchar("full_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  coverLetter: text("cover_letter"),
  cvUrl: varchar("cv_url"),
  cvFileName: varchar("cv_file_name"),
  linkedinUrl: varchar("linkedin_url"),
  status: varchar("status").default('NEW'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contact Form Submissions table
export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  subject: varchar("subject"),
  message: text("message").notNull(),
  status: varchar("status").default('UNREAD'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Site Settings table (for editable contact emails, social URLs, etc)
export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").unique().notNull(),
  value: text("value"),
  type: varchar("type").default('text'),
  label: varchar("label"),
  category: varchar("category").default('general'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Site Images table (for managing images across the website)
export const siteImages = pgTable("site_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").unique(),
  imageUrl: text("image_url"),
  alt: varchar("alt"),
  title: varchar("title"),
  description: text("description"),
  page: varchar("page"), // 'landing', 'facilities', 'coming-soon', etc
  section: varchar("section"), // 'hero', 'gallery', 'facility-padel', etc
  dimensions: varchar("dimensions"), // recommended dimensions like '1920x1080'
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Navbar Items table (for editable navigation links)
export const navbarItems = pgTable("navbar_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  label: varchar("label").notNull(),
  href: varchar("href").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  target: varchar("target").default('_self'),
  requiresAuth: boolean("requires_auth").default(false),
  icon: varchar("icon"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rules/Policies table
export const rules = pgTable("rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  category: varchar("category"),
  content: text("content"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FAQ Categories table
export const faqCategories = pgTable("faq_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  icon: varchar("icon").default('help-circle'),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FAQ Items table
export const faqItems = pgTable("faq_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => faqCategories.id, { onDelete: 'cascade' }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Venues table
export const venues = pgTable("venues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").unique().notNull(),
  name: varchar("name").notNull(),
  city: varchar("city").notNull(),
  country: varchar("country").default('Pakistan'),
  status: venueStatusEnum("status").default('PLANNED'),
  isDefault: boolean("is_default").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Facility Venues table (many-to-many with per-venue status)
export const facilityVenues = pgTable("facility_venues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => facilities.id, { onDelete: 'cascade' }),
  venueId: varchar("venue_id").notNull().references(() => venues.id, { onDelete: 'cascade' }),
  status: venueStatusEnum("status").default('PLANNED'),
  resourceCount: integer("resource_count").default(1),
  priceOverride: integer("price_override"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Operating Hours table (for venue-specific time slots)
// Uniqueness enforced via (venueId, facilityId, dayOfWeek) - at least one of venueId/facilityId must be set
export const operatingHours = pgTable("operating_hours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: varchar("venue_id").references(() => venues.id, { onDelete: 'cascade' }),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: 'cascade' }),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  openTime: varchar("open_time").notNull(), // "10:00"
  closeTime: varchar("close_time").notNull(), // "22:00"
  slotDurationMinutes: integer("slot_duration_minutes").default(60),
  isHoliday: boolean("is_holiday").default(false),
  isClosed: boolean("is_closed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_operating_hours_venue_day").on(table.venueId, table.dayOfWeek),
  index("idx_operating_hours_facility_day").on(table.facilityId, table.dayOfWeek),
]);

// Peak Windows table (flexible peak/off-peak time segments for pricing)
export const peakWindows = pgTable("peak_windows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: varchar("venue_id").references(() => venues.id, { onDelete: 'cascade' }),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(), // "Morning Peak", "Evening Peak", "Off-Peak"
  dayOfWeek: integer("day_of_week"), // null = applies to all days
  startTime: varchar("start_time").notNull(), // "17:00"
  endTime: varchar("end_time").notNull(), // "22:00"
  isPeak: boolean("is_peak").default(true), // true = peak, false = off-peak
  discountDisabled: boolean("discount_disabled").default(false), // true = no tier discounts apply
  // Tier-based discount percentages (only apply during off-peak unless explicitly allowed)
  foundingDiscount: integer("founding_discount").default(25), // 25% for Founding members
  goldDiscount: integer("gold_discount").default(20), // 20% for Gold members
  silverDiscount: integer("silver_discount").default(10), // 10% for Silver members
  guestDiscount: integer("guest_discount").default(0), // 0% for Guests/non-members
  // Tier-based booking windows (days in advance)
  foundingBookingWindow: integer("founding_booking_window").default(14),
  goldBookingWindow: integer("gold_booking_window").default(7),
  silverBookingWindow: integer("silver_booking_window").default(5),
  guestBookingWindow: integer("guest_booking_window").default(2),
  seasonStart: timestamp("season_start"), // null = no seasonal restriction
  seasonEnd: timestamp("season_end"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Multipurpose Hall Activities table (linked to facility)
export const hallActivities = pgTable("hall_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  slug: varchar("slug").unique().notNull(),
  description: text("description"),
  icon: varchar("icon"),
  basePrice: integer("base_price").default(0),
  pricePerHour: integer("price_per_hour").default(0),
  minHours: integer("min_hours").default(1),
  maxHours: integer("max_hours").default(8),
  maxCapacity: integer("max_capacity"),
  minCapacity: integer("min_capacity").default(1),
  resourcesRequired: integer("resources_required").default(1), // how many hall resources needed
  requiresApproval: boolean("requires_approval").default(false),
  requiresDeposit: boolean("requires_deposit").default(false),
  depositAmount: integer("deposit_amount").default(0),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Construction Phases table
export const constructionPhases = pgTable("construction_phases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  label: varchar("label").notNull(),
  title: varchar("title").notNull(),
  status: constructionPhaseStatusEnum("status").default('NOT_STARTED'),
  progress: integer("progress").default(0),
  isActive: boolean("is_active").default(false),
  isComplete: boolean("is_complete").default(false),
  timeframe: varchar("timeframe"),
  milestones: jsonb("milestones").$type<string[]>().default([]),
  highlights: jsonb("highlights").$type<string[]>().default([]),
  icon: varchar("icon").default('clock'),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Site-wide CMS Pages table (for multi-page CMS)
export const cmsPages = pgTable("cms_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").unique().notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CMS Fields table (fields within each page/section)
export const cmsFields = pgTable("cms_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageSlug: varchar("page_slug").notNull(),
  section: varchar("section"),
  fieldKey: varchar("field_key").notNull(),
  fieldType: varchar("field_type").default('text'),
  label: varchar("label").notNull(),
  value: text("value"),
  metadata: jsonb("metadata"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table (in-app notifications for users)
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(), // 'booking', 'payment', 'membership', 'event', 'system'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  link: varchar("link"), // optional link to relevant page
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"), // additional data like bookingId, eventId, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin Audit Logs table (track admin actions)
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => users.id, { onDelete: 'set null' }),
  adminEmail: varchar("admin_email").notNull(),
  action: varchar("action").notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'VERIFY', 'REJECT', etc.
  resource: varchar("resource").notNull(), // 'booking', 'membership', 'user', 'cms', etc.
  resourceId: varchar("resource_id"),
  details: jsonb("details"), // JSON with before/after states or relevant data
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_audit_admin").on(table.adminId),
  index("idx_audit_resource").on(table.resource, table.resourceId),
  index("idx_audit_created").on(table.createdAt),
]);

// Blogs table (for blog posts)
export const blogs = pgTable("blogs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").unique().notNull(),
  title: varchar("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content"),
  featuredImageUrl: varchar("featured_image_url"),
  author: varchar("author"),
  category: varchar("category"),
  tags: text("tags").array(),
  readTimeMinutes: integer("read_time_minutes").default(5),
  publishedAt: timestamp("published_at"),
  isPublished: boolean("is_published").default(false),
  isFeatured: boolean("is_featured").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hero Sections table (for page hero banners)
export const heroSections = pgTable("hero_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  page: varchar("page").unique().notNull(), // 'landing', 'facilities', 'membership', 'events', etc.
  title: varchar("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  backgroundImageUrl: varchar("background_image_url"),
  backgroundVideoUrl: varchar("background_video_url"),
  overlayOpacity: integer("overlay_opacity").default(50), // 0-100
  ctaText: varchar("cta_text"),
  ctaLink: varchar("cta_link"),
  ctaSecondaryText: varchar("cta_secondary_text"),
  ctaSecondaryLink: varchar("cta_secondary_link"),
  alignment: varchar("alignment").default('center'), // 'left', 'center', 'right'
  height: varchar("height").default('large'), // 'small', 'medium', 'large', 'full'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CTAs (Call to Action) table
export const ctas = pgTable("ctas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").unique().notNull(), // 'landing-membership', 'footer-newsletter', etc.
  title: varchar("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  buttonText: varchar("button_text"),
  buttonLink: varchar("button_link"),
  secondaryButtonText: varchar("secondary_button_text"),
  secondaryButtonLink: varchar("secondary_button_link"),
  backgroundImageUrl: varchar("background_image_url"),
  backgroundColor: varchar("background_color"),
  style: varchar("style").default('default'), // 'default', 'gradient', 'image', 'minimal'
  page: varchar("page"), // which page this CTA appears on
  section: varchar("section"), // section within the page
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Testimonials table
export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  title: varchar("title"), // job title or role
  company: varchar("company"),
  avatarUrl: varchar("avatar_url"),
  quote: text("quote").notNull(),
  rating: integer("rating").default(5), // 1-5 stars
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: 'set null' }),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event Galleries table (for event/academy image galleries)
export const eventGalleries = pgTable("event_galleries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: 'cascade' }),
  imageUrl: varchar("image_url").notNull(),
  caption: text("caption"),
  altText: varchar("alt_text"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Membership Application Status Enum
export const membershipApplicationStatusEnum = pgEnum('membership_application_status', ['PENDING', 'APPROVED', 'REJECTED']);

// Membership Applications table (for payment verification workflow)
export const membershipApplications = pgTable("membership_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tierDesired: membershipTierEnum("tier_desired").notNull(),
  paymentMethod: varchar("payment_method").default('bank_transfer'),
  paymentAmount: integer("payment_amount").default(0),
  paymentProofUrl: varchar("payment_proof_url"),
  paymentReference: varchar("payment_reference"),
  status: membershipApplicationStatusEnum("status").default('PENDING'),
  adminNotes: text("admin_notes"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Certifications table (types of certifications available)
export const certifications = pgTable("certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").unique().notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: 'set null' }),
  validityMonths: integer("validity_months").default(12),
  requirements: text("requirements"),
  icon: varchar("icon"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Certification Classes table (scheduled classes for certification)
export const certificationClasses = pgTable("certification_classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  certificationId: varchar("certification_id").notNull().references(() => certifications.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  description: text("description"),
  instructor: varchar("instructor"),
  scheduledDate: timestamp("scheduled_date"),
  duration: integer("duration").default(60),
  capacity: integer("capacity").default(10),
  enrolledCount: integer("enrolled_count").default(0),
  price: integer("price").default(0),
  location: varchar("location"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Certification Class Enrollments table
export const certificationEnrollments = pgTable("certification_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull().references(() => certificationClasses.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar("status").default('ENROLLED'),
  completedAt: timestamp("completed_at"),
  score: integer("score"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Certifications table (issued certifications)
export const userCertifications = pgTable("user_certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  certificationId: varchar("certification_id").notNull().references(() => certifications.id, { onDelete: 'cascade' }),
  certificateNumber: varchar("certificate_number").unique(),
  issuedAt: timestamp("issued_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  status: varchar("status").default('ACTIVE'),
  issuedBy: varchar("issued_by").references(() => users.id),
  proofDocumentUrl: varchar("proof_document_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Page Content table (for CMS content on specific pages like Vision, About, etc.)
export const pageContent = pgTable("page_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  page: varchar("page").notNull(),
  section: varchar("section").notNull(),
  key: varchar("key").notNull(),
  title: varchar("title"),
  content: text("content"),
  icon: varchar("icon"),
  imageUrl: varchar("image_url"),
  metadata: jsonb("metadata"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comparison Features table (for membership comparison)
export const comparisonFeatures = pgTable("comparison_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  feature: varchar("feature").notNull(),
  foundingValue: varchar("founding_value"),
  goldValue: varchar("gold_value"),
  silverValue: varchar("silver_value"),
  guestValue: varchar("guest_value"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Member Benefits table (for "Why Become a Member" section)
export const memberBenefits = pgTable("member_benefits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icon: varchar("icon").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Career Benefits table (for "Why Work Here" section)
export const careerBenefits = pgTable("career_benefits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icon: varchar("icon").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  membership: one(memberships, {
    fields: [users.id],
    references: [memberships.userId],
  }),
  bookings: many(bookings),
  eventRegistrations: many(eventRegistrations),
  leaderboardEntries: many(leaderboard),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}));

export const facilitiesRelations = relations(facilities, ({ many }) => ({
  addOns: many(facilityAddOns),
  bookings: many(bookings),
  events: many(events),
  leaderboardEntries: many(leaderboard),
}));

export const facilityAddOnsRelations = relations(facilityAddOns, ({ one }) => ({
  facility: one(facilities, {
    fields: [facilityAddOns.facilityId],
    references: [facilities.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  facility: one(facilities, {
    fields: [bookings.facilityId],
    references: [facilities.id],
  }),
  addOns: many(bookingAddOns),
}));

export const bookingAddOnsRelations = relations(bookingAddOns, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingAddOns.bookingId],
    references: [bookings.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  facility: one(facilities, {
    fields: [events.facilityId],
    references: [facilities.id],
  }),
  registrations: many(eventRegistrations),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRegistrations.userId],
    references: [users.id],
  }),
}));

export const leaderboardRelations = relations(leaderboard, ({ one }) => ({
  user: one(users, {
    fields: [leaderboard.userId],
    references: [users.id],
  }),
  facility: one(facilities, {
    fields: [leaderboard.facilityId],
    references: [facilities.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  phone: true,
  dateOfBirth: true,
  profileImageUrl: true,
  role: true,
  isSafetyCertified: true,
  hasSignedWaiver: true,
}).partial();

export const insertMembershipSchema = createInsertSchema(memberships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFacilitySchema = createInsertSchema(facilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCmsContentSchema = createInsertSchema(cmsContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

export const insertGalleryImageSchema = createInsertSchema(galleryImages).omit({
  id: true,
  createdAt: true,
});

export const insertMembershipTierDefinitionSchema = createInsertSchema(membershipTierDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPricingTierSchema = createInsertSchema(pricingTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCareerSchema = createInsertSchema(careers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRuleSchema = createInsertSchema(rules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFaqCategorySchema = createInsertSchema(faqCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFaqItemSchema = createInsertSchema(faqItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFacilityVenueSchema = createInsertSchema(facilityVenues).omit({
  id: true,
  createdAt: true,
});

export const insertOperatingHoursSchema = createInsertSchema(operatingHours).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPeakWindowSchema = createInsertSchema(peakWindows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHallActivitySchema = createInsertSchema(hallActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConstructionPhaseSchema = createInsertSchema(constructionPhases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCmsPageSchema = createInsertSchema(cmsPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCmsFieldSchema = createInsertSchema(cmsFields).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({
  id: true,
  createdAt: true,
});

export const insertCareerApplicationSchema = createInsertSchema(careerApplications).omit({
  id: true,
  createdAt: true,
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({
  id: true,
  createdAt: true,
});

export const insertSiteImageSchema = createInsertSchema(siteImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNavbarItemSchema = createInsertSchema(navbarItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertFacilityAddOnSchema = createInsertSchema(facilityAddOns).omit({
  id: true,
  createdAt: true,
});

export const insertBlogSchema = createInsertSchema(blogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHeroSectionSchema = createInsertSchema(heroSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCtaSchema = createInsertSchema(ctas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventGallerySchema = createInsertSchema(eventGalleries).omit({
  id: true,
  createdAt: true,
});

export const insertMembershipApplicationSchema = createInsertSchema(membershipApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCertificationClassSchema = createInsertSchema(certificationClasses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCertificationEnrollmentSchema = createInsertSchema(certificationEnrollments).omit({
  id: true,
  createdAt: true,
});

export const insertUserCertificationSchema = createInsertSchema(userCertifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPageContentSchema = createInsertSchema(pageContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComparisonFeatureSchema = createInsertSchema(comparisonFeatures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMemberBenefitSchema = createInsertSchema(memberBenefits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCareerBenefitSchema = createInsertSchema(careerBenefits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;

export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;

export type FacilityAddOn = typeof facilityAddOns.$inferSelect;
export type InsertFacilityAddOn = z.infer<typeof insertFacilityAddOnSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type BookingAddOn = typeof bookingAddOns.$inferSelect;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type EventRegistration = typeof eventRegistrations.$inferSelect;

export type LeaderboardEntry = typeof leaderboard.$inferSelect;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardSchema>;

export type CmsContent = typeof cmsContent.$inferSelect;
export type InsertCmsContent = z.infer<typeof insertCmsContentSchema>;

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export type GalleryImage = typeof galleryImages.$inferSelect;
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;

export type TimeSlotBlock = typeof timeSlotBlocks.$inferSelect;

export type MembershipTierDefinition = typeof membershipTierDefinitions.$inferSelect;
export type InsertMembershipTierDefinition = z.infer<typeof insertMembershipTierDefinitionSchema>;

export type PricingTier = typeof pricingTiers.$inferSelect;
export type InsertPricingTier = z.infer<typeof insertPricingTierSchema>;

export type Career = typeof careers.$inferSelect;
export type InsertCareer = z.infer<typeof insertCareerSchema>;

export type Rule = typeof rules.$inferSelect;
export type InsertRule = z.infer<typeof insertRuleSchema>;

export type FaqCategory = typeof faqCategories.$inferSelect;
export type InsertFaqCategory = z.infer<typeof insertFaqCategorySchema>;

export type FaqItem = typeof faqItems.$inferSelect;
export type InsertFaqItem = z.infer<typeof insertFaqItemSchema>;

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;

export type FacilityVenue = typeof facilityVenues.$inferSelect;
export type InsertFacilityVenue = z.infer<typeof insertFacilityVenueSchema>;

export type OperatingHours = typeof operatingHours.$inferSelect;
export type InsertOperatingHours = z.infer<typeof insertOperatingHoursSchema>;

export type PeakWindow = typeof peakWindows.$inferSelect;
export type InsertPeakWindow = z.infer<typeof insertPeakWindowSchema>;

export type HallActivity = typeof hallActivities.$inferSelect;
export type InsertHallActivity = z.infer<typeof insertHallActivitySchema>;

export type ConstructionPhase = typeof constructionPhases.$inferSelect;
export type InsertConstructionPhase = z.infer<typeof insertConstructionPhaseSchema>;

export type CmsPage = typeof cmsPages.$inferSelect;
export type InsertCmsPage = z.infer<typeof insertCmsPageSchema>;

export type CmsField = typeof cmsFields.$inferSelect;
export type InsertCmsField = z.infer<typeof insertCmsFieldSchema>;

export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;

export type CareerApplication = typeof careerApplications.$inferSelect;
export type InsertCareerApplication = z.infer<typeof insertCareerApplicationSchema>;

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;

export type SiteImage = typeof siteImages.$inferSelect;
export type InsertSiteImage = z.infer<typeof insertSiteImageSchema>;

export type NavbarItem = typeof navbarItems.$inferSelect;
export type InsertNavbarItem = z.infer<typeof insertNavbarItemSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;

export type Blog = typeof blogs.$inferSelect;
export type InsertBlog = z.infer<typeof insertBlogSchema>;

export type HeroSection = typeof heroSections.$inferSelect;
export type InsertHeroSection = z.infer<typeof insertHeroSectionSchema>;

export type Cta = typeof ctas.$inferSelect;
export type InsertCta = z.infer<typeof insertCtaSchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export type EventGallery = typeof eventGalleries.$inferSelect;
export type InsertEventGallery = z.infer<typeof insertEventGallerySchema>;

export type MembershipApplication = typeof membershipApplications.$inferSelect;
export type InsertMembershipApplication = z.infer<typeof insertMembershipApplicationSchema>;

export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;

export type CertificationClass = typeof certificationClasses.$inferSelect;
export type InsertCertificationClass = z.infer<typeof insertCertificationClassSchema>;

export type CertificationEnrollment = typeof certificationEnrollments.$inferSelect;
export type InsertCertificationEnrollment = z.infer<typeof insertCertificationEnrollmentSchema>;

export type UserCertification = typeof userCertifications.$inferSelect;
export type InsertUserCertification = z.infer<typeof insertUserCertificationSchema>;

export type PageContent = typeof pageContent.$inferSelect;
export type InsertPageContent = z.infer<typeof insertPageContentSchema>;

export type ComparisonFeature = typeof comparisonFeatures.$inferSelect;
export type InsertComparisonFeature = z.infer<typeof insertComparisonFeatureSchema>;

export type MemberBenefit = typeof memberBenefits.$inferSelect;
export type InsertMemberBenefit = z.infer<typeof insertMemberBenefitSchema>;

export type CareerBenefit = typeof careerBenefits.$inferSelect;
export type InsertCareerBenefit = z.infer<typeof insertCareerBenefitSchema>;
