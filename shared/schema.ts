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
export const membershipStatusEnum = pgEnum('membership_status', ['ACTIVE', 'EXPIRED', 'SUSPENDED']);
export const bookingStatusEnum = pgEnum('booking_status', ['PENDING', 'CONFIRMED', 'CANCELLED']);
export const payerTypeEnum = pgEnum('payer_type', ['SELF', 'MEMBER']);
export const eventTypeEnum = pgEnum('event_type', ['ACADEMY', 'TOURNAMENT', 'CLASS', 'SOCIAL']);
export const facilityStatusEnum = pgEnum('facility_status', ['OPENING_SOON', 'PLANNED', 'ACTIVE']);

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

// Users table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
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
  status: membershipStatusEnum("status").default('ACTIVE').notNull(),
  guestPasses: integer("guest_passes").default(0),
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
  status: facilityStatusEnum("status").default('PLANNED'),
  imageUrl: varchar("image_url"),
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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;

export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;

export type FacilityAddOn = typeof facilityAddOns.$inferSelect;

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
