import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, sessionHeartbeat, adminHeartbeat } from "./localAuth";
import { logAdminAction } from "./auditLog";
import {
  sendBookingCreatedEmail,
  sendPaymentVerifiedEmail,
  sendPaymentRejectedEmail,
  sendBookingCancelledEmail,
  sendEventRegistrationEmail,
  sendWelcomeEmail,
  sendContactFormEmail,
  sendCareerApplicationEmail,
  sendAdminNewUserAlert,
  sendAdminMembershipSelectionAlert,
  sendAdminPaymentSubmissionAlert,
  sendMembershipApprovedEmail,
  sendMembershipRejectedEmail,
} from "./email";
import { 
  insertBookingSchema,
  insertCmsContentSchema,
  insertAnnouncementSchema,
  insertGalleryImageSchema,
  insertPricingTierSchema,
  insertMembershipTierDefinitionSchema,
  insertCareerSchema,
  insertRuleSchema,
  insertFaqCategorySchema,
  insertFaqItemSchema,
  insertFacilitySchema,
  insertFacilityAddOnSchema,
  insertVenueSchema,
  insertConstructionPhaseSchema,
  insertCmsFieldSchema,
  insertEventSchema,
  insertEventRegistrationSchema,
  insertCareerApplicationSchema,
  insertContactSubmissionSchema,
  insertSiteSettingSchema,
  insertSiteImageSchema,
  insertNavbarItemSchema,
  insertOperatingHoursSchema,
  insertPeakWindowSchema,
  insertHallActivitySchema,
  updateUserProfileSchema,
  insertBlogSchema,
  insertHeroSectionSchema,
  insertCtaSchema,
  insertTestimonialSchema,
  insertEventGallerySchema,
  insertMembershipApplicationSchema,
  insertPageContentSchema,
  insertComparisonFeatureSchema,
  insertMemberBenefitSchema,
  insertCareerBenefitSchema,
} from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { logger } from "./logger";
import { getStorageService } from "./storage/compositeStorage";
import type { MirroredUploadResult } from "./storage/types";

// Setup file upload directory (fallback for local storage)
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer with memory storage for composite storage service
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'));
    }
  }
});

// Helper function to handle file upload with mirrored storage (Supabase + Hostinger + Local)
async function handleFileUpload(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
  const storageService = getStorageService();
  
  const result: MirroredUploadResult = await storageService.upload(
    file.buffer,
    `${folder}-${file.originalname}`,
    {
      folder,
      contentType: file.mimetype
    }
  );
  
  if (!result.success || !result.primaryUrl) {
    logger.error('All storage uploads failed:', result.errors);
    throw new Error('File upload failed to all storage providers');
  }
  
  logger.info(`File uploaded successfully to: ${Object.keys(result.urls).filter(k => result.urls[k as keyof typeof result.urls]).join(', ')}`);
  
  return result.primaryUrl;
}

// Extended upload result with all URLs for mirrored storage tracking
export interface ExtendedUploadResult {
  primaryUrl: string;
  urls: {
    supabase?: string | null;
    hostinger?: string | null;
    local?: string | null;
  };
}

async function handleFileUploadExtended(file: Express.Multer.File, folder: string = 'general'): Promise<ExtendedUploadResult> {
  const storageService = getStorageService();
  
  const result: MirroredUploadResult = await storageService.upload(
    file.buffer,
    `${folder}-${file.originalname}`,
    {
      folder,
      contentType: file.mimetype
    }
  );
  
  if (!result.success || !result.primaryUrl) {
    logger.error('All storage uploads failed:', result.errors);
    throw new Error('File upload failed to all storage providers');
  }
  
  return {
    primaryUrl: result.primaryUrl,
    urls: result.urls
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Public config endpoint (no auth required) - returns non-sensitive config for frontend
  app.get('/api/public-config', (_req, res) => {
    res.json({
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || process.env.VITE_TURNSTILE_SITE_KEY || null,
      supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null,
    });
  });

  // Health check endpoint (no auth required)
  app.get('/api/health', async (_req, res) => {
    try {
      const dbCheck = await storage.healthCheck();
      const storageService = getStorageService();
      const storageStatus = storageService.getStatus();
      
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbCheck ? 'connected' : 'disconnected',
        storage: storageStatus,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: 'Health check failed',
      });
    }
  });
  
  // Storage status endpoint (admin only)
  app.get('/api/admin/storage/status', isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const storageService = getStorageService();
      const status = storageService.getStatus();
      res.json({
        success: true,
        ...status,
        message: `Storage running in ${status.mode} mode`
      });
    } catch (error) {
      logger.error('Storage status check failed:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to check storage status' 
      });
    }
  });

  // Auth middleware
  await setupAuth(app);

  // ========== AUTH ROUTES ==========
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout route - clears session cookie (POST)
  app.post('/api/auth/logout', (req: any, res) => {
    try {
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            logger.error('Session destroy error:', err);
          }
        });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.json({ success: true, message: 'Logged out' });
    }
  });

  // Logout route - GET version for browser redirects
  app.get('/api/logout', (req: any, res) => {
    try {
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            logger.error('Session destroy error:', err);
          }
        });
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
    } catch (error) {
      logger.error('Logout error:', error);
      res.redirect('/');
    }
  });

  // Session heartbeat for all authenticated users - uses isAuthenticated for OIDC token refresh and timeout enforcement
  app.post('/api/session/heartbeat', isAuthenticated, sessionHeartbeat);

  // Profile photo upload
  app.post('/api/user/profile-photo', isAuthenticated, (req: any, res, next) => {
    upload.single('photo')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "File too large. Maximum size is 10MB." });
        }
        return res.status(400).json({ message: err.message || "File upload failed" });
      }
      
      (async () => {
        try {
          if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
          }
          
          const userId = (req.user as any).id;
          const imageUrl = await handleFileUpload(req.file, 'profile');
          const updatedUser = await storage.updateUserProfileImage(userId, imageUrl);
          
          logger.info(`Profile photo uploaded for user ${userId}: ${imageUrl}`);
          res.json({ imageUrl, user: updatedUser });
        } catch (error: any) {
          logger.error("Error uploading profile photo:", error);
          res.status(500).json({ message: error.message || "Failed to upload profile photo" });
        }
      })();
    });
  });

  // Admin config endpoint - returns masked admin path only to authenticated admins
  app.get('/api/admin/config', isAdmin, async (_req, res) => {
    const adminPath = process.env.ADMIN_PATH || 'admin';
    res.json({ adminPath });
  });

  // ========== NOTIFICATION ROUTES ==========
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const notifs = await storage.getNotifications(userId);
      res.json(notifs);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const updated = await storage.markNotificationRead(id, userId);
      if (!updated) {
        return res.status(403).json({ message: "Not authorized to modify this notification" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const deleted = await storage.deleteNotification(id, userId);
      if (!deleted) {
        return res.status(403).json({ message: "Not authorized to delete this notification" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // ========== MEMBERSHIP ROUTES ==========
  app.get('/api/memberships/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
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
      // Public endpoint - only return visible facilities
      const facilities = await storage.getVisibleFacilities();
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
      if (!facility || facility.isHidden) {
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

  // ========== PUBLIC RULES ROUTE ==========
  app.get('/api/rules', async (req, res) => {
    try {
      const rules = await storage.getActiveRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching rules:", error);
      res.status(500).json({ message: "Failed to fetch rules" });
    }
  });

  // ========== PUBLIC FAQ ROUTES ==========
  app.get('/api/faq/categories', async (req, res) => {
    try {
      const categories = await storage.getActiveFaqCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching FAQ categories:", error);
      res.status(500).json({ message: "Failed to fetch FAQ categories" });
    }
  });

  app.get('/api/faq/items', async (req, res) => {
    try {
      const { categoryId } = req.query;
      const items = await storage.getActiveFaqItems(categoryId as string | undefined);
      res.json(items);
    } catch (error) {
      console.error("Error fetching FAQ items:", error);
      res.status(500).json({ message: "Failed to fetch FAQ items" });
    }
  });

  app.get('/api/faq', async (req, res) => {
    try {
      const categories = await storage.getActiveFaqCategories();
      const items = await storage.getActiveFaqItems();
      
      // Group items by category
      const faqData = categories.map(category => ({
        ...category,
        items: items.filter(item => item.categoryId === category.id)
      }));
      
      res.json(faqData);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ message: "Failed to fetch FAQs" });
    }
  });

  // ========== PUBLIC CAREERS ROUTE (salary hidden from non-admin) ==========
  app.get('/api/careers', async (req: any, res) => {
    try {
      const careers = await storage.getActiveCarers();
      
      // Check if user is authenticated and has admin role
      const isAdminUser = req.user?.id && 
        await (async () => {
          const user = await storage.getUser(req.user.id);
          return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
        })();
      
      // Always hide salary from non-admin users (regardless of salaryHidden flag)
      const publicCareers = careers.map(career => {
        if (!isAdminUser) {
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

  // ========== PUBLIC PRICING TIERS ROUTE ==========
  app.get('/api/pricing-tiers', async (req, res) => {
    try {
      const tiers = await storage.getPricingTiers();
      // Only return active tiers for public access
      const activeTiers = tiers.filter(t => t.isActive);
      res.json(activeTiers);
    } catch (error) {
      console.error("Error fetching public pricing tiers:", error);
      res.status(500).json({ message: "Failed to fetch pricing tiers" });
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
      const phases = await storage.getConstructionPhases();
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
      const userId = (req.user as any).id;
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
      const userId = (req.user as any).id;
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
        data.startTime,
        data.endTime
      );

      if (isDoubleBooked) {
        return res.status(409).json({ message: "This time slot is already booked" });
      }

      // Determine initial payment status based on payment method
      // For offline payments (cash, bank transfer), booking starts as PENDING until payment is verified
      // For online payments (card - currently disabled for Pakistan), would be CONFIRMED after payment
      const isOfflinePayment = data.paymentMethod === 'cash' || data.paymentMethod === 'bank_transfer';
      const initialPaymentStatus = isOfflinePayment ? 'PENDING_PAYMENT' : 'PENDING_PAYMENT';
      const initialBookingStatus = isOfflinePayment ? 'PENDING' : 'PENDING';

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
        status: initialBookingStatus,
        paymentStatus: initialPaymentStatus,
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

      // Send booking confirmation email
      const user = await storage.getUser(userId);
      if (user) {
        sendBookingCreatedEmail(booking, user, facility.name).catch(err => {
          console.error('[email] Failed to send booking confirmation:', err);
        });
      }

      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch('/api/bookings/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const booking = await storage.updateBookingStatus(id, 'CANCELLED');
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = await storage.getUser(userId);
      const facility = await storage.getFacility(booking.facilityId);
      const facilityName = facility?.name || 'Facility';
      
      if (user) {
        sendBookingCancelledEmail(booking, user, facilityName, 'Cancelled by user').catch(err => {
          console.error('[email] Failed to send cancellation email:', err);
        });
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

  app.get('/api/events/:identifier', async (req, res) => {
    try {
      const { identifier } = req.params;
      const event = await storage.getEventBySlugOrId(identifier);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
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
  app.get('/api/cms/bulk', async (req, res) => {
    try {
      const content = await storage.getAllCmsContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching bulk CMS content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

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
  
  // Admin heartbeat endpoint for activity tracking
  app.post('/api/admin/heartbeat', isAuthenticated, adminHeartbeat);

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

  // Seed CMS with defaults (admin only)
  app.post('/api/admin/cms/seed', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const CMS_DEFAULTS: Record<string, { title: string; content: string }> = {
        // Hero Section
        hero_title: { title: 'Hero Title', content: 'A bright, premium <span class="qd-hero-highlight">multi-sport arena</span> built for play, performance & community.' },
        hero_subtitle: { title: 'Hero Subtitle', content: 'The Quarterdeck brings state-of-the-art Padel Tennis, Squash, an Air Rifle Range, a Multipurpose Hall, and an Open Cafe/Bar experience into a single, purpose-built complex. We are setting the new standard for indoor sports and recreation in Islamabad.' },
        hero_eyebrow: { title: 'Hero Eyebrow', content: 'Target Launch: Q4 2026' },
        hero_launch_date: { title: 'Launch Date', content: '2026-10-01' },
        hero_cta_1: { title: 'Hero CTA 1', content: 'Explore Facilities' },
        hero_cta_2: { title: 'Hero CTA 2', content: 'View Site Updates' },
        hero_countdown_label: { title: 'Countdown Label', content: 'Estimated Launch Countdown' },
        hero_status_active: { title: 'Status Active Text', content: 'Construction Active' },
        hero_status_updates: { title: 'Status Updates Text', content: 'Transparent progress updates' },
        hero_status_booking: { title: 'Status Booking Text', content: 'Early booking & waitlists planned' },
        
        // About Section
        about_title: { title: 'About Title', content: 'About The Quarterdeck' },
        about_subtitle: { title: 'About Subtitle', content: 'Our core vision: Excellence in Play and Community. We are building Islamabad\'s premier destination for indoor sports, recreation, and social gathering.' },
        about_cta: { title: 'About CTA', content: 'See Our Vision' },
        about_vision_title: { title: 'Vision Title', content: 'Vision & Philosophy' },
        about_vision_content: { title: 'Vision Content', content: 'The Quarterdeck is born from a simple idea: that sports facilities should be world-class, accessible, and designed for social connection. We prioritize bright, modern architecture, superior court surfaces, and a welcoming atmosphere. Our aim is to cultivate a vibrant community around Padel, Squash, and recreational activities.' },
        about_vision_content_2: { title: 'Vision Content 2', content: 'We are locally invested and committed to transparency throughout the construction and launch phases, ensuring the highest standards of quality and service.' },
        about_tags: { title: 'About Tags', content: 'World-Class Courts,Community Focus,Transparency,All-Ages Friendly' },
        about_team_title: { title: 'Team Title', content: 'The Project Team' },
        about_team_content: { title: 'Team Content', content: 'The project is managed by a consortium of local real estate developers, sports enthusiasts, and seasoned facility operators. We have brought together expertise in engineering, architecture, and sports management to deliver an exceptional facility.' },
        about_team_credits: { title: 'Team Credits', content: 'Lead Architect: Studio 78|Structural Engineering: Eng. Solutions Pvt.|Padel Court Consultant: International Padel Federation' },
        
        // Facilities Section
        facilities_title: { title: 'Facilities Title', content: 'Facilities at a Glance' },
        facilities_subtitle: { title: 'Facilities Subtitle', content: 'The complex is engineered for high-performance sports and comfortable recreation. Click "View details" for the dedicated facility pages.' },
        facilities_cta: { title: 'Facilities CTA', content: 'Check Court Availability' },
        
        // Membership Section
        membership_title: { title: 'Membership Title', content: 'Membership & Pricing' },
        membership_subtitle: { title: 'Membership Subtitle', content: 'Choose the membership tier that fits your lifestyle. All members enjoy priority booking, exclusive discounts, and access to our world-class facilities.' },
        membership_cta: { title: 'Membership CTA', content: 'Inquire Now' },
        membership_comparison_title: { title: 'Comparison Title', content: 'Quick Comparison' },
        membership_footer: { title: 'Membership Footer', content: 'Questions about membership? Contact us for more details or to discuss corporate packages.' },
        
        // Contact Section
        contact_title: { title: 'Contact Title', content: 'Contact & Early Interest' },
        contact_subtitle: { title: 'Contact Subtitle', content: 'Connect with Our Development Team: Use the form to subscribe to our construction updates, inquire about corporate partnerships, or apply for our pre-launch membership waitlist.' },
        contact_form_title: { title: 'Form Title', content: 'Early Interest Form' },
        contact_form_subtitle: { title: 'Form Subtitle', content: 'Submit your interest below and we\'ll keep you updated on our progress and launch.' },
        contact_email: { title: 'Contact Email', content: 'info@thequarterdeck.pk' },
        contact_phone: { title: 'Contact Phone', content: '+92 51 1234567' },
        contact_address: { title: 'Contact Address', content: 'Sector F-7, Islamabad, Pakistan' },
        contact_site_status: { title: 'Site Status', content: 'The complex is currently under active construction. No public access or walk-ins are permitted for safety reasons. All updates will be digital.' },
        
        // Updates Section
        updates_title: { title: 'Updates Title', content: 'Construction Updates' },
        updates_subtitle: { title: 'Updates Subtitle', content: 'Transparent updates on progress, timeline, and achievements. Hover over each phase to see milestones.' },
        updates_cta: { title: 'Updates CTA', content: 'View Full Roadmap' },
        
        // Gallery Section
        gallery_title: { title: 'Gallery Title', content: 'Gallery & Progress Photos' },
        gallery_subtitle: { title: 'Gallery Subtitle', content: 'Visual updates from the construction site and architectural renders of the completed facility.' },
        gallery_cta: { title: 'Gallery CTA', content: 'View Full Gallery' },
        
        // Rules Section
        rules_title: { title: 'Rules Title', content: 'Rules & Safety Protocols' },
        rules_subtitle: { title: 'Rules Subtitle', content: 'Ensuring a safe, respectful, and high-quality environment for all members and guests. These are our key rules.' },
        rules_cta: { title: 'Rules CTA', content: 'View All Rules' },
        
        // Careers Section
        careers_title: { title: 'Careers Title', content: 'Careers at The Quarterdeck' },
        careers_subtitle: { title: 'Careers Subtitle', content: 'Join our team! We are looking for passionate, high-energy individuals to help us launch and run Islamabad\'s premier sports complex.' },
        careers_cta: { title: 'Careers CTA', content: 'View Open Positions' },
        
        // Events Section
        events_title: { title: 'Events Title', content: 'Events & Programs' },
        events_subtitle: { title: 'Events Subtitle', content: 'Join tournaments, training academies, and social events at The Quarterdeck.' },
        
        // Leaderboard Section
        leaderboard_title: { title: 'Leaderboard Title', content: 'Leaderboard' },
        leaderboard_subtitle: { title: 'Leaderboard Subtitle', content: 'Track your progress and compete with fellow members.' },
        
        // Footer
        footer_tagline: { title: 'Footer Tagline', content: 'Pakistan\'s Premier Sports & Recreation Complex' },
        footer_copyright: { title: 'Copyright Text', content: '2024 The Quarterdeck. All rights reserved.' },
        
        // Social URLs
        social_instagram: { title: 'Instagram URL', content: 'https://instagram.com/thequarterdeck' },
        social_facebook: { title: 'Facebook URL', content: 'https://facebook.com/thequarterdeck' },
        social_linkedin: { title: 'LinkedIn URL', content: 'https://linkedin.com/company/thequarterdeck' },
        social_youtube: { title: 'YouTube URL', content: 'https://youtube.com/@thequarterdeck' },
        social_twitter: { title: 'Twitter/X URL', content: 'https://twitter.com/thequarterdeck' },
        social_whatsapp: { title: 'WhatsApp Number', content: '+92 300 1234567' },
        
        // Operating Hours
        contact_operating_hours: { title: 'Operating Hours', content: 'Mon-Fri: 6:00 AM - 11:00 PM | Sat-Sun: 7:00 AM - 10:00 PM' },
        
        // Coming Soon Page
        coming_soon_title: { title: 'Coming Soon Title', content: 'Coming Soon' },
        coming_soon_subtitle: { title: 'Coming Soon Subtitle', content: 'Pakistan\'s Premier Sports & Recreation Complex is under construction.' },
        coming_soon_description: { title: 'Coming Soon Description', content: 'The Quarterdeck will feature world-class Padel Tennis courts, Squash facilities, an Air Rifle Range, Multipurpose Hall, and an Open Cafe/Bar experience.' },
        coming_soon_cta: { title: 'Coming Soon CTA', content: 'Join the Waitlist' },
        
        // Site Settings
        site_name: { title: 'Site Name', content: 'The Quarterdeck' },
        site_tagline: { title: 'Site Tagline', content: 'Sports & Recreation Complex' },
        
        // Section Visibility Controls (homepage)
        section_about_visible: { title: 'Show About Section', content: 'true' },
        section_facilities_visible: { title: 'Show Facilities Section', content: 'true' },
        section_updates_visible: { title: 'Show Construction Updates Section', content: 'true' },
        section_gallery_visible: { title: 'Show Gallery Section', content: 'true' },
        section_membership_visible: { title: 'Show Membership Section', content: 'true' },
        section_rules_visible: { title: 'Show Rules Section', content: 'true' },
        section_careers_visible: { title: 'Show Careers Section', content: 'true' },
      };
      
      const results = [];
      for (const [key, data] of Object.entries(CMS_DEFAULTS)) {
        const existing = await storage.getCmsContent(key);
        if (!existing) {
          const created = await storage.upsertCmsContent({
            key,
            title: data.title,
            content: data.content,
            isActive: true,
          });
          results.push(created);
        }
      }
      
      res.json({ 
        message: `Seeded ${results.length} new CMS entries`, 
        seeded: results.length,
        total: Object.keys(CMS_DEFAULTS).length 
      });
    } catch (error) {
      console.error("Error seeding CMS content:", error);
      res.status(500).json({ message: "Failed to seed CMS content" });
    }
  });

  // Seed images with defaults (admin only)
  app.post('/api/admin/images/seed', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { seedAllImages } = await import('./seeds/seedImages');
      const seedResult = await seedAllImages();
      res.json({ 
        message: "Image seeding complete",
        result: seedResult,
        locations: {
          siteImages: "Admin > Site Images - Global images (hero, footer, navbar)",
          heroSections: "Admin > Hero Sections - Per-page hero backgrounds",
          facilities: "Admin > Facilities - Each facility's imageUrl field",
          gallery: "Admin > Gallery - Gallery images"
        }
      });
    } catch (error) {
      console.error("Error seeding images:", error);
      res.status(500).json({ message: "Failed to seed images" });
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

  // File upload route for gallery images with multer error handling
  app.post('/api/admin/upload', isAuthenticated, isAdmin, (req: any, res, next) => {
    upload.single('image')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "File too large. Maximum size is 10MB." });
        }
        if (err.message && err.message.includes('Only')) {
          return res.status(400).json({ message: err.message });
        }
        logger.error("Multer error:", err);
        return res.status(400).json({ message: err.message || "File upload failed" });
      }
      
      (async () => {
        try {
          if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
          }
          
          const imageUrl = await handleFileUpload(req.file, 'gallery');
          
          logger.info(`Admin file uploaded: ${imageUrl}`);
          res.json({ 
            success: true,
            imageUrl,
            filename: req.file.originalname,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype,
          });
        } catch (error: any) {
          logger.error("Error uploading file:", error);
          res.status(500).json({ message: error.message || "Failed to upload file" });
        }
      })();
    });
  });

  // Admin Events routes
  app.get('/api/admin/events', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post('/api/admin/events', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertEventSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const event = await storage.createEvent(result.data);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.patch('/api/admin/events/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertEventSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateEvent(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete('/api/admin/events/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteEvent(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Admin Users Management routes
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/admin/users/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const result = updateUserProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const currentUser = req.user;
      const updateData = { ...result.data };
      
      // Strip role field unless current user is SUPER_ADMIN
      if (currentUser.role !== 'SUPER_ADMIN') {
        delete updateData.role;
      }
      
      const updated = await storage.updateUser(req.params.id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      
      logAdminAction({ req, action: 'USER_UPDATE', resource: 'users', resourceId: req.params.id, details: updateData });
      res.json(updated);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Admin Membership Tier Definitions routes
  app.get('/api/admin/membership-tiers', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const tiers = await storage.getMembershipTierDefinitions();
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching membership tier definitions:", error);
      res.status(500).json({ message: "Failed to fetch membership tier definitions" });
    }
  });

  app.post('/api/admin/membership-tiers', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertMembershipTierDefinitionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const tier = await storage.createMembershipTierDefinition(result.data);
      res.status(201).json(tier);
    } catch (error) {
      console.error("Error creating membership tier definition:", error);
      res.status(500).json({ message: "Failed to create membership tier definition" });
    }
  });

  app.patch('/api/admin/membership-tiers/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertMembershipTierDefinitionSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateMembershipTierDefinition(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Membership tier definition not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating membership tier definition:", error);
      res.status(500).json({ message: "Failed to update membership tier definition" });
    }
  });

  app.delete('/api/admin/membership-tiers/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteMembershipTierDefinition(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting membership tier definition:", error);
      res.status(500).json({ message: "Failed to delete membership tier definition" });
    }
  });

  // Public Membership Tier Definitions route
  app.get('/api/membership-tiers', async (req, res) => {
    try {
      const tiers = await storage.getMembershipTierDefinitions();
      // Only return active tiers for public access
      const activeTiers = tiers.filter(t => t.isActive);
      res.json(activeTiers);
    } catch (error) {
      console.error("Error fetching public membership tier definitions:", error);
      res.status(500).json({ message: "Failed to fetch membership tier definitions" });
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

  // Membership Application routes (public for users)
  app.post('/api/membership-applications', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const result = insertMembershipApplicationSchema.safeParse({
        ...req.body,
        userId: user.id,
      });
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const application = await storage.createMembershipApplication(result.data);
      
      // Send admin alert email
      sendAdminMembershipSelectionAlert(
        { email: user.email, firstName: user.firstName || '', lastName: user.lastName || '' },
        result.data.tierDesired,
        result.data.paymentAmount || 0
      ).catch(err => console.error("Error sending admin alert:", err));
      
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating membership application:", error);
      res.status(500).json({ message: "Failed to create membership application" });
    }
  });

  app.get('/api/membership-applications/mine', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const applications = await storage.getUserMembershipApplications(user.id);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching user applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.patch('/api/membership-applications/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const application = await storage.getMembershipApplication(req.params.id);
      if (!application || application.userId !== user.id) {
        return res.status(404).json({ message: "Application not found" });
      }
      if (application.status !== 'PENDING') {
        return res.status(400).json({ message: "Cannot update a processed application" });
      }
      
      // SECURITY: Only allow users to update payment proof fields
      // paymentAmount and paymentMethod are immutable after creation (set from tier price)
      // This prevents users from reducing the amount they owe
      const allowedFields = ['paymentProofUrl', 'paymentReference'];
      const safeUpdate: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          safeUpdate[field] = req.body[field];
        }
      }
      
      if (Object.keys(safeUpdate).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      const updated = await storage.updateMembershipApplication(req.params.id, safeUpdate);
      
      // If payment proof was uploaded, send admin alert
      if (req.body.paymentProofUrl) {
        sendAdminPaymentSubmissionAlert(
          { email: user.email, firstName: user.firstName || '', lastName: user.lastName || '' },
          {
            tier: application.tierDesired,
            amount: application.paymentAmount || 0,
            paymentMethod: application.paymentMethod || 'bank_transfer',
            paymentReference: req.body.paymentReference,
            paymentProofUrl: req.body.paymentProofUrl,
          }
        ).catch(err => console.error("Error sending admin alert:", err));
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Admin Membership Application routes
  app.get('/api/admin/membership-applications', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const applications = await storage.getMembershipApplications(status as string);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get('/api/admin/membership-applications/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const application = await storage.getMembershipApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      // Get user info
      const user = await storage.getUser(application.userId);
      res.json({ ...application, user });
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.post('/api/admin/membership-applications/:id/approve', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const admin = req.user as any;
      const { notes, skipAmountVerification } = req.body;
      const application = await storage.getMembershipApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // SECURITY: Verify payment amount matches expected tier price (unless admin overrides)
      const tierPrices: Record<string, number> = { FOUNDING: 35000, GOLD: 15000, SILVER: 5000, GUEST: 0 };
      const expectedAmount = tierPrices[application.tierDesired] || 0;
      if (!skipAmountVerification && application.paymentAmount !== expectedAmount) {
        return res.status(400).json({ 
          message: `Payment amount mismatch. Expected PKR ${expectedAmount} for ${application.tierDesired} tier, but received PKR ${application.paymentAmount}. Use skipAmountVerification to override.`,
          expectedAmount,
          actualAmount: application.paymentAmount,
        });
      }
      
      // Approve the application
      const approved = await storage.approveMembershipApplication(req.params.id, admin.id, notes);
      
      // Create/update membership for user
      const existingMembership = await storage.getMembership(application.userId);
      if (!existingMembership) {
        // Create new membership
        const membershipNumber = `QD${Date.now().toString(36).toUpperCase()}`;
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        await storage.createMembership({
          userId: application.userId,
          tier: application.tierDesired,
          membershipNumber,
          expiresAt,
          status: 'ACTIVE',
        });
      }
      
      // Send approval email to user
      const user = await storage.getUser(application.userId);
      if (user) {
        sendMembershipApprovedEmail({
          email: user.email,
          firstName: user.firstName || 'Member',
          tier: application.tierDesired,
        }).catch(err => console.error("Error sending approval email:", err));
      }
      
      // Log admin action
      await logAdminAction(admin.id, 'MEMBERSHIP_APPROVE', 'membership_application', req.params.id, { tier: application.tierDesired, notes });
      
      res.json(approved);
    } catch (error) {
      console.error("Error approving application:", error);
      res.status(500).json({ message: "Failed to approve application" });
    }
  });

  app.post('/api/admin/membership-applications/:id/reject', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const admin = req.user as any;
      const { notes } = req.body;
      const application = await storage.getMembershipApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const rejected = await storage.rejectMembershipApplication(req.params.id, admin.id, notes);
      
      // Send rejection email to user
      const user = await storage.getUser(application.userId);
      if (user) {
        sendMembershipRejectedEmail({
          email: user.email,
          firstName: user.firstName || 'Member',
          tier: application.tierDesired,
          reason: notes,
        }).catch(err => console.error("Error sending rejection email:", err));
      }
      
      // Log admin action
      await logAdminAction(admin.id, 'MEMBERSHIP_REJECT', 'membership_application', req.params.id, { tier: application.tierDesired, notes });
      
      res.json(rejected);
    } catch (error) {
      console.error("Error rejecting application:", error);
      res.status(500).json({ message: "Failed to reject application" });
    }
  });

  // Page Content routes (public)
  app.get('/api/page-content/:page', async (req, res) => {
    try {
      const { section } = req.query;
      const content = await storage.getPageContent(req.params.page, section as string);
      res.json(content);
    } catch (error) {
      console.error("Error fetching page content:", error);
      res.status(500).json({ message: "Failed to fetch page content" });
    }
  });

  // Admin Page Content routes
  app.get('/api/admin/page-content', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { page, section } = req.query;
      const content = await storage.getPageContent(page as string || '', section as string);
      res.json(content);
    } catch (error) {
      console.error("Error fetching page content:", error);
      res.status(500).json({ message: "Failed to fetch page content" });
    }
  });

  app.post('/api/admin/page-content', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertPageContentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const content = await storage.createPageContent(result.data);
      res.status(201).json(content);
    } catch (error) {
      console.error("Error creating page content:", error);
      res.status(500).json({ message: "Failed to create page content" });
    }
  });

  app.patch('/api/admin/page-content/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertPageContentSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updatePageContent(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating page content:", error);
      res.status(500).json({ message: "Failed to update page content" });
    }
  });

  app.delete('/api/admin/page-content/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deletePageContent(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting page content:", error);
      res.status(500).json({ message: "Failed to delete page content" });
    }
  });

  // Comparison Features routes (public)
  app.get('/api/comparison-features', async (req, res) => {
    try {
      const features = await storage.getComparisonFeatures();
      res.json(features);
    } catch (error) {
      console.error("Error fetching comparison features:", error);
      res.status(500).json({ message: "Failed to fetch comparison features" });
    }
  });

  // Admin Comparison Features routes
  app.get('/api/admin/comparison-features', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const features = await storage.getComparisonFeatures();
      res.json(features);
    } catch (error) {
      console.error("Error fetching comparison features:", error);
      res.status(500).json({ message: "Failed to fetch comparison features" });
    }
  });

  app.post('/api/admin/comparison-features', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertComparisonFeatureSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const feature = await storage.createComparisonFeature(result.data);
      res.status(201).json(feature);
    } catch (error) {
      console.error("Error creating comparison feature:", error);
      res.status(500).json({ message: "Failed to create comparison feature" });
    }
  });

  app.patch('/api/admin/comparison-features/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertComparisonFeatureSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateComparisonFeature(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Feature not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating comparison feature:", error);
      res.status(500).json({ message: "Failed to update comparison feature" });
    }
  });

  app.delete('/api/admin/comparison-features/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteComparisonFeature(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comparison feature:", error);
      res.status(500).json({ message: "Failed to delete comparison feature" });
    }
  });

  // Member Benefits routes (public)
  app.get('/api/member-benefits', async (req, res) => {
    try {
      const benefits = await storage.getMemberBenefits();
      res.json(benefits);
    } catch (error) {
      console.error("Error fetching member benefits:", error);
      res.status(500).json({ message: "Failed to fetch member benefits" });
    }
  });

  // Admin Member Benefits routes
  app.get('/api/admin/member-benefits', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const benefits = await storage.getMemberBenefits();
      res.json(benefits);
    } catch (error) {
      console.error("Error fetching member benefits:", error);
      res.status(500).json({ message: "Failed to fetch member benefits" });
    }
  });

  app.post('/api/admin/member-benefits', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertMemberBenefitSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const benefit = await storage.createMemberBenefit(result.data);
      res.status(201).json(benefit);
    } catch (error) {
      console.error("Error creating member benefit:", error);
      res.status(500).json({ message: "Failed to create member benefit" });
    }
  });

  app.patch('/api/admin/member-benefits/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertMemberBenefitSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateMemberBenefit(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Benefit not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating member benefit:", error);
      res.status(500).json({ message: "Failed to update member benefit" });
    }
  });

  app.delete('/api/admin/member-benefits/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteMemberBenefit(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting member benefit:", error);
      res.status(500).json({ message: "Failed to delete member benefit" });
    }
  });

  // Career Benefits routes (public)
  app.get('/api/career-benefits', async (req, res) => {
    try {
      const benefits = await storage.getCareerBenefits();
      res.json(benefits);
    } catch (error) {
      console.error("Error fetching career benefits:", error);
      res.status(500).json({ message: "Failed to fetch career benefits" });
    }
  });

  // Admin Career Benefits routes
  app.get('/api/admin/career-benefits', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const benefits = await storage.getCareerBenefits();
      res.json(benefits);
    } catch (error) {
      console.error("Error fetching career benefits:", error);
      res.status(500).json({ message: "Failed to fetch career benefits" });
    }
  });

  app.post('/api/admin/career-benefits', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertCareerBenefitSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const benefit = await storage.createCareerBenefit(result.data);
      res.status(201).json(benefit);
    } catch (error) {
      console.error("Error creating career benefit:", error);
      res.status(500).json({ message: "Failed to create career benefit" });
    }
  });

  app.patch('/api/admin/career-benefits/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertCareerBenefitSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateCareerBenefit(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Benefit not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating career benefit:", error);
      res.status(500).json({ message: "Failed to update career benefit" });
    }
  });

  app.delete('/api/admin/career-benefits/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCareerBenefit(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting career benefit:", error);
      res.status(500).json({ message: "Failed to delete career benefit" });
    }
  });

  // Admin FAQ routes
  app.get('/api/admin/faq/categories', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categories = await storage.getFaqCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching FAQ categories:", error);
      res.status(500).json({ message: "Failed to fetch FAQ categories" });
    }
  });

  app.post('/api/admin/faq/categories', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertFaqCategorySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const category = await storage.createFaqCategory(result.data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating FAQ category:", error);
      res.status(500).json({ message: "Failed to create FAQ category" });
    }
  });

  app.patch('/api/admin/faq/categories/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertFaqCategorySchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateFaqCategory(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "FAQ category not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating FAQ category:", error);
      res.status(500).json({ message: "Failed to update FAQ category" });
    }
  });

  app.delete('/api/admin/faq/categories/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteFaqCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting FAQ category:", error);
      res.status(500).json({ message: "Failed to delete FAQ category" });
    }
  });

  app.get('/api/admin/faq/items', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { categoryId } = req.query;
      const items = await storage.getFaqItems(categoryId as string | undefined);
      res.json(items);
    } catch (error) {
      console.error("Error fetching FAQ items:", error);
      res.status(500).json({ message: "Failed to fetch FAQ items" });
    }
  });

  app.post('/api/admin/faq/items', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertFaqItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const item = await storage.createFaqItem(result.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating FAQ item:", error);
      res.status(500).json({ message: "Failed to create FAQ item" });
    }
  });

  app.patch('/api/admin/faq/items/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertFaqItemSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateFaqItem(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "FAQ item not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating FAQ item:", error);
      res.status(500).json({ message: "Failed to update FAQ item" });
    }
  });

  app.delete('/api/admin/faq/items/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteFaqItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting FAQ item:", error);
      res.status(500).json({ message: "Failed to delete FAQ item" });
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

  // Admin Facility Add-ons routes
  app.get('/api/admin/facilities/:facilityId/addons', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const addons = await storage.getFacilityAddOns(req.params.facilityId);
      res.json(addons);
    } catch (error) {
      console.error("Error fetching facility addons:", error);
      res.status(500).json({ message: "Failed to fetch facility addons" });
    }
  });

  app.post('/api/admin/facilities/:facilityId/addons', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertFacilityAddOnSchema.safeParse({
        ...req.body,
        facilityId: req.params.facilityId
      });
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const addon = await storage.createFacilityAddOn(result.data);
      res.status(201).json(addon);
    } catch (error) {
      console.error("Error creating facility addon:", error);
      res.status(500).json({ message: "Failed to create facility addon" });
    }
  });

  app.patch('/api/admin/facility-addons/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertFacilityAddOnSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateFacilityAddOn(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Add-on not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating facility addon:", error);
      res.status(500).json({ message: "Failed to update facility addon" });
    }
  });

  app.delete('/api/admin/facility-addons/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteFacilityAddOn(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting facility addon:", error);
      res.status(500).json({ message: "Failed to delete facility addon" });
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

  // Facility-Venue relationship routes
  app.get('/api/admin/facilities/:facilityId/venues', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const facilityVenues = await storage.getFacilityVenuesByFacility(req.params.facilityId);
      res.json(facilityVenues);
    } catch (error) {
      console.error("Error fetching facility venues:", error);
      res.status(500).json({ message: "Failed to fetch facility venues" });
    }
  });

  app.post('/api/admin/facilities/:facilityId/venues', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { venueId, status, resourceCount, priceOverride } = req.body;
      
      // Validate required fields
      if (!venueId || typeof venueId !== 'string') {
        return res.status(400).json({ message: "venueId is required and must be a string" });
      }
      
      // Validate status if provided
      const validStatuses = ['PLANNED', 'COMING_SOON', 'ACTIVE'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
      }
      
      // Validate resourceCount if provided
      if (resourceCount !== undefined && (typeof resourceCount !== 'number' || resourceCount < 1)) {
        return res.status(400).json({ message: "resourceCount must be a positive number" });
      }
      
      // Validate priceOverride if provided
      if (priceOverride !== undefined && priceOverride !== null && (typeof priceOverride !== 'number' || priceOverride < 0)) {
        return res.status(400).json({ message: "priceOverride must be a non-negative number or null" });
      }
      
      const data = {
        facilityId: req.params.facilityId,
        venueId,
        status: status || 'PLANNED',
        resourceCount: resourceCount || 1,
        priceOverride: priceOverride ?? null,
      };
      const facilityVenue = await storage.createFacilityVenue(data);
      res.status(201).json(facilityVenue);
    } catch (error) {
      console.error("Error creating facility venue:", error);
      res.status(500).json({ message: "Failed to create facility venue" });
    }
  });

  app.patch('/api/admin/facility-venues/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status, resourceCount, priceOverride } = req.body;
      
      // Validate status if provided
      const validStatuses = ['PLANNED', 'COMING_SOON', 'ACTIVE'];
      if (status !== undefined && !validStatuses.includes(status)) {
        return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
      }
      
      // Validate resourceCount if provided
      if (resourceCount !== undefined && (typeof resourceCount !== 'number' || resourceCount < 1)) {
        return res.status(400).json({ message: "resourceCount must be a positive number" });
      }
      
      // Validate priceOverride if provided
      if (priceOverride !== undefined && priceOverride !== null && (typeof priceOverride !== 'number' || priceOverride < 0)) {
        return res.status(400).json({ message: "priceOverride must be a non-negative number or null" });
      }
      
      const updateData: { status?: "PLANNED" | "COMING_SOON" | "ACTIVE"; resourceCount?: number; priceOverride?: number | null } = {};
      if (status !== undefined) updateData.status = status as "PLANNED" | "COMING_SOON" | "ACTIVE";
      if (resourceCount !== undefined) updateData.resourceCount = resourceCount;
      if (priceOverride !== undefined) updateData.priceOverride = priceOverride;
      
      const facilityVenue = await storage.updateFacilityVenue(req.params.id, updateData);
      if (!facilityVenue) {
        return res.status(404).json({ message: "Facility venue not found" });
      }
      res.json(facilityVenue);
    } catch (error) {
      console.error("Error updating facility venue:", error);
      res.status(500).json({ message: "Failed to update facility venue" });
    }
  });

  app.delete('/api/admin/facility-venues/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteFacilityVenue(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting facility venue:", error);
      res.status(500).json({ message: "Failed to delete facility venue" });
    }
  });

  // Admin Construction Phases routes
  app.get('/api/admin/construction-phases', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const phases = await storage.getConstructionPhases();
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

  // ========== ADMIN AUDIT LOGS ROUTES ==========
  
  app.get('/api/admin/audit-logs', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ========== ADMIN BOOKING ROUTES ==========
  
  app.get('/api/admin/bookings', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allBookings = await storage.getAllBookings();
      res.json(allBookings);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/admin/bookings/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const booking = await storage.getBookingById(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  const paymentVerificationSchema = z.object({
    paymentStatus: z.enum(['PENDING_PAYMENT', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED']).optional(),
    paymentProofUrl: z.string().optional(),
    paymentNotes: z.string().optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
  });

  app.patch('/api/admin/bookings/:id/payment', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const result = paymentVerificationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const adminUserId = (req.user as any).id;
      const updateData: any = { ...result.data };
      
      // If verifying payment, set verification details
      if (result.data.paymentStatus === 'VERIFIED') {
        updateData.paymentVerifiedBy = adminUserId;
        updateData.paymentVerifiedAt = new Date();
        updateData.status = 'CONFIRMED'; // Auto-confirm booking when payment is verified
      }

      const booking = await storage.updateBookingPayment(req.params.id, updateData);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Send email notification based on payment status
      const user = await storage.getUser(booking.userId);
      const facility = await storage.getFacility(booking.facilityId);
      const facilityName = facility?.name || 'Facility';
      
      if (user) {
        if (result.data.paymentStatus === 'VERIFIED') {
          sendPaymentVerifiedEmail(booking, user, facilityName).catch(err => {
            console.error('[email] Failed to send payment verified email:', err);
          });
        } else if (result.data.paymentStatus === 'REJECTED') {
          sendPaymentRejectedEmail(booking, user, facilityName, result.data.paymentNotes).catch(err => {
            console.error('[email] Failed to send payment rejected email:', err);
          });
        }
      }

      // Log admin action
      logAdminAction({
        req,
        action: result.data.paymentStatus === 'VERIFIED' ? 'VERIFY_PAYMENT' : 
                result.data.paymentStatus === 'REJECTED' ? 'REJECT_PAYMENT' : 'UPDATE_PAYMENT',
        resource: 'booking',
        resourceId: req.params.id,
        details: { paymentStatus: result.data.paymentStatus, bookingId: booking.id }
      });

      res.json(booking);
    } catch (error) {
      console.error("Error updating booking payment:", error);
      res.status(500).json({ message: "Failed to update booking payment" });
    }
  });

  app.patch('/api/admin/bookings/:id/status', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status, cancelReason } = req.body;
      if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const booking = await storage.updateBookingStatus(req.params.id, status, cancelReason);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Send cancellation email if booking is cancelled
      if (status === 'CANCELLED') {
        const user = await storage.getUser(booking.userId);
        const facility = await storage.getFacility(booking.facilityId);
        const facilityName = facility?.name || 'Facility';
        
        if (user) {
          sendBookingCancelledEmail(booking, user, facilityName, cancelReason).catch(err => {
            console.error('[email] Failed to send cancellation email:', err);
          });
        }
      }

      // Log admin action
      logAdminAction({
        req,
        action: status === 'CANCELLED' ? 'CANCEL_BOOKING' : 'UPDATE_BOOKING_STATUS',
        resource: 'booking',
        resourceId: req.params.id,
        details: { status, cancelReason }
      });

      res.json(booking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Event Registration Routes - requires authentication to prevent ghost entries
  app.post('/api/events/:eventId/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "You must be logged in to register for events" });
      }
      
      const { eventId } = req.params;
      const { fullName, email, phone, guestCount, notes } = req.body;
      
      // Check if user is already registered
      const isAlreadyRegistered = await storage.isUserRegisteredForEvent(userId, eventId);
      if (isAlreadyRegistered) {
        return res.status(400).json({ message: "You are already registered for this event" });
      }
      
      // Check if email is already registered for this event (prevent duplicates)
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

      // Send event registration confirmation email
      const event = await storage.getEvent(eventId);
      if (event && email) {
        sendEventRegistrationEmail(event, { firstName: fullName, email }, 'pending').catch(err => {
          console.error('[email] Failed to send event registration email:', err);
        });
      }

      res.status(201).json(registration);
    } catch (error) {
      console.error("Error registering for event:", error);
      res.status(500).json({ message: "Failed to register for event" });
    }
  });

  app.get('/api/user/event-registrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const registrations = await storage.getUserEventRegistrations(userId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching user event registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.get('/api/events/:eventId/registration-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
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
      const userId = (req.user as any).id;
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
      
      sendCareerApplicationEmail({ 
        name: fullName, 
        email, 
        position: 'General Application' 
      }).catch(err => {
        console.error('[email] Failed to send general application confirmation:', err);
      });
      
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
      
      if (validCareer) {
        sendCareerApplicationEmail({ 
          name: fullName, 
          email, 
          position: validCareer.title 
        }).catch(err => {
          console.error('[email] Failed to send career application confirmation:', err);
        });
      }
      
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
      
      sendContactFormEmail({ name, email, phone, message }).catch(err => {
        console.error('[email] Failed to send contact form notification:', err);
      });
      
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

  // ========== OPERATING HOURS ROUTES ==========
  app.get('/api/operating-hours', async (req, res) => {
    try {
      const { venueId, facilityId } = req.query;
      const hours = await storage.getOperatingHours(
        venueId as string | undefined,
        facilityId as string | undefined
      );
      res.json(hours);
    } catch (error) {
      console.error("Error fetching operating hours:", error);
      res.status(500).json({ message: "Failed to fetch operating hours" });
    }
  });

  app.post('/api/admin/operating-hours', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertOperatingHoursSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const hours = await storage.createOperatingHours(result.data);
      res.status(201).json(hours);
    } catch (error) {
      console.error("Error creating operating hours:", error);
      res.status(500).json({ message: "Failed to create operating hours" });
    }
  });

  app.patch('/api/admin/operating-hours/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const hours = await storage.updateOperatingHours(req.params.id, req.body);
      if (!hours) {
        return res.status(404).json({ message: "Operating hours not found" });
      }
      res.json(hours);
    } catch (error) {
      console.error("Error updating operating hours:", error);
      res.status(500).json({ message: "Failed to update operating hours" });
    }
  });

  app.delete('/api/admin/operating-hours/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteOperatingHours(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting operating hours:", error);
      res.status(500).json({ message: "Failed to delete operating hours" });
    }
  });

  // ========== PEAK WINDOWS ROUTES ==========
  app.get('/api/peak-windows', async (req, res) => {
    try {
      const { venueId, facilityId } = req.query;
      const windows = await storage.getPeakWindows(
        venueId as string | undefined,
        facilityId as string | undefined
      );
      res.json(windows);
    } catch (error) {
      console.error("Error fetching peak windows:", error);
      res.status(500).json({ message: "Failed to fetch peak windows" });
    }
  });

  app.post('/api/admin/peak-windows', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertPeakWindowSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const window = await storage.createPeakWindow(result.data);
      res.status(201).json(window);
    } catch (error) {
      console.error("Error creating peak window:", error);
      res.status(500).json({ message: "Failed to create peak window" });
    }
  });

  app.patch('/api/admin/peak-windows/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const window = await storage.updatePeakWindow(req.params.id, req.body);
      if (!window) {
        return res.status(404).json({ message: "Peak window not found" });
      }
      res.json(window);
    } catch (error) {
      console.error("Error updating peak window:", error);
      res.status(500).json({ message: "Failed to update peak window" });
    }
  });

  app.delete('/api/admin/peak-windows/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deletePeakWindow(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting peak window:", error);
      res.status(500).json({ message: "Failed to delete peak window" });
    }
  });

  // ========== HALL ACTIVITIES ROUTES ==========
  app.get('/api/hall-activities', async (req, res) => {
    try {
      const { facilityId } = req.query;
      const activities = await storage.getHallActivities(facilityId as string | undefined);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching hall activities:", error);
      res.status(500).json({ message: "Failed to fetch hall activities" });
    }
  });

  app.get('/api/hall-activities/:id', async (req, res) => {
    try {
      const activity = await storage.getHallActivity(req.params.id);
      if (!activity) {
        return res.status(404).json({ message: "Hall activity not found" });
      }
      res.json(activity);
    } catch (error) {
      console.error("Error fetching hall activity:", error);
      res.status(500).json({ message: "Failed to fetch hall activity" });
    }
  });

  app.post('/api/admin/hall-activities', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertHallActivitySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const activity = await storage.createHallActivity(result.data);
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error creating hall activity:", error);
      res.status(500).json({ message: "Failed to create hall activity" });
    }
  });

  app.patch('/api/admin/hall-activities/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const activity = await storage.updateHallActivity(req.params.id, req.body);
      if (!activity) {
        return res.status(404).json({ message: "Hall activity not found" });
      }
      res.json(activity);
    } catch (error) {
      console.error("Error updating hall activity:", error);
      res.status(500).json({ message: "Failed to update hall activity" });
    }
  });

  app.delete('/api/admin/hall-activities/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteHallActivity(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting hall activity:", error);
      res.status(500).json({ message: "Failed to delete hall activity" });
    }
  });

  // Site Settings Routes
  app.get('/api/site-settings', async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      const settingsMap = settings.reduce((acc, setting) => {
        if (setting.value !== null) {
          acc[setting.key] = setting.value;
        }
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

  // ========== SITE IMAGES ROUTES ==========
  app.get('/api/site-images', async (req, res) => {
    try {
      const { page } = req.query;
      let images;
      if (page) {
        images = await storage.getSiteImagesByPage(page as string);
      } else {
        images = await storage.getSiteImages();
      }
      res.json(images);
    } catch (error) {
      console.error("Error fetching site images:", error);
      res.status(500).json({ message: "Failed to fetch site images" });
    }
  });

  app.get('/api/site-images/:key', async (req, res) => {
    try {
      const image = await storage.getSiteImage(req.params.key);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      console.error("Error fetching site image:", error);
      res.status(500).json({ message: "Failed to fetch site image" });
    }
  });

  app.get('/api/admin/site-images', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const images = await storage.getSiteImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching site images:", error);
      res.status(500).json({ message: "Failed to fetch site images" });
    }
  });

  app.post('/api/admin/site-images', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertSiteImageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const image = await storage.createSiteImage(result.data);
      res.status(201).json(image);
    } catch (error) {
      console.error("Error creating site image:", error);
      res.status(500).json({ message: "Failed to create site image" });
    }
  });

  app.patch('/api/admin/site-images/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const image = await storage.updateSiteImage(req.params.id, req.body);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      console.error("Error updating site image:", error);
      res.status(500).json({ message: "Failed to update site image" });
    }
  });

  app.delete('/api/admin/site-images/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteSiteImage(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting site image:", error);
      res.status(500).json({ message: "Failed to delete site image" });
    }
  });

  // ========== NAVBAR ITEMS ROUTES ==========
  app.get('/api/navbar-items', async (req, res) => {
    try {
      const items = await storage.getNavbarItems();
      res.json(items.filter(item => item.isVisible));
    } catch (error) {
      console.error("Error fetching navbar items:", error);
      res.status(500).json({ message: "Failed to fetch navbar items" });
    }
  });

  app.get('/api/admin/navbar-items', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const items = await storage.getNavbarItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching navbar items:", error);
      res.status(500).json({ message: "Failed to fetch navbar items" });
    }
  });

  app.post('/api/admin/navbar-items', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertNavbarItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const item = await storage.createNavbarItem(result.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating navbar item:", error);
      res.status(500).json({ message: "Failed to create navbar item" });
    }
  });

  app.patch('/api/admin/navbar-items/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const item = await storage.updateNavbarItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ message: "Navbar item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating navbar item:", error);
      res.status(500).json({ message: "Failed to update navbar item" });
    }
  });

  app.delete('/api/admin/navbar-items/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteNavbarItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting navbar item:", error);
      res.status(500).json({ message: "Failed to delete navbar item" });
    }
  });

  // ========== BLOG ROUTES ==========
  app.get('/api/blogs', async (req, res) => {
    try {
      const blogs = await storage.getBlogs(true);
      res.json(blogs);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      res.status(500).json({ message: "Failed to fetch blogs" });
    }
  });

  app.get('/api/blogs/:slug', async (req, res) => {
    try {
      const blog = await storage.getBlogBySlug(req.params.slug);
      if (!blog || !blog.isPublished) {
        return res.status(404).json({ message: "Blog not found" });
      }
      res.json(blog);
    } catch (error) {
      console.error("Error fetching blog:", error);
      res.status(500).json({ message: "Failed to fetch blog" });
    }
  });

  app.get('/api/admin/blogs', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const blogs = await storage.getBlogs(false);
      res.json(blogs);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      res.status(500).json({ message: "Failed to fetch blogs" });
    }
  });

  app.post('/api/admin/blogs', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertBlogSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const blog = await storage.createBlog(result.data);
      res.status(201).json(blog);
    } catch (error) {
      console.error("Error creating blog:", error);
      res.status(500).json({ message: "Failed to create blog" });
    }
  });

  app.patch('/api/admin/blogs/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertBlogSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateBlog(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Blog not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating blog:", error);
      res.status(500).json({ message: "Failed to update blog" });
    }
  });

  app.delete('/api/admin/blogs/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteBlog(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting blog:", error);
      res.status(500).json({ message: "Failed to delete blog" });
    }
  });

  // ========== HERO SECTION ROUTES ==========
  app.get('/api/hero-sections', async (req, res) => {
    try {
      const heroes = await storage.getHeroSections();
      res.json(heroes);
    } catch (error) {
      console.error("Error fetching hero sections:", error);
      res.status(500).json({ message: "Failed to fetch hero sections" });
    }
  });

  app.get('/api/hero-sections/:page', async (req, res) => {
    try {
      const hero = await storage.getHeroSection(req.params.page);
      if (!hero) {
        return res.status(404).json({ message: "Hero section not found" });
      }
      res.json(hero);
    } catch (error) {
      console.error("Error fetching hero section:", error);
      res.status(500).json({ message: "Failed to fetch hero section" });
    }
  });

  app.get('/api/admin/hero-sections', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const heroes = await storage.getHeroSections();
      res.json(heroes);
    } catch (error) {
      console.error("Error fetching hero sections:", error);
      res.status(500).json({ message: "Failed to fetch hero sections" });
    }
  });

  app.post('/api/admin/hero-sections', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertHeroSectionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const hero = await storage.createHeroSection(result.data);
      res.status(201).json(hero);
    } catch (error) {
      console.error("Error creating hero section:", error);
      res.status(500).json({ message: "Failed to create hero section" });
    }
  });

  app.patch('/api/admin/hero-sections/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertHeroSectionSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateHeroSection(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Hero section not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating hero section:", error);
      res.status(500).json({ message: "Failed to update hero section" });
    }
  });

  app.delete('/api/admin/hero-sections/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteHeroSection(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting hero section:", error);
      res.status(500).json({ message: "Failed to delete hero section" });
    }
  });

  // ========== CTA ROUTES ==========
  app.get('/api/ctas', async (req, res) => {
    try {
      const ctas = await storage.getCtas();
      res.json(ctas);
    } catch (error) {
      console.error("Error fetching CTAs:", error);
      res.status(500).json({ message: "Failed to fetch CTAs" });
    }
  });

  app.get('/api/ctas/:key', async (req, res) => {
    try {
      const cta = await storage.getCta(req.params.key);
      if (!cta) {
        return res.status(404).json({ message: "CTA not found" });
      }
      res.json(cta);
    } catch (error) {
      console.error("Error fetching CTA:", error);
      res.status(500).json({ message: "Failed to fetch CTA" });
    }
  });

  app.get('/api/admin/ctas', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const ctas = await storage.getCtas();
      res.json(ctas);
    } catch (error) {
      console.error("Error fetching CTAs:", error);
      res.status(500).json({ message: "Failed to fetch CTAs" });
    }
  });

  app.post('/api/admin/ctas', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertCtaSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const cta = await storage.createCta(result.data);
      res.status(201).json(cta);
    } catch (error) {
      console.error("Error creating CTA:", error);
      res.status(500).json({ message: "Failed to create CTA" });
    }
  });

  app.patch('/api/admin/ctas/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertCtaSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateCta(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "CTA not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating CTA:", error);
      res.status(500).json({ message: "Failed to update CTA" });
    }
  });

  app.delete('/api/admin/ctas/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCta(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting CTA:", error);
      res.status(500).json({ message: "Failed to delete CTA" });
    }
  });

  // ========== TESTIMONIAL ROUTES ==========
  app.get('/api/testimonials', async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials(true);
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  app.get('/api/testimonials/featured', async (req, res) => {
    try {
      const testimonials = await storage.getFeaturedTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching featured testimonials:", error);
      res.status(500).json({ message: "Failed to fetch featured testimonials" });
    }
  });

  app.get('/api/admin/testimonials', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials(false);
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  app.post('/api/admin/testimonials', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertTestimonialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const testimonial = await storage.createTestimonial(result.data);
      res.status(201).json(testimonial);
    } catch (error) {
      console.error("Error creating testimonial:", error);
      res.status(500).json({ message: "Failed to create testimonial" });
    }
  });

  app.patch('/api/admin/testimonials/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertTestimonialSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateTestimonial(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating testimonial:", error);
      res.status(500).json({ message: "Failed to update testimonial" });
    }
  });

  app.delete('/api/admin/testimonials/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteTestimonial(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      res.status(500).json({ message: "Failed to delete testimonial" });
    }
  });

  // ========== EVENT GALLERY ROUTES ==========
  app.get('/api/events/:eventId/gallery', async (req, res) => {
    try {
      const images = await storage.getEventGallery(req.params.eventId);
      res.json(images);
    } catch (error) {
      console.error("Error fetching event gallery:", error);
      res.status(500).json({ message: "Failed to fetch event gallery" });
    }
  });

  app.post('/api/admin/events/:eventId/gallery', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertEventGallerySchema.safeParse({ ...req.body, eventId: req.params.eventId });
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const image = await storage.createEventGalleryImage(result.data);
      res.status(201).json(image);
    } catch (error) {
      console.error("Error creating event gallery image:", error);
      res.status(500).json({ message: "Failed to create event gallery image" });
    }
  });

  app.patch('/api/admin/event-gallery/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertEventGallerySchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const updated = await storage.updateEventGalleryImage(req.params.id, result.data);
      if (!updated) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating event gallery image:", error);
      res.status(500).json({ message: "Failed to update event gallery image" });
    }
  });

  app.delete('/api/admin/event-gallery/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteEventGalleryImage(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event gallery image:", error);
      res.status(500).json({ message: "Failed to delete event gallery image" });
    }
  });

  return httpServer;
}
