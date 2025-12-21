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
  venues,
  facilityVenues,
  constructionPhases,
  cmsPages,
  cmsFields,
  careerApplications,
  contactSubmissions,
  siteSettings,
  siteImages,
  navbarItems,
  operatingHours,
  peakWindows,
  hallActivities,
  notifications,
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
  type EventRegistration,
  type InsertEventRegistration,
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
  type Venue,
  type InsertVenue,
  type FacilityVenue,
  type InsertFacilityVenue,
  type ConstructionPhase,
  type InsertConstructionPhase,
  type CmsField,
  type InsertCmsField,
  type CareerApplication,
  type InsertCareerApplication,
  type ContactSubmission,
  type InsertContactSubmission,
  type SiteSetting,
  type InsertSiteSetting,
  type SiteImage,
  type InsertSiteImage,
  type NavbarItem,
  type InsertNavbarItem,
  type OperatingHours,
  type InsertOperatingHours,
  type PeakWindow,
  type InsertPeakWindow,
  type HallActivity,
  type InsertHallActivity,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserActivity(userId: string): Promise<void>;

  // Membership operations
  getMembership(userId: string): Promise<Membership | undefined>;
  getMembershipByNumber(number: string): Promise<Membership | undefined>;
  createMembership(membership: InsertMembership): Promise<Membership>;

  // Facility operations
  getFacilities(): Promise<Facility[]>;
  getFacility(id: string): Promise<Facility | undefined>;
  getFacilityBySlug(slug: string): Promise<Facility | undefined>;
  getFacilityAddOns(facilityId: string): Promise<FacilityAddOn[]>;

  // Booking operations
  getBookings(userId: string): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking | undefined>;
  getBookingsByDate(facilityId: string, date: string): Promise<Booking[]>;
  getBookingByStripeSessionId(sessionId: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  createBookingAddOn(data: { bookingId: string; addOnId: string; quantity: number; priceAtBooking: number }): Promise<any>;
  updateBookingStatus(bookingId: string, status: string, cancelReason?: string): Promise<Booking | undefined>;
  updateBookingPayment(bookingId: string, data: { paymentStatus?: string; paymentProofUrl?: string; paymentVerifiedBy?: string; paymentVerifiedAt?: Date; paymentNotes?: string; status?: string }): Promise<Booking | undefined>;
  checkDoubleBooking(facilitySlug: string, resourceId: number, date: string, startTime: string, endTime: string): Promise<boolean>;
  
  // User update
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  
  // Local auth operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  updateUserLoginAttempts(userId: string, attempts: number, lockoutUntil: Date | null): Promise<void>;
  updateUserActivity(userId: string, lastAuthenticatedAt: Date | null, lastActivityAt: Date | null): Promise<void>;
  getUserByEmailVerificationToken(token: string): Promise<User | undefined>;
  verifyUserEmail(userId: string): Promise<void>;
  updateEmailVerificationToken(userId: string, token: string, expires: Date): Promise<void>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  updatePasswordResetToken(userId: string, token: string, expires: Date): Promise<void>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;

  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByFacility(facilityId: string): Promise<Event[]>;
  createEvent(data: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<void>;

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
  
  // Venue operations
  getVenues(): Promise<Venue[]>;
  getVenueBySlug(slug: string): Promise<Venue | undefined>;
  createVenue(data: InsertVenue): Promise<Venue>;
  updateVenue(id: string, data: Partial<InsertVenue>): Promise<Venue | undefined>;
  deleteVenue(id: string): Promise<void>;
  
  // Facility Venue operations
  getFacilityVenues(venueId: string): Promise<FacilityVenue[]>;
  getFacilityVenuesByFacility(facilityId: string): Promise<FacilityVenue[]>;
  createFacilityVenue(data: InsertFacilityVenue): Promise<FacilityVenue>;
  updateFacilityVenue(id: string, data: Partial<InsertFacilityVenue>): Promise<FacilityVenue | undefined>;
  deleteFacilityVenue(id: string): Promise<void>;
  
  // Construction Phase operations
  getConstructionPhases(venueId?: string): Promise<ConstructionPhase[]>;
  createConstructionPhase(data: InsertConstructionPhase): Promise<ConstructionPhase>;
  updateConstructionPhase(id: string, data: Partial<InsertConstructionPhase>): Promise<ConstructionPhase | undefined>;
  deleteConstructionPhase(id: string): Promise<void>;
  
  // CMS Fields operations
  getCmsFields(pageSlug: string): Promise<CmsField[]>;
  getAllCmsFields(): Promise<CmsField[]>;
  upsertCmsField(data: InsertCmsField): Promise<CmsField>;
  deleteCmsField(id: string): Promise<void>;
  
  // Event Registration operations
  registerForEvent(data: InsertEventRegistration): Promise<EventRegistration>;
  getEventRegistrations(eventId: string): Promise<EventRegistration[]>;
  getUserEventRegistrations(userId: string): Promise<EventRegistration[]>;
  isUserRegisteredForEvent(userId: string, eventId: string): Promise<boolean>;
  isEmailRegisteredForEvent(email: string, eventId: string): Promise<boolean>;
  cancelEventRegistration(id: string): Promise<void>;
  
  // Career Application operations
  submitCareerApplication(data: InsertCareerApplication): Promise<CareerApplication>;
  getCareerApplications(careerId?: string): Promise<CareerApplication[]>;
  updateCareerApplicationStatus(id: string, status: string): Promise<CareerApplication | undefined>;
  
  // Contact Submission operations
  submitContactForm(data: InsertContactSubmission): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;
  updateContactSubmissionStatus(id: string, status: string): Promise<ContactSubmission | undefined>;
  
  // Site Settings operations
  getSiteSettings(): Promise<SiteSetting[]>;
  getSiteSetting(key: string): Promise<SiteSetting | undefined>;
  upsertSiteSetting(data: InsertSiteSetting): Promise<SiteSetting>;
  deleteSiteSetting(key: string): Promise<void>;
  
  // Site Images operations
  getSiteImages(): Promise<SiteImage[]>;
  getSiteImage(key: string): Promise<SiteImage | undefined>;
  getSiteImagesByPage(page: string): Promise<SiteImage[]>;
  createSiteImage(data: InsertSiteImage): Promise<SiteImage>;
  updateSiteImage(id: string, data: Partial<InsertSiteImage>): Promise<SiteImage | undefined>;
  deleteSiteImage(id: string): Promise<void>;
  
  // Navbar Items operations
  getNavbarItems(): Promise<NavbarItem[]>;
  getNavbarItem(id: string): Promise<NavbarItem | undefined>;
  createNavbarItem(data: InsertNavbarItem): Promise<NavbarItem>;
  updateNavbarItem(id: string, data: Partial<InsertNavbarItem>): Promise<NavbarItem | undefined>;
  deleteNavbarItem(id: string): Promise<void>;
  
  // Operating Hours operations
  getOperatingHours(venueId?: string, facilityId?: string): Promise<OperatingHours[]>;
  createOperatingHours(data: InsertOperatingHours): Promise<OperatingHours>;
  updateOperatingHours(id: string, data: Partial<InsertOperatingHours>): Promise<OperatingHours | undefined>;
  deleteOperatingHours(id: string): Promise<void>;
  
  // Peak Windows operations
  getPeakWindows(venueId?: string, facilityId?: string): Promise<PeakWindow[]>;
  createPeakWindow(data: InsertPeakWindow): Promise<PeakWindow>;
  updatePeakWindow(id: string, data: Partial<InsertPeakWindow>): Promise<PeakWindow | undefined>;
  deletePeakWindow(id: string): Promise<void>;
  
  // Hall Activities operations
  getHallActivities(facilityId?: string): Promise<HallActivity[]>;
  getHallActivity(id: string): Promise<HallActivity | undefined>;
  createHallActivity(data: InsertHallActivity): Promise<HallActivity>;
  updateHallActivity(id: string, data: Partial<InsertHallActivity>): Promise<HallActivity | undefined>;
  deleteHallActivity(id: string): Promise<void>;
  
  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
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

  async updateUserActivity(userId: string, lastAuthenticatedAt: Date | null, lastActivityAt: Date | null): Promise<void> {
    const updateData: any = { updatedAt: new Date() };
    if (lastAuthenticatedAt !== null) updateData.lastAuthenticatedAt = lastAuthenticatedAt;
    if (lastActivityAt !== null) updateData.lastActivityAt = lastActivityAt;
    await db.update(users).set(updateData).where(eq(users.id, userId));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserLoginAttempts(userId: string, attempts: number, lockoutUntil: Date | null): Promise<void> {
    await db.update(users).set({ 
      failedLoginAttempts: attempts, 
      lockoutUntil,
      updatedAt: new Date() 
    }).where(eq(users.id, userId));
  }

  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    return user;
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await db.update(users).set({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      updatedAt: new Date()
    }).where(eq(users.id, userId));
  }

  async updateEmailVerificationToken(userId: string, token: string, expires: Date): Promise<void> {
    await db.update(users).set({
      emailVerificationToken: token,
      emailVerificationExpires: expires,
      updatedAt: new Date()
    }).where(eq(users.id, userId));
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
    return user;
  }

  async updatePasswordResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await db.update(users).set({
      passwordResetToken: token,
      passwordResetExpires: expires,
      updatedAt: new Date()
    }).where(eq(users.id, userId));
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db.update(users).set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      updatedAt: new Date()
    }).where(eq(users.id, userId));
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

  async getFacility(id: string): Promise<Facility | undefined> {
    const [facility] = await db
      .select()
      .from(facilities)
      .where(eq(facilities.id, id));
    return facility;
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

  async getAllBookings(): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.createdAt));
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));
    return booking;
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

  async updateBookingStatus(bookingId: string, status: string, cancelReason?: string): Promise<Booking | undefined> {
    const updateData: any = { status: status as any, updatedAt: new Date() };
    if (cancelReason !== undefined) {
      updateData.cancellationReason = cancelReason;
    }
    const [updated] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, bookingId))
      .returning();
    return updated;
  }

  async updateBookingPayment(bookingId: string, data: { paymentStatus?: string; paymentProofUrl?: string; paymentVerifiedBy?: string; paymentVerifiedAt?: Date; paymentNotes?: string; status?: string }): Promise<Booking | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (data.paymentStatus) updateData.paymentStatus = data.paymentStatus;
    if (data.paymentProofUrl !== undefined) updateData.paymentProofUrl = data.paymentProofUrl;
    if (data.paymentVerifiedBy) updateData.paymentVerifiedBy = data.paymentVerifiedBy;
    if (data.paymentVerifiedAt) updateData.paymentVerifiedAt = data.paymentVerifiedAt;
    if (data.paymentNotes !== undefined) updateData.paymentNotes = data.paymentNotes;
    if (data.status) updateData.status = data.status;
    
    const [updated] = await db
      .update(bookings)
      .set(updateData)
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

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, id));
    return event;
  }

  async getEventsByFacility(facilityId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(and(eq(events.facilityId, facilityId), eq(events.isActive, true)));
  }

  async createEvent(data: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(data).returning();
    return event;
  }

  async updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db
      .update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();
    return updated;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
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

  // Venue operations
  async getVenues(): Promise<Venue[]> {
    return await db.select().from(venues).orderBy(asc(venues.sortOrder));
  }

  async getVenueBySlug(slug: string): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.slug, slug));
    return venue;
  }

  async createVenue(data: InsertVenue): Promise<Venue> {
    const [venue] = await db.insert(venues).values(data).returning();
    return venue;
  }

  async updateVenue(id: string, data: Partial<InsertVenue>): Promise<Venue | undefined> {
    const [updated] = await db
      .update(venues)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(venues.id, id))
      .returning();
    return updated;
  }

  async deleteVenue(id: string): Promise<void> {
    await db.delete(venues).where(eq(venues.id, id));
  }

  // Facility Venue operations
  async getFacilityVenues(venueId: string): Promise<FacilityVenue[]> {
    return await db.select().from(facilityVenues).where(eq(facilityVenues.venueId, venueId));
  }

  async getFacilityVenuesByFacility(facilityId: string): Promise<FacilityVenue[]> {
    return await db.select().from(facilityVenues).where(eq(facilityVenues.facilityId, facilityId));
  }

  async createFacilityVenue(data: InsertFacilityVenue): Promise<FacilityVenue> {
    const [facilityVenue] = await db.insert(facilityVenues).values(data).returning();
    return facilityVenue;
  }

  async updateFacilityVenue(id: string, data: Partial<InsertFacilityVenue>): Promise<FacilityVenue | undefined> {
    const [updated] = await db
      .update(facilityVenues)
      .set(data)
      .where(eq(facilityVenues.id, id))
      .returning();
    return updated;
  }

  async deleteFacilityVenue(id: string): Promise<void> {
    await db.delete(facilityVenues).where(eq(facilityVenues.id, id));
  }

  // Construction Phase operations
  async getConstructionPhases(venueId?: string): Promise<ConstructionPhase[]> {
    if (venueId) {
      return await db.select().from(constructionPhases).where(eq(constructionPhases.venueId, venueId)).orderBy(asc(constructionPhases.sortOrder));
    }
    return await db.select().from(constructionPhases).orderBy(asc(constructionPhases.sortOrder));
  }

  async createConstructionPhase(data: InsertConstructionPhase): Promise<ConstructionPhase> {
    const [phase] = await db.insert(constructionPhases).values(data).returning();
    return phase;
  }

  async updateConstructionPhase(id: string, data: Partial<InsertConstructionPhase>): Promise<ConstructionPhase | undefined> {
    const [updated] = await db
      .update(constructionPhases)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(constructionPhases.id, id))
      .returning();
    return updated;
  }

  async deleteConstructionPhase(id: string): Promise<void> {
    await db.delete(constructionPhases).where(eq(constructionPhases.id, id));
  }

  // CMS Fields operations
  async getCmsFields(pageSlug: string): Promise<CmsField[]> {
    return await db.select().from(cmsFields).where(eq(cmsFields.pageSlug, pageSlug)).orderBy(asc(cmsFields.sortOrder));
  }

  async getAllCmsFields(): Promise<CmsField[]> {
    return await db.select().from(cmsFields).orderBy(asc(cmsFields.sortOrder));
  }

  async upsertCmsField(data: InsertCmsField): Promise<CmsField> {
    const existing = await db.select().from(cmsFields)
      .where(and(
        eq(cmsFields.pageSlug, data.pageSlug),
        eq(cmsFields.fieldKey, data.fieldKey)
      ));
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(cmsFields)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(cmsFields.id, existing[0].id))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(cmsFields).values(data).returning();
    return created;
  }

  async deleteCmsField(id: string): Promise<void> {
    await db.delete(cmsFields).where(eq(cmsFields.id, id));
  }

  // Event Registration operations
  async registerForEvent(data: InsertEventRegistration): Promise<EventRegistration> {
    const [registration] = await db.insert(eventRegistrations).values(data).returning();
    await db.update(events)
      .set({ enrolledCount: sql`COALESCE(enrolled_count, 0) + 1` })
      .where(eq(events.id, data.eventId));
    return registration;
  }

  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    return await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
  }

  async getUserEventRegistrations(userId: string): Promise<EventRegistration[]> {
    return await db.select().from(eventRegistrations).where(eq(eventRegistrations.userId, userId));
  }

  async isUserRegisteredForEvent(userId: string, eventId: string): Promise<boolean> {
    const [existing] = await db.select().from(eventRegistrations)
      .where(and(
        eq(eventRegistrations.userId, userId),
        eq(eventRegistrations.eventId, eventId)
      ));
    return !!existing;
  }

  async isEmailRegisteredForEvent(email: string, eventId: string): Promise<boolean> {
    const [existing] = await db.select().from(eventRegistrations)
      .where(and(
        eq(eventRegistrations.email, email),
        eq(eventRegistrations.eventId, eventId)
      ));
    return !!existing;
  }

  async cancelEventRegistration(id: string): Promise<void> {
    const [registration] = await db.select().from(eventRegistrations).where(eq(eventRegistrations.id, id));
    if (registration) {
      await db.delete(eventRegistrations).where(eq(eventRegistrations.id, id));
      await db.update(events)
        .set({ enrolledCount: sql`GREATEST(COALESCE(enrolled_count, 0) - 1, 0)` })
        .where(eq(events.id, registration.eventId));
    }
  }

  // Career Application operations
  async submitCareerApplication(data: InsertCareerApplication): Promise<CareerApplication> {
    const [application] = await db.insert(careerApplications).values(data).returning();
    return application;
  }

  async getCareerApplications(careerId?: string): Promise<CareerApplication[]> {
    if (careerId) {
      return await db.select().from(careerApplications)
        .where(eq(careerApplications.careerId, careerId))
        .orderBy(desc(careerApplications.createdAt));
    }
    return await db.select().from(careerApplications).orderBy(desc(careerApplications.createdAt));
  }

  async updateCareerApplicationStatus(id: string, status: string): Promise<CareerApplication | undefined> {
    const [updated] = await db
      .update(careerApplications)
      .set({ status })
      .where(eq(careerApplications.id, id))
      .returning();
    return updated;
  }

  // Contact Submission operations
  async submitContactForm(data: InsertContactSubmission): Promise<ContactSubmission> {
    const [submission] = await db.insert(contactSubmissions).values(data).returning();
    return submission;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return await db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
  }

  async updateContactSubmissionStatus(id: string, status: string): Promise<ContactSubmission | undefined> {
    const [updated] = await db
      .update(contactSubmissions)
      .set({ status })
      .where(eq(contactSubmissions.id, id))
      .returning();
    return updated;
  }

  // Site Settings operations
  async getSiteSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings).orderBy(asc(siteSettings.category));
  }

  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async upsertSiteSetting(data: InsertSiteSetting): Promise<SiteSetting> {
    const existing = await this.getSiteSetting(data.key);
    
    if (existing) {
      const [updated] = await db
        .update(siteSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(siteSettings.key, data.key))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(siteSettings).values(data).returning();
    return created;
  }

  async deleteSiteSetting(key: string): Promise<void> {
    await db.delete(siteSettings).where(eq(siteSettings.key, key));
  }

  // Site Images operations
  async getSiteImages(): Promise<SiteImage[]> {
    return await db.select().from(siteImages).orderBy(asc(siteImages.page), asc(siteImages.sortOrder));
  }

  async getSiteImage(key: string): Promise<SiteImage | undefined> {
    const [image] = await db.select().from(siteImages).where(eq(siteImages.key, key));
    return image;
  }

  async getSiteImagesByPage(page: string): Promise<SiteImage[]> {
    return await db.select().from(siteImages).where(eq(siteImages.page, page)).orderBy(asc(siteImages.sortOrder));
  }

  async createSiteImage(data: InsertSiteImage): Promise<SiteImage> {
    const [image] = await db.insert(siteImages).values(data).returning();
    return image;
  }

  async updateSiteImage(id: string, data: Partial<InsertSiteImage>): Promise<SiteImage | undefined> {
    const [image] = await db
      .update(siteImages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(siteImages.id, id))
      .returning();
    return image;
  }

  async deleteSiteImage(id: string): Promise<void> {
    await db.delete(siteImages).where(eq(siteImages.id, id));
  }

  // Navbar Items operations
  async getNavbarItems(): Promise<NavbarItem[]> {
    return await db.select().from(navbarItems).orderBy(asc(navbarItems.sortOrder));
  }

  async getNavbarItem(id: string): Promise<NavbarItem | undefined> {
    const [item] = await db.select().from(navbarItems).where(eq(navbarItems.id, id));
    return item;
  }

  async createNavbarItem(data: InsertNavbarItem): Promise<NavbarItem> {
    const [created] = await db.insert(navbarItems).values(data).returning();
    return created;
  }

  async updateNavbarItem(id: string, data: Partial<InsertNavbarItem>): Promise<NavbarItem | undefined> {
    const [updated] = await db
      .update(navbarItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(navbarItems.id, id))
      .returning();
    return updated;
  }

  async deleteNavbarItem(id: string): Promise<void> {
    await db.delete(navbarItems).where(eq(navbarItems.id, id));
  }

  // Operating Hours operations
  async getOperatingHours(venueId?: string, facilityId?: string): Promise<OperatingHours[]> {
    if (venueId && facilityId) {
      return await db.select().from(operatingHours)
        .where(and(eq(operatingHours.venueId, venueId), eq(operatingHours.facilityId, facilityId)))
        .orderBy(asc(operatingHours.dayOfWeek));
    }
    if (venueId) {
      return await db.select().from(operatingHours)
        .where(eq(operatingHours.venueId, venueId))
        .orderBy(asc(operatingHours.dayOfWeek));
    }
    if (facilityId) {
      return await db.select().from(operatingHours)
        .where(eq(operatingHours.facilityId, facilityId))
        .orderBy(asc(operatingHours.dayOfWeek));
    }
    return await db.select().from(operatingHours).orderBy(asc(operatingHours.dayOfWeek));
  }

  async createOperatingHours(data: InsertOperatingHours): Promise<OperatingHours> {
    const [created] = await db.insert(operatingHours).values(data).returning();
    return created;
  }

  async updateOperatingHours(id: string, data: Partial<InsertOperatingHours>): Promise<OperatingHours | undefined> {
    const [updated] = await db
      .update(operatingHours)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(operatingHours.id, id))
      .returning();
    return updated;
  }

  async deleteOperatingHours(id: string): Promise<void> {
    await db.delete(operatingHours).where(eq(operatingHours.id, id));
  }

  // Peak Windows operations
  async getPeakWindows(venueId?: string, facilityId?: string): Promise<PeakWindow[]> {
    if (venueId && facilityId) {
      return await db.select().from(peakWindows)
        .where(and(eq(peakWindows.venueId, venueId), eq(peakWindows.facilityId, facilityId), eq(peakWindows.isActive, true)))
        .orderBy(asc(peakWindows.sortOrder));
    }
    if (venueId) {
      return await db.select().from(peakWindows)
        .where(and(eq(peakWindows.venueId, venueId), eq(peakWindows.isActive, true)))
        .orderBy(asc(peakWindows.sortOrder));
    }
    if (facilityId) {
      return await db.select().from(peakWindows)
        .where(and(eq(peakWindows.facilityId, facilityId), eq(peakWindows.isActive, true)))
        .orderBy(asc(peakWindows.sortOrder));
    }
    return await db.select().from(peakWindows).where(eq(peakWindows.isActive, true)).orderBy(asc(peakWindows.sortOrder));
  }

  async createPeakWindow(data: InsertPeakWindow): Promise<PeakWindow> {
    const [created] = await db.insert(peakWindows).values(data).returning();
    return created;
  }

  async updatePeakWindow(id: string, data: Partial<InsertPeakWindow>): Promise<PeakWindow | undefined> {
    const [updated] = await db
      .update(peakWindows)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(peakWindows.id, id))
      .returning();
    return updated;
  }

  async deletePeakWindow(id: string): Promise<void> {
    await db.delete(peakWindows).where(eq(peakWindows.id, id));
  }

  // Hall Activities operations
  async getHallActivities(facilityId?: string): Promise<HallActivity[]> {
    if (facilityId) {
      return await db.select().from(hallActivities)
        .where(and(eq(hallActivities.facilityId, facilityId), eq(hallActivities.isActive, true)))
        .orderBy(asc(hallActivities.sortOrder));
    }
    return await db.select().from(hallActivities).where(eq(hallActivities.isActive, true)).orderBy(asc(hallActivities.sortOrder));
  }

  async getHallActivity(id: string): Promise<HallActivity | undefined> {
    const [activity] = await db.select().from(hallActivities).where(eq(hallActivities.id, id));
    return activity;
  }

  async createHallActivity(data: InsertHallActivity): Promise<HallActivity> {
    const [created] = await db.insert(hallActivities).values(data).returning();
    return created;
  }

  async updateHallActivity(id: string, data: Partial<InsertHallActivity>): Promise<HallActivity | undefined> {
    const [updated] = await db
      .update(hallActivities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(hallActivities.id, id))
      .returning();
    return updated;
  }

  async deleteHallActivity(id: string): Promise<void> {
    await db.delete(hallActivities).where(eq(hallActivities.id, id));
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return Number(result[0]?.count) || 0;
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
