import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBookingSchema } from "@shared/schema";
import { z } from "zod";

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

  app.get('/api/memberships/validate/:number', async (req, res) => {
    try {
      const { number } = req.params;
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
    payerMembershipNumber: z.string().nullable().optional(),
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

  return httpServer;
}
