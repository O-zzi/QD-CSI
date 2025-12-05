import {
  users,
  memberships,
  facilities,
  facilityAddOns,
  bookings,
  bookingAddOns,
  events,
  eventRegistrations,
  leaderboard,
  cmsContent,
  announcements,
  galleryImages,
  timeSlotBlocks,
  pricingTiers,
  careers,
  rules,
  type User,
  type UpsertUser,
  type Membership,
  type InsertMembership,
  type Facility,
  type InsertFacility,
  type FacilityAddOn,
  type Booking,
  type InsertBooking,
  type Event,
  type InsertEvent,
  type LeaderboardEntry,
  type CmsContent,
  type InsertCmsContent,
  type Announcement,
  type InsertAnnouncement,
  type GalleryImage,
  type InsertGalleryImage,
  type PricingTier,
  type InsertPricingTier,
  type Career,
  type InsertCareer,
  type Rule,
  type InsertRule,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Membership operations
  getMembership(userId: string): Promise<Membership | undefined>;
  getMembershipByNumber(number: string): Promise<Membership | undefined>;
  createMembership(membership: InsertMembership): Promise<Membership>;

  // Facility operations
  getFacilities(): Promise<Facility[]>;
  getFacilityBySlug(slug: string): Promise<Facility | undefined>;
  getFacilityAddOns(facilityId: string): Promise<FacilityAddOn[]>;

  // Booking operations
  getBookings(userId: string): Promise<Booking[]>;
  getBookingsByDate(facilityId: string, date: string): Promise<Booking[]>;
  getBookingByStripeSessionId(sessionId: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  createBookingAddOn(data: { bookingId: string; addOnId: string; quantity: number; priceAtBooking: number }): Promise<any>;
  updateBookingStatus(bookingId: string, status: string): Promise<Booking | undefined>;
  checkDoubleBooking(facilitySlug: string, resourceId: number, date: string, startTime: string, endTime: string): Promise<boolean>;
  
  // User update
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Event operations
  getEvents(): Promise<Event[]>;
  getEventsByFacility(facilityId: string): Promise<Event[]>;

  // Leaderboard operations
  getLeaderboard(facilityId?: string): Promise<LeaderboardEntry[]>;

  // CMS operations
  getCmsContent(key: string): Promise<CmsContent | undefined>;
  getAllCmsContent(): Promise<CmsContent[]>;
  upsertCmsContent(data: InsertCmsContent): Promise<CmsContent>;
  deleteCmsContent(id: string): Promise<void>;
  
  getAnnouncements(): Promise<Announcement[]>;
  getAllAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(data: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<void>;
  
  getGalleryImages(): Promise<GalleryImage[]>;
  getAllGalleryImages(): Promise<GalleryImage[]>;
  createGalleryImage(data: InsertGalleryImage): Promise<GalleryImage>;
  updateGalleryImage(id: string, data: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined>;
  deleteGalleryImage(id: string): Promise<void>;
  
  // Pricing tiers operations
  getPricingTiers(): Promise<PricingTier[]>;
  createPricingTier(data: InsertPricingTier): Promise<PricingTier>;
  updatePricingTier(id: string, data: Partial<InsertPricingTier>): Promise<PricingTier | undefined>;
  deletePricingTier(id: string): Promise<void>;
  
  // Career operations
  getCareers(): Promise<Career[]>;
  getActiveCarers(): Promise<Career[]>;
  createCareer(data: InsertCareer): Promise<Career>;
  updateCareer(id: string, data: Partial<InsertCareer>): Promise<Career | undefined>;
  deleteCareer(id: string): Promise<void>;
  
  // Rules operations
  getRules(): Promise<Rule[]>;
  getActiveRules(): Promise<Rule[]>;
  createRule(data: InsertRule): Promise<Rule>;
  updateRule(id: string, data: Partial<InsertRule>): Promise<Rule | undefined>;
  deleteRule(id: string): Promise<void>;
  
  // Facility admin operations
  createFacility(data: InsertFacility): Promise<Facility>;
  updateFacility(id: string, data: Partial<InsertFacility>): Promise<Facility | undefined>;
  deleteFacility(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Membership operations
  async getMembership(userId: string): Promise<Membership | undefined> {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId));
    return membership;
  }

  async getMembershipByNumber(number: string): Promise<Membership | undefined> {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.membershipNumber, number));
    return membership;
  }

  async createMembership(membership: InsertMembership): Promise<Membership> {
    const [created] = await db.insert(memberships).values(membership).returning();
    return created;
  }

  // Facility operations
  async getFacilities(): Promise<Facility[]> {
    return await db.select().from(facilities).orderBy(asc(facilities.name));
  }

  async getFacilityBySlug(slug: string): Promise<Facility | undefined> {
    const [facility] = await db
      .select()
      .from(facilities)
      .where(eq(facilities.slug, slug));
    return facility;
  }

  async getFacilityAddOns(facilityId: string): Promise<FacilityAddOn[]> {
    return await db
      .select()
      .from(facilityAddOns)
      .where(eq(facilityAddOns.facilityId, facilityId));
  }

  // Booking operations
  async getBookings(userId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
  }

  async getBookingsByDate(facilityId: string, date: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.facilityId, facilityId), eq(bookings.date, date)));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [created] = await db.insert(bookings).values(booking).returning();
    return created;
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<Booking | undefined> {
    const [updated] = await db
      .update(bookings)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
      .returning();
    return updated;
  }

  async checkDoubleBooking(
    facilitySlug: string,
    resourceId: number,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const facility = await this.getFacilityBySlug(facilitySlug);
    if (!facility) return false;
    
    const existing = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.facilityId, facility.id),
          eq(bookings.resourceId, resourceId),
          eq(bookings.date, date),
          eq(bookings.startTime, startTime)
        )
      );
    return existing.length > 0;
  }

  async getBookingByStripeSessionId(sessionId: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.stripeSessionId, sessionId));
    return booking;
  }

  async createBookingAddOn(data: { bookingId: string; addOnId: string; quantity: number; priceAtBooking: number }): Promise<any> {
    const [created] = await db
      .insert(bookingAddOns)
      .values({
        bookingId: data.bookingId,
        addOnId: data.addOnId,
        quantity: data.quantity,
        priceAtBooking: data.priceAtBooking,
      })
      .returning();
    return created;
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.isActive, true));
  }

  async getEventsByFacility(facilityId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(and(eq(events.facilityId, facilityId), eq(events.isActive, true)));
  }

  // Leaderboard operations - returns entries with player info
  async getLeaderboard(facilityId?: string): Promise<any[]> {
    const query = db
      .select({
        id: leaderboard.id,
        userId: leaderboard.userId,
        facilityId: leaderboard.facilityId,
        score: leaderboard.score,
        wins: leaderboard.wins,
        losses: leaderboard.losses,
        rankingPoints: leaderboard.rankingPoints,
        playerName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        profileImageUrl: users.profileImageUrl,
        winRate: sql<number>`CASE WHEN (${leaderboard.wins} + ${leaderboard.losses}) > 0 
          THEN ${leaderboard.wins}::float / (${leaderboard.wins} + ${leaderboard.losses}) 
          ELSE 0 END`,
      })
      .from(leaderboard)
      .leftJoin(users, eq(leaderboard.userId, users.id))
      .orderBy(desc(leaderboard.rankingPoints))
      .limit(10);

    if (facilityId) {
      return await query.where(eq(leaderboard.facilityId, facilityId));
    }
    return await query;
  }

  // CMS operations
  async getCmsContent(key: string): Promise<CmsContent | undefined> {
    const [content] = await db
      .select()
      .from(cmsContent)
      .where(eq(cmsContent.key, key));
    return content;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .where(eq(announcements.isActive, true))
      .orderBy(desc(announcements.publishedAt));
  }

  async getGalleryImages(): Promise<GalleryImage[]> {
    return await db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.isActive, true))
      .orderBy(asc(galleryImages.sortOrder));
  }

  // Admin CMS operations
  async getAllCmsContent(): Promise<CmsContent[]> {
    return await db.select().from(cmsContent).orderBy(asc(cmsContent.sortOrder));
  }

  async upsertCmsContent(data: InsertCmsContent): Promise<CmsContent> {
    const [content] = await db
      .insert(cmsContent)
      .values(data)
      .onConflictDoUpdate({
        target: cmsContent.key,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return content;
  }

  async deleteCmsContent(id: string): Promise<void> {
    await db.delete(cmsContent).where(eq(cmsContent.id, id));
  }

  // Admin Announcements operations
  async getAllAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.publishedAt));
  }

  async createAnnouncement(data: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values(data).returning();
    return announcement;
  }

  async updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const [updated] = await db
      .update(announcements)
      .set(data)
      .where(eq(announcements.id, id))
      .returning();
    return updated;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  // Admin Gallery operations
  async getAllGalleryImages(): Promise<GalleryImage[]> {
    return await db.select().from(galleryImages).orderBy(asc(galleryImages.sortOrder));
  }

  async createGalleryImage(data: InsertGalleryImage): Promise<GalleryImage> {
    const [image] = await db.insert(galleryImages).values(data).returning();
    return image;
  }

  async updateGalleryImage(id: string, data: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined> {
    const [updated] = await db
      .update(galleryImages)
      .set(data)
      .where(eq(galleryImages.id, id))
      .returning();
    return updated;
  }

  async deleteGalleryImage(id: string): Promise<void> {
    await db.delete(galleryImages).where(eq(galleryImages.id, id));
  }

  // Pricing Tiers operations
  async getPricingTiers(): Promise<PricingTier[]> {
    return await db.select().from(pricingTiers).orderBy(asc(pricingTiers.sortOrder));
  }

  async createPricingTier(data: InsertPricingTier): Promise<PricingTier> {
    const [tier] = await db.insert(pricingTiers).values(data).returning();
    return tier;
  }

  async updatePricingTier(id: string, data: Partial<InsertPricingTier>): Promise<PricingTier | undefined> {
    const [updated] = await db
      .update(pricingTiers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pricingTiers.id, id))
      .returning();
    return updated;
  }

  async deletePricingTier(id: string): Promise<void> {
    await db.delete(pricingTiers).where(eq(pricingTiers.id, id));
  }

  // Career operations
  async getCareers(): Promise<Career[]> {
    return await db.select().from(careers).orderBy(desc(careers.createdAt));
  }

  async getActiveCarers(): Promise<Career[]> {
    return await db.select().from(careers).where(eq(careers.isActive, true)).orderBy(desc(careers.createdAt));
  }

  async createCareer(data: InsertCareer): Promise<Career> {
    const [career] = await db.insert(careers).values(data).returning();
    return career;
  }

  async updateCareer(id: string, data: Partial<InsertCareer>): Promise<Career | undefined> {
    const [updated] = await db
      .update(careers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(careers.id, id))
      .returning();
    return updated;
  }

  async deleteCareer(id: string): Promise<void> {
    await db.delete(careers).where(eq(careers.id, id));
  }

  // Rules operations
  async getRules(): Promise<Rule[]> {
    return await db.select().from(rules).orderBy(asc(rules.sortOrder));
  }

  async getActiveRules(): Promise<Rule[]> {
    return await db.select().from(rules).where(eq(rules.isActive, true)).orderBy(asc(rules.sortOrder));
  }

  async createRule(data: InsertRule): Promise<Rule> {
    const [rule] = await db.insert(rules).values(data).returning();
    return rule;
  }

  async updateRule(id: string, data: Partial<InsertRule>): Promise<Rule | undefined> {
    const [updated] = await db
      .update(rules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(rules.id, id))
      .returning();
    return updated;
  }

  async deleteRule(id: string): Promise<void> {
    await db.delete(rules).where(eq(rules.id, id));
  }

  // Facility admin operations
  async createFacility(data: InsertFacility): Promise<Facility> {
    const [facility] = await db.insert(facilities).values(data).returning();
    return facility;
  }

  async updateFacility(id: string, data: Partial<InsertFacility>): Promise<Facility | undefined> {
    const [updated] = await db
      .update(facilities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(facilities.id, id))
      .returning();
    return updated;
  }

  async deleteFacility(id: string): Promise<void> {
    await db.delete(facilities).where(eq(facilities.id, id));
  }
}

export const storage = new DatabaseStorage();
