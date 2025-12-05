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
  type Announcement,
  type GalleryImage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

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
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(bookingId: string, status: string): Promise<Booking | undefined>;
  checkDoubleBooking(facilityId: string, resourceId: number, date: string, startTime: string): Promise<boolean>;

  // Event operations
  getEvents(): Promise<Event[]>;
  getEventsByFacility(facilityId: string): Promise<Event[]>;

  // Leaderboard operations
  getLeaderboard(facilityId?: string): Promise<LeaderboardEntry[]>;

  // CMS operations
  getCmsContent(key: string): Promise<CmsContent | undefined>;
  getAnnouncements(): Promise<Announcement[]>;
  getGalleryImages(): Promise<GalleryImage[]>;
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
    facilityId: string,
    resourceId: number,
    date: string,
    startTime: string
  ): Promise<boolean> {
    const existing = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.facilityId, facilityId),
          eq(bookings.resourceId, resourceId),
          eq(bookings.date, date),
          eq(bookings.startTime, startTime)
        )
      );
    return existing.length > 0;
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

  // Leaderboard operations
  async getLeaderboard(facilityId?: string): Promise<LeaderboardEntry[]> {
    if (facilityId) {
      return await db
        .select()
        .from(leaderboard)
        .where(eq(leaderboard.facilityId, facilityId))
        .orderBy(desc(leaderboard.rankingPoints))
        .limit(10);
    }
    return await db
      .select()
      .from(leaderboard)
      .orderBy(desc(leaderboard.rankingPoints))
      .limit(10);
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
}

export const storage = new DatabaseStorage();
