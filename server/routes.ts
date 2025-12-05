import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertBookingSchema,
  insertCmsContentSchema,
  insertAnnouncementSchema,
  insertGalleryImageSchema,
  insertPricingTierSchema,
  insertCareerSchema,
  insertRuleSchema,
  insertFacilitySchema,
  insertVenueSchema,
  insertConstructionPhaseSchema,
  insertCmsFieldSchema,
  insertEventRegistrationSchema,
  insertCareerApplicationSchema,
  insertContactSubmissionSchema,
  insertSiteSettingSchema,
} from "@shared/schema";
import { z } from "zod";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { db } from "./db";
import { sql } from "drizzle-orm";

// Admin middleware - checks if user is ADMIN or SUPER_ADMIN
async function isAdmin(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const userId = req.user.claims.sub;
  const user = await storage.getUser(userId);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // ========== AUTH ROUTES ==========
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ========== MEMBERSHIP ROUTES ==========
  app.get('/api/memberships/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membership = await storage.getMembership(userId);
      if (!membership) {
        return res.status(404).json({ message: "No membership found" });
      }
      res.json(membership);
    } catch (error) {
      console.error("Error fetching membership:", error);
      res.status(500).json({ message: "Failed to fetch membership" });
    }
  });

  // Membership number format: QD-XXXX (e.g., QD-0001)
  const membershipNumberPattern = /^QD-\d{4}$/;

  app.get('/api/memberships/validate/:number', async (req, res) => {
    try {
      const { number } = req.params;
      
      // Validate membership number format
      if (!membershipNumberPattern.test(number)) {
        return res.status(400).json({ 
          valid: false, 
          message: "Invalid membership number format. Expected format: QD-XXXX (e.g., QD-0001)" 
        });
      }
      
      const membership = await storage.getMembershipByNumber(number);
      res.json({ valid: !!membership, membership });
    } catch (error) {
      console.error("Error validating membership:", error);
      res.status(500).json({ message: "Failed to validate membership" });
    }
  });

  // ========== FACILITY ROUTES ==========
  app.get('/api/facilities', async (req, res) => {
    try {
      const facilities = await storage.getFacilities();
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  app.get('/api/facilities/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const facility = await storage.getFacilityBySlug(slug);
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }
      res.json(facility);
    } catch (error) {
      console.error("Error fetching facility:", error);
      res.status(500).json({ message: "Failed to fetch facility" });
    }
  });

  app.get('/api/facilities/:slug/addons', async (req, res) => {
    try {
      const { slug } = req.params;
      const facility = await storage.getFacilityBySlug(slug);
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }
      const addons = await storage.getFacilityAddOns(facility.id);
      res.json(addons);
    } catch (error) {
      console.error("Error fetching facility addons:", error);
      res.status(500).json({ message: "Failed to fetch facility addons" });
    }
  });

  // ========== PUBLIC CAREERS ROUTE (salary hidden from non-admin) ==========
  app.get('/api/careers', async (req: any, res) => {
    try {
      const careers = await storage.getActiveCarers();
      
      // Check if user is authenticated and has admin role
      const isAdmin = req.user?.claims?.sub && 
        await (async () => {
          const user = await storage.getUser(req.user.claims.sub);
          return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
        })();
      
      // Always hide salary from non-admin users (regardless of salaryHidden flag)
      const publicCareers = careers.map(career => {
        if (!isAdmin) {
          const { salary, ...publicData } = career;
          return publicData;
        }
        return career;
      });
      res.json(publicCareers);
    } catch (error) {
      console.error("Error fetching careers:", error);
      res.status(500).json({ message: "Failed to fetch careers" });
    }
  });

  // ========== PUBLIC VENUES ROUTE ==========
  app.get('/api/venues', async (req, res) => {
    try {
      const allVenues = await storage.getVenues();
      res.json(allVenues);
    } catch (error) {
      console.error("Error fetching venues:", error);
      res.status(500).json({ message: "Failed to fetch venues" });
    }
  });

  // ========== PUBLIC CONSTRUCTION PHASES ROUTE ==========
  app.get('/api/construction-phases', async (req, res) => {
    try {
      const { venueId } = req.query;
      const phases = await storage.getConstructionPhases(venueId as string | undefined);
      res.json(phases);
    } catch (error) {
      console.error("Error fetching construction phases:", error);
      res.status(500).json({ message: "Failed to fetch construction phases" });
    }
  });

  // ========== BOOKING ROUTES ==========
  app.get('/api/bookings', async (req, res) => {
    try {
      const { facilityId, date } = req.query;
      if (facilityId && date) {
        // Get bookings for a specific facility and date (for availability check)
        const bookings = await storage.getBookingsByDate(facilityId as string, date as string);
        res.json(bookings);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/bookings/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  const createBookingSchema = z.object({
    facilitySlug: z.string(),
    venue: z.string().default('Islamabad'),
    resourceId: z.number().default(1),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    durationMinutes: z.number().default(60),
    paymentMethod: z.string().default('cash'),
    payerType: z.enum(['SELF', 'MEMBER']).default('SELF'),
    payerMembershipNumber: z.string().regex(/^QD-\d{4}$/, "Invalid membership number format. Expected QD-XXXX").nullable().optional(),
    basePrice: z.number().default(0),
    discount: z.number().default(0),
    addOnTotal: z.number().default(0),
    totalPrice: z.number(),
    coachBooked: z.boolean().default(false),
    isMatchmaking: z.boolean().default(false),
    currentPlayers: z.number().default(1),
    maxPlayers: z.number().default(4),
    addOns: z.array(z.object({ id: z.string(), quantity: z.number() })).optional(),
  });

  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = createBookingSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid booking data", errors: result.error.errors });
      }

      const data = result.data;
      
      // Validate payer membership if paying on behalf of another member
      if (data.payerType === 'MEMBER' && data.payerMembershipNumber) {
        const payerMembership = await storage.getMembershipByNumber(data.payerMembershipNumber);
        if (!payerMembership) {
          return res.status(400).json({ message: "Payer membership not found" });
        }
        if (payerMembership.status !== 'ACTIVE') {
          return res.status(400).json({ message: "Payer membership is not active" });
        }
      }
      
      // Get facility by slug
      const facility = await storage.getFacilityBySlug(data.facilitySlug);
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }

      // Check for double booking
      const isDoubleBooked = await storage.checkDoubleBooking(
        facility.id,
        data.resourceId,
        data.date,
        data.startTime
      );

      if (isDoubleBooked) {
        return res.status(409).json({ message: "This time slot is already booked" });
      }

      // Create the booking
      const booking = await storage.createBooking({
        userId,
        facilityId: facility.id,
        venue: data.venue,
        resourceId: data.resourceId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: data.durationMinutes,
        status: 'CONFIRMED',
        paymentMethod: data.paymentMethod,
        payerType: data.payerType,
        payerMembershipNumber: data.payerMembershipNumber || null,
        basePrice: data.basePrice,
        discount: data.discount,
        addOnTotal: data.addOnTotal,
        totalPrice: data.totalPrice,
        coachBooked: data.coachBooked,
        isMatchmaking: data.isMatchmaking,
        currentPlayers: data.currentPlayers,
        maxPlayers: data.maxPlayers,
      });

      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch('/api/bookings/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const booking = await storage.updateBookingStatus(id, 'CANCELLED');
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // ========== EVENT ROUTES ==========
  app.get('/api/events', async (req, res) => {
    try {
      const { facilityId } = req.query;
      if (facilityId) {
        const events = await storage.getEventsByFacility(facilityId as string);
        res.json(events);
      } else {
        const events = await storage.getEvents();
        res.json(events);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // ========== LEADERBOARD ROUTES ==========
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const { facilityId } = req.query;
      const entries = await storage.getLeaderboard(facilityId as string | undefined);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // ========== CMS ROUTES ==========
  app.get('/api/cms/:key', async (req, res) => {
    try {
      const { key } = req.params;
      const content = await storage.getCmsContent(key);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Error fetching CMS content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.get('/api/announcements', async (req, res) => {
    try {
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.get('/api/gallery', async (req, res) => {
    try {
      const images = await storage.getGalleryImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      res.status(500).json({ message: "Failed to fetch gallery images" });
    }
  });

  // ========== ADMIN ROUTES ==========
  
  // Admin CMS Content routes
  app.get('/api/admin/cms', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const content = await storage.getAllCmsContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching CMS content:", error);
      res.status(500).json({ message: "Failed to fetch CMS content" });
    }
  });

  app.post('/api/admin/cms', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertCmsContentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const content = await storage.upsertCmsContent(result.data);
      res.status(201).json(content);
    } catch (error) {
      console.error("Error creating CMS content:", error);
      res.status(500).json({ message: "Failed to create CMS content" });
    }
  });

  app.delete('/api/admin/cms/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCmsContent(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting CMS content:", error);
      res.status(500).json({ message: "Failed to delete CMS content" });
    }
  });

  // Admin Announcements routes
  app.get('/api/admin/announcements', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/admin/announcements', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertAnnouncementSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const announcement = await storage.createAnnouncement(result.data);
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  app.patch('/api/admin/announcements/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertAnnouncementSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateAnnouncement(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(500).json({ message: "Failed to update announcement" });
    }
  });

  app.delete('/api/admin/announcements/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteAnnouncement(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  // Admin Gallery routes
  app.get('/api/admin/gallery', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const images = await storage.getAllGalleryImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      res.status(500).json({ message: "Failed to fetch gallery images" });
    }
  });

  app.post('/api/admin/gallery', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertGalleryImageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const image = await storage.createGalleryImage(result.data);
      res.status(201).json(image);
    } catch (error) {
      console.error("Error creating gallery image:", error);
      res.status(500).json({ message: "Failed to create gallery image" });
    }
  });

  app.patch('/api/admin/gallery/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertGalleryImageSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateGalleryImage(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating gallery image:", error);
      res.status(500).json({ message: "Failed to update gallery image" });
    }
  });

  app.delete('/api/admin/gallery/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteGalleryImage(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });

  // Admin Pricing Tiers routes
  app.get('/api/admin/pricing-tiers', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const tiers = await storage.getPricingTiers();
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching pricing tiers:", error);
      res.status(500).json({ message: "Failed to fetch pricing tiers" });
    }
  });

  app.post('/api/admin/pricing-tiers', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertPricingTierSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const tier = await storage.createPricingTier(result.data);
      res.status(201).json(tier);
    } catch (error) {
      console.error("Error creating pricing tier:", error);
      res.status(500).json({ message: "Failed to create pricing tier" });
    }
  });

  app.patch('/api/admin/pricing-tiers/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertPricingTierSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updatePricingTier(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Pricing tier not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating pricing tier:", error);
      res.status(500).json({ message: "Failed to update pricing tier" });
    }
  });

  app.delete('/api/admin/pricing-tiers/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deletePricingTier(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pricing tier:", error);
      res.status(500).json({ message: "Failed to delete pricing tier" });
    }
  });

  // Admin Careers routes
  app.get('/api/admin/careers', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const careers = await storage.getCareers();
      res.json(careers);
    } catch (error) {
      console.error("Error fetching careers:", error);
      res.status(500).json({ message: "Failed to fetch careers" });
    }
  });

  app.post('/api/admin/careers', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertCareerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const career = await storage.createCareer(result.data);
      res.status(201).json(career);
    } catch (error) {
      console.error("Error creating career:", error);
      res.status(500).json({ message: "Failed to create career" });
    }
  });

  app.patch('/api/admin/careers/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertCareerSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateCareer(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Career not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating career:", error);
      res.status(500).json({ message: "Failed to update career" });
    }
  });

  app.delete('/api/admin/careers/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCareer(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting career:", error);
      res.status(500).json({ message: "Failed to delete career" });
    }
  });

  // Admin Rules routes
  app.get('/api/admin/rules', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const rules = await storage.getRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching rules:", error);
      res.status(500).json({ message: "Failed to fetch rules" });
    }
  });

  app.post('/api/admin/rules', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertRuleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const rule = await storage.createRule(result.data);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating rule:", error);
      res.status(500).json({ message: "Failed to create rule" });
    }
  });

  app.patch('/api/admin/rules/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertRuleSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateRule(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Rule not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating rule:", error);
      res.status(500).json({ message: "Failed to update rule" });
    }
  });

  app.delete('/api/admin/rules/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteRule(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting rule:", error);
      res.status(500).json({ message: "Failed to delete rule" });
    }
  });

  // Admin Facilities routes
  app.get('/api/admin/facilities', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const facilities = await storage.getFacilities();
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  app.post('/api/admin/facilities', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertFacilitySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const facility = await storage.createFacility(result.data);
      res.status(201).json(facility);
    } catch (error) {
      console.error("Error creating facility:", error);
      res.status(500).json({ message: "Failed to create facility" });
    }
  });

  app.patch('/api/admin/facilities/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertFacilitySchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateFacility(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Facility not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating facility:", error);
      res.status(500).json({ message: "Failed to update facility" });
    }
  });

  app.delete('/api/admin/facilities/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteFacility(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting facility:", error);
      res.status(500).json({ message: "Failed to delete facility" });
    }
  });

  // Admin Venues routes
  app.get('/api/admin/venues', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allVenues = await storage.getVenues();
      res.json(allVenues);
    } catch (error) {
      console.error("Error fetching venues:", error);
      res.status(500).json({ message: "Failed to fetch venues" });
    }
  });

  app.post('/api/admin/venues', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertVenueSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const venue = await storage.createVenue(result.data);
      res.status(201).json(venue);
    } catch (error) {
      console.error("Error creating venue:", error);
      res.status(500).json({ message: "Failed to create venue" });
    }
  });

  app.patch('/api/admin/venues/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertVenueSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateVenue(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Venue not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating venue:", error);
      res.status(500).json({ message: "Failed to update venue" });
    }
  });

  app.delete('/api/admin/venues/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteVenue(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting venue:", error);
      res.status(500).json({ message: "Failed to delete venue" });
    }
  });

  // Admin Construction Phases routes
  app.get('/api/admin/construction-phases', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { venueId } = req.query;
      const phases = await storage.getConstructionPhases(venueId as string | undefined);
      res.json(phases);
    } catch (error) {
      console.error("Error fetching construction phases:", error);
      res.status(500).json({ message: "Failed to fetch construction phases" });
    }
  });

  app.post('/api/admin/construction-phases', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertConstructionPhaseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const phase = await storage.createConstructionPhase(result.data);
      res.status(201).json(phase);
    } catch (error) {
      console.error("Error creating construction phase:", error);
      res.status(500).json({ message: "Failed to create construction phase" });
    }
  });

  app.patch('/api/admin/construction-phases/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertConstructionPhaseSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateConstructionPhase(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Construction phase not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating construction phase:", error);
      res.status(500).json({ message: "Failed to update construction phase" });
    }
  });

  app.delete('/api/admin/construction-phases/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteConstructionPhase(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting construction phase:", error);
      res.status(500).json({ message: "Failed to delete construction phase" });
    }
  });

  // Admin CMS Fields routes
  app.get('/api/admin/cms-fields', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { pageSlug } = req.query;
      if (pageSlug) {
        const fields = await storage.getCmsFields(pageSlug as string);
        res.json(fields);
      } else {
        const fields = await storage.getAllCmsFields();
        res.json(fields);
      }
    } catch (error) {
      console.error("Error fetching CMS fields:", error);
      res.status(500).json({ message: "Failed to fetch CMS fields" });
    }
  });

  app.post('/api/admin/cms-fields', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertCmsFieldSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const field = await storage.upsertCmsField(result.data);
      res.status(201).json(field);
    } catch (error) {
      console.error("Error creating CMS field:", error);
      res.status(500).json({ message: "Failed to create CMS field" });
    }
  });

  app.delete('/api/admin/cms-fields/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCmsField(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting CMS field:", error);
      res.status(500).json({ message: "Failed to delete CMS field" });
    }
  });

  // ========== STRIPE PAYMENT ROUTES ==========
  
  app.get('/api/stripe/publishable-key', async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error fetching Stripe key:", error);
      res.status(500).json({ message: "Failed to fetch Stripe key" });
    }
  });

  app.get('/api/stripe/products', async (req, res) => {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.products WHERE active = true`
      );
      res.json({ data: result.rows });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/stripe/prices', async (req, res) => {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.prices WHERE active = true`
      );
      res.json({ data: result.rows });
    } catch (error) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ message: "Failed to fetch prices" });
    }
  });

  const checkoutSchema = z.object({
    facilitySlug: z.string(),
    venue: z.string(),
    resourceId: z.number(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    durationMinutes: z.number(),
    basePrice: z.number(),
    discount: z.number(),
    addOnTotal: z.number(),
    totalPrice: z.number(),
    coachBooked: z.boolean().optional(),
    isMatchmaking: z.boolean().optional(),
    hallActivity: z.string().nullable().optional(),
    addOns: z.array(z.object({ id: z.string(), quantity: z.number() })).optional(),
  });

  app.post('/api/stripe/create-checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = checkoutSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid checkout data", errors: result.error.errors });
      }

      const data = result.data;
      const stripe = await getUncachableStripeClient();
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check for double booking before allowing checkout
      const existingBooking = await storage.checkDoubleBooking(
        data.facilitySlug,
        data.resourceId,
        data.date,
        data.startTime,
        data.endTime
      );
      
      if (existingBooking) {
        return res.status(409).json({ message: "This time slot is already booked. Please choose another time." });
      }

      // Get facility and validate pricing server-side
      const facility = await storage.getFacilityBySlug(data.facilitySlug);
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }

      // Server-side price calculation to prevent tampering
      // basePrice is the price per hour
      const serverBasePrice = (facility.basePrice || 0) * (data.durationMinutes / 60);
      const isOffPeakHour = (hour: number) => hour >= 6 && hour < 17;
      const startHour = parseInt(data.startTime.split(':')[0]);
      const serverDiscount = isOffPeakHour(startHour) ? Math.round(serverBasePrice * 0.3) : 0;
      
      // Validate add-on prices from database
      let serverAddOnTotal = 0;
      const validatedAddOns: { id: string; quantity: number; price: number; name: string }[] = [];
      
      if (data.addOns && data.addOns.length > 0) {
        const facilityAddOns = await storage.getFacilityAddOns(facility.id);
        for (const clientAddOn of data.addOns) {
          const dbAddOn = facilityAddOns.find(a => a.slug === clientAddOn.id);
          if (dbAddOn) {
            serverAddOnTotal += dbAddOn.price * clientAddOn.quantity;
            validatedAddOns.push({
              id: clientAddOn.id,
              quantity: clientAddOn.quantity,
              price: dbAddOn.price,
              name: dbAddOn.name
            });
          }
        }
      }

      const serverTotalPrice = Math.round(serverBasePrice - serverDiscount + serverAddOnTotal);

      // Validate computed values are not NaN
      if (isNaN(serverBasePrice) || isNaN(serverDiscount) || isNaN(serverTotalPrice)) {
        return res.status(400).json({ message: "Unable to calculate pricing. Please try again." });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
          metadata: { userId },
        });
        await storage.updateUser(userId, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const lineItems: any[] = [];

      lineItems.push({
        price_data: {
          currency: 'pkr',
          product_data: {
            name: `${facility.name} Booking`,
            description: `${data.venue} - ${data.date} at ${data.startTime} (${data.durationMinutes} min)`,
          },
          unit_amount: Math.round((serverBasePrice - serverDiscount) * 100),
        },
        quantity: 1,
      });

      for (const addOn of validatedAddOns) {
        lineItems.push({
          price_data: {
            currency: 'pkr',
            product_data: {
              name: `Add-on: ${addOn.name}`,
            },
            unit_amount: Math.round(addOn.price * 100),
          },
          quantity: addOn.quantity,
        });
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${baseUrl}/booking?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/booking?canceled=true`,
        metadata: {
          userId,
          facilityId: String(facility.id),
          facilitySlug: data.facilitySlug,
          venue: data.venue,
          resourceId: String(data.resourceId),
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          durationMinutes: String(data.durationMinutes),
          basePrice: String(serverBasePrice),
          discount: String(serverDiscount),
          addOnTotal: String(serverAddOnTotal),
          totalPrice: String(serverTotalPrice),
          coachBooked: String(data.coachBooked || false),
          isMatchmaking: String(data.isMatchmaking || false),
          hallActivity: data.hallActivity || '',
          addOns: JSON.stringify(validatedAddOns),
        },
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      res.status(500).json({ message: "Failed to create checkout session", error: error.message });
    }
  });

  // Verify Stripe session and create booking after successful payment
  app.post('/api/stripe/verify-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Verify session belongs to this user
      if (session.metadata?.userId !== userId) {
        return res.status(403).json({ message: "Session does not belong to this user" });
      }

      // Verify payment is complete
      if (session.payment_status !== 'paid') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      // Check if booking was already created (idempotency)
      const existingBooking = await storage.getBookingByStripeSessionId(sessionId);
      if (existingBooking) {
        return res.json({ message: "Booking already exists", booking: existingBooking });
      }

      // Double-check for conflicting bookings
      const conflictingBooking = await storage.checkDoubleBooking(
        session.metadata.facilitySlug,
        parseInt(session.metadata.resourceId),
        session.metadata.date,
        session.metadata.startTime,
        session.metadata.endTime
      );

      if (conflictingBooking) {
        // Refund the payment since slot is no longer available
        // In production, you'd want to handle this more gracefully
        return res.status(409).json({ 
          message: "Time slot was booked by another user. Please contact support for a refund.",
          refundRequired: true 
        });
      }

      // Parse add-ons from metadata
      const addOns = session.metadata.addOns ? JSON.parse(session.metadata.addOns) : [];

      // Create the booking
      const booking = await storage.createBooking({
        userId,
        facilityId: parseInt(session.metadata.facilityId),
        venue: session.metadata.venue,
        resourceId: parseInt(session.metadata.resourceId),
        date: session.metadata.date,
        startTime: session.metadata.startTime,
        endTime: session.metadata.endTime,
        durationMinutes: parseInt(session.metadata.durationMinutes),
        paymentMethod: 'card',
        payerType: 'SELF',
        payerMembershipNumber: null,
        basePrice: parseInt(session.metadata.basePrice),
        discount: parseInt(session.metadata.discount),
        addOnTotal: parseInt(session.metadata.addOnTotal),
        totalPrice: parseInt(session.metadata.totalPrice),
        coachBooked: session.metadata.coachBooked === 'true',
        isMatchmaking: session.metadata.isMatchmaking === 'true',
        hallActivity: session.metadata.hallActivity || null,
        status: 'CONFIRMED',
        stripeSessionId: sessionId,
        stripePaymentIntentId: session.payment_intent as string,
      });

      // Create booking add-ons
      for (const addOn of addOns) {
        await storage.createBookingAddOn({
          bookingId: booking.id,
          addOnId: addOn.id,
          quantity: addOn.quantity,
          priceAtBooking: addOn.price,
        });
      }

      res.json({ message: "Booking confirmed", booking });
    } catch (error: any) {
      console.error("Error verifying session:", error);
      res.status(500).json({ message: "Failed to verify session", error: error.message });
    }
  });

  app.get('/api/stripe/session/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      res.json({ session });
    } catch (error: any) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session", error: error.message });
    }
  });

  // Event Registration Routes
  app.post('/api/events/:eventId/register', async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null;
      const { eventId } = req.params;
      const { fullName, email, phone, guestCount, notes } = req.body;
      
      // Check if user is already registered (by userId or email)
      if (userId) {
        const isAlreadyRegistered = await storage.isUserRegisteredForEvent(userId, eventId);
        if (isAlreadyRegistered) {
          return res.status(400).json({ message: "You are already registered for this event" });
        }
      }
      
      // Check if email is already registered for this event
      const existingByEmail = await storage.isEmailRegisteredForEvent(email, eventId);
      if (existingByEmail) {
        return res.status(400).json({ message: "This email is already registered for this event" });
      }
      
      const result = insertEventRegistrationSchema.safeParse({
        userId,
        eventId,
        fullName,
        email,
        phone,
        guestCount: guestCount || 0,
        notes,
        status: 'REGISTERED'
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const registration = await storage.registerForEvent(result.data);
      res.status(201).json(registration);
    } catch (error) {
      console.error("Error registering for event:", error);
      res.status(500).json({ message: "Failed to register for event" });
    }
  });

  app.get('/api/user/event-registrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registrations = await storage.getUserEventRegistrations(userId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching user event registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.get('/api/events/:eventId/registration-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { eventId } = req.params;
      const isRegistered = await storage.isUserRegisteredForEvent(userId, eventId);
      res.json({ isRegistered });
    } catch (error) {
      console.error("Error checking registration status:", error);
      res.status(500).json({ message: "Failed to check registration status" });
    }
  });

  app.delete('/api/events/:eventId/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { eventId } = req.params;
      
      const registrations = await storage.getUserEventRegistrations(userId);
      const registration = registrations.find(r => r.eventId === eventId);
      
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      
      await storage.cancelEventRegistration(registration.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error cancelling event registration:", error);
      res.status(500).json({ message: "Failed to cancel registration" });
    }
  });

  // Admin Event Registrations
  app.get('/api/admin/events/:eventId/registrations', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const registrations = await storage.getEventRegistrations(req.params.eventId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching event registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  // Career Application Routes
  // General CV submission (no specific career) - must be defined before :careerId route
  app.post('/api/careers/general-application', async (req, res) => {
    try {
      const { fullName, email, phone, coverLetter, cvUrl, linkedinUrl } = req.body;
      
      const result = insertCareerApplicationSchema.safeParse({
        careerId: null,
        fullName,
        email,
        phone,
        coverLetter,
        cvUrl,
        linkedinUrl,
        status: 'NEW'
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const application = await storage.submitCareerApplication(result.data);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error submitting general CV application:", error);
      res.status(500).json({ message: "Failed to submit CV" });
    }
  });

  app.post('/api/careers/:careerId/apply', async (req, res) => {
    try {
      const { careerId } = req.params;
      const { fullName, email, phone, coverLetter, cvUrl, linkedinUrl } = req.body;
      
      // Check if careerId is a valid career in the database
      const careers = await storage.getCareers();
      const validCareer = careers.find(c => c.id === careerId);
      
      const result = insertCareerApplicationSchema.safeParse({
        careerId: validCareer ? careerId : null,
        fullName,
        email,
        phone,
        coverLetter,
        cvUrl,
        linkedinUrl,
        status: 'NEW'
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const application = await storage.submitCareerApplication(result.data);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error submitting career application:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  app.get('/api/admin/career-applications', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const careerId = req.query.careerId as string | undefined;
      const applications = await storage.getCareerApplications(careerId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching career applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.patch('/api/admin/career-applications/:id/status', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['pending', 'reviewed', 'interviewing', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updated = await storage.updateCareerApplicationStatus(id, status);
      if (!updated) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  // Contact Form Routes
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, subject, message, phone } = req.body;
      
      const result = insertContactSubmissionSchema.safeParse({
        name,
        email,
        subject,
        message,
        phone,
        status: 'new'
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const submission = await storage.submitContactForm(result.data);
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error submitting contact form:", error);
      res.status(500).json({ message: "Failed to submit contact form" });
    }
  });

  app.get('/api/admin/contact-submissions', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const submissions = await storage.getContactSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.patch('/api/admin/contact-submissions/:id/status', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['new', 'read', 'responded', 'archived'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updated = await storage.updateContactSubmissionStatus(id, status);
      if (!updated) {
        return res.status(404).json({ message: "Submission not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating submission status:", error);
      res.status(500).json({ message: "Failed to update submission status" });
    }
  });

  // Site Settings Routes
  app.get('/api/site-settings', async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
      res.json(settingsMap);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ message: "Failed to fetch site settings" });
    }
  });

  app.get('/api/admin/site-settings', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ message: "Failed to fetch site settings" });
    }
  });

  app.post('/api/admin/site-settings', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertSiteSettingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const setting = await storage.upsertSiteSetting(result.data);
      res.status(201).json(setting);
    } catch (error) {
      console.error("Error creating site setting:", error);
      res.status(500).json({ message: "Failed to create site setting" });
    }
  });

  app.delete('/api/admin/site-settings/:key', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteSiteSetting(req.params.key);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting site setting:", error);
      res.status(500).json({ message: "Failed to delete site setting" });
    }
  });

  return httpServer;
}
