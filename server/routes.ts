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
} from "@shared/schema";
import { z } from "zod";

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

  return httpServer;
}
