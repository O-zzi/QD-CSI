# The Quarterdeck - Sports & Recreation Complex

## Overview

The Quarterdeck is a full-stack web application for a sports and recreation complex in Islamabad, targeting a Q4 2026 launch. It provides a public landing page and a comprehensive booking system for facilities like Padel Tennis, Squash, Air Rifle Range, Bridge Room, and a Multipurpose Hall. Key features include membership tiers, real-time booking management, event registration, a leaderboard, and a robust CMS for dynamic content. The platform aims to streamline operations and enhance user experience for recreation complex management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend uses React 18 with TypeScript, Vite for bundling, Wouter for routing, and React Query for server state management. UI components are built with Shadcn/ui (New York style) on Radix UI primitives, styled with Tailwind CSS and custom CSS variables for theming. The design strictly preserves the existing HTML/Tailwind implementation, adhering to specific design guidelines for color palette, typography, spacing, and component patterns, and is mobile-first responsive.

### Backend Architecture

The backend is built with Express.js and Node.js (with WebSocket capability), utilizing custom middleware for request processing. Authentication is session-based via Replit Auth (OpenID Connect) and Passport.js, with user data synchronized to a PostgreSQL database. The API is RESTful, covering authentication, memberships, bookings, events, leaderboards, and CMS content. Drizzle ORM is used for type-safe database interactions following a schema-first approach with Zod validation.

### Database Architecture

The PostgreSQL database schema is managed with Drizzle ORM and Drizzle Kit, defined in TypeScript. Core tables include `users`, `sessions`, `memberships`, `facilities`, `bookings`, `events`, `event_registrations`, `leaderboard`, `cms_content`, `career_applications`, `contact_submissions`, and `site_settings`, among others. Relationships are defined to support user-membership, user-booking, facility-addon, and event-registration flows. PostgreSQL enums and Drizzle-Zod integration ensure type safety and runtime validation. Multi-venue support, construction timelines, and site-wide CMS fields are also managed through dedicated tables.

### Key User Interactions

**Event Registration:** Authenticated users can register/cancel for events through the Events page. The system tracks enrollment counts and prevents duplicate registrations.

**Career Applications:** Job seekers can apply for open positions through a modal form on the Careers page. Applications include name, email, phone, optional CV/LinkedIn URLs, and cover letter.

**Contact Form:** Visitors can submit inquiries through the contact section on the landing page. Submissions are stored in the database for admin review.

**Site Settings:** Admin-configurable settings for contact information and social media URLs, managed via the database.

### Admin Dashboard

An `/admin` panel provides role-based access (ADMIN, SUPER_ADMIN) for managing CMS content, facilities, pricing, announcements, careers, rules, and gallery images. All admin API endpoints are protected and use Zod for validation.

### Membership Tier Management

Dynamic membership tier definitions stored in `membership_tier_definitions` table. Features include:
- **Tier Properties**: slug, displayName, description, color (hex), discountPercent, guestPassesIncluded, benefits array
- **Admin UI**: Full CRUD at `/qdadmin2026/membership-tiers` with color picker, benefit management, and active/inactive toggle
- **Default Tiers**: founding (25% discount, 10 guests), gold (20%, 4 guests), silver (10%, 2 guests), guest (0%, 0 guests)
- **Integration**: PricingManagement dropdown dynamically populated from tier definitions

Key files:
- `shared/schema.ts`: membershipTierDefinitions table and schemas
- `server/migrations.ts`: Runtime table creation and seeding
- `server/storage.ts`: CRUD methods for tier definitions
- `server/routes.ts`: Admin API endpoints at `/api/admin/membership-tiers`
- `client/src/pages/admin/MembershipTierManagement.tsx`: Admin UI component

### Security & Validation

The system incorporates double-booking prevention, membership number format validation (e.g., QD-XXXX), payer validation for booking on behalf of others, and role-based access control for admin routes. Server-side validation with Zod is implemented across all critical endpoints, including payment processing.

### Site-Wide Session Security

The entire website has uniform session security for all authenticated users:
- **Re-authentication Timeout**: Users must have logged in within the last 10 minutes to access any protected routes
- **Inactivity Timeout**: All sessions expire after 2 minutes of inactivity
- **Activity Tracking**: User activity is tracked via `lastActivityAt` and `lastAuthenticatedAt` timestamps in the database
- **Heartbeat System**: Frontend sends activity heartbeats every 30 seconds to maintain sessions
- **Automatic Logout**: Users are automatically redirected to login when sessions expire

Key files:
- `server/replitAuth.ts`: Contains `isAuthenticated` middleware with timeout checks for all users, plus `isAdmin` for admin-only access
- `client/src/hooks/useSession.ts`: Frontend session tracking hook for all authenticated users
- `client/src/hooks/useAdminSession.ts`: Legacy admin-specific session hook (uses same backend)
- `client/src/components/SessionProvider.tsx`: App-wide session management wrapper
- `client/src/pages/admin/AdminLayout.tsx`: Admin layout with session management

API Endpoints:
- `POST /api/session/heartbeat`: Session heartbeat for all authenticated users
- `POST /api/admin/heartbeat`: Legacy admin heartbeat (same behavior)

## External Dependencies

**Authentication & Session Management:**
- Replit Auth (OpenID Connect)
- PostgreSQL (for session persistence via `connect-pg-simple`)
- `openid-client` (for JWT token management)

**UI Component Libraries:**
- Radix UI
- Shadcn/ui
- Embla Carousel
- `cmdk`
- Lucide React
- `class-variance-authority`

**Form Handling & Validation:**
- React Hook Form
- `@hookform/resolvers`
- Zod
- `zod-validation-error`

**Date & Time Management:**
- `date-fns`

**Development Tools:**
- `tsx`
- `esbuild`

**Styling & Theming:**
- Tailwind CSS v3+
- PostCSS
- `tailwind-merge`, `clsx`

**Database & ORM:**
- `pg` (node-postgres)
- Drizzle ORM
- `drizzle-zod`

**Payment Processing:**
- Offline Payment System (Bank Transfer, Cash) for Pakistan market
- Stripe integration disabled - Stripe client libraries remain for future use
- Payment verification workflow: PENDING_PAYMENT -> PENDING_VERIFICATION -> VERIFIED/REJECTED
- Admin booking management at /admin/bookings for payment verification

**Email Notifications:**
- Resend API integration for transactional emails
- Email templates for: Booking confirmation, Payment verified/rejected, Booking cancelled, Event registration, Welcome email, Contact form, Career applications, Email verification, Password reset, Membership approved/rejected, Renewal reminders (7/3/1 day warnings)

**Email Configuration (for testing):**
To enable email notifications:
1. Create a free account at https://resend.com
2. Get your API key from the Resend dashboard
3. Add `RESEND_API_KEY` to your Replit Secrets
4. Optionally set `EMAIL_FROM` (default: "The Quarterdeck <noreply@thequarterdeck.pk>")
5. Optionally set `ADMIN_EMAIL` for contact form notifications

Note: Without the API key, emails will be logged to console but not sent.

**Utility Libraries:**
- `nanoid`
- `memoizee`
- `ws` (for WebSocket infrastructure)

## Discount Logic

Membership discounts are applied **ONLY during off-peak hours (10 AM - 5 PM)**:
- **Founding Members:** 25% discount (off-peak only)
- **Gold Members:** 20% discount (off-peak only)
- **Silver Members:** 10% discount (off-peak only)
- **Guest/Non-members:** No discount

Peak hours (before 10 AM or after 5 PM) do not receive any discount regardless of membership tier.

## Member Dashboard & Notifications (Batch 4)

### Notifications System
- **Database**: `notifications` table with userId, type, title, message, isRead, link, data (JSON), createdAt
- **Types**: booking, event, membership, system, payment
- **API Endpoints**:
  - `GET /api/notifications` - List user's notifications (newest first)
  - `GET /api/notifications/unread-count` - Get unread count
  - `POST /api/notifications/:id/read` - Mark single notification as read (ownership enforced)
  - `POST /api/notifications/read-all` - Mark all user's notifications as read
  - `DELETE /api/notifications/:id` - Delete notification (ownership enforced)
- **NotificationBell Component**: Header bell icon with unread count badge, popover dropdown with preview, deep link to profile notifications tab

### Enhanced Profile Page
- **Tabs**: Account, Bookings, Notifications, Membership
- **Account Tab**: Profile photo upload with avatar overlay (camera icon on hover), user info display
- **Bookings Tab**: Sub-tabs for Upcoming and Past bookings with status badges
- **Notifications Tab**: Full notification management with mark read, mark all read, delete actions
- **Membership Tab**: Membership card display with tier, status, expiry date

### Profile Photo Upload
- Endpoint: `POST /api/user/profile-photo`
- Max file size: 5MB
- Accepted types: image/*
- Storage: `/uploads/` directory with multer
- Updates `user.profileImageUrl` field

Key files:
- `shared/schema.ts`: notifications table schema
- `server/storage.ts`: notification CRUD methods with ownership validation
- `server/routes.ts`: notification API endpoints
- `client/src/components/NotificationBell.tsx`: Header notification component
- `client/src/pages/Profile.tsx`: Enhanced profile page with tabs

## Page Layout Standardization

All major pages follow a consistent layout structure with unified headers and footers:

### Layout Pattern
- Wrapper: `min-h-screen flex flex-col bg-background`
- Navbar: Shared `<Navbar />` component from `@/components/layout/Navbar`
- Main: `<main className="flex-1">` wraps page content
- Footer: Shared `<Footer />` component from `@/components/layout/Footer`

### Hero Banner Heights
- **Main Pages** (Facilities, Events, Roadmap): `h-[30vh] min-h-[200px]`
- **Profile Page**: `h-[20vh] min-h-[150px]`

### Key Files
- `client/src/components/layout/Navbar.tsx`: Shared navigation with user dropdown, mobile menu
- `client/src/components/layout/Footer.tsx`: Shared footer with contact info, social links
- `client/src/pages/Events.tsx`: Events & Academies page with registration
- `client/src/pages/Facilities.tsx`: Facilities listing page
- `client/src/pages/Roadmap.tsx`: Construction roadmap page
- `client/src/pages/Profile.tsx`: User profile with Navbar/Footer in all states (loading, unauthenticated, authenticated)

## Deployment Infrastructure (Batch 6)

### Logging System
- **Winston Integration**: Structured logging with JSON format for production, console for development
- **Log Levels**: debug, info, warn, error (configurable via LOG_LEVEL env var)
- **Log Files**: `logs/combined.log` and `logs/error.log` in production
- **Request Logging**: Express middleware logs all API requests with response times

### Environment Validation
- Validates required environment variables at startup
- Fails fast with clear error messages if DATABASE_URL or SESSION_SECRET missing
- Warnings for optional but recommended variables (RESEND_API_KEY, ADMIN_PATH)

### Health Check Endpoint
- **Path**: `GET /api/health`
- **Response**: status, timestamp, uptime, database connection, environment, version
- **Use**: Monitoring, load balancer health checks, deployment verification

### Passenger Compatibility
- `server.js`: Entry point for Hostinger VPS with Passenger
- Imports compiled `dist/index.cjs` for production deployment
- `.htaccess`: Apache configuration for Passenger, gzip, caching, security headers

### Deployment Files
- `deployment/schema.sql`: Complete PostgreSQL schema for Supabase
- `deployment/seed.sql`: Initial data (tiers, venues, facilities, settings)
- `deployment/DEPLOYMENT_CHECKLIST.md`: Step-by-step deployment guide
- `.env.example`: Template for environment variables
- `.htaccess`: Apache/Passenger configuration

Key files:
- `server/logger.ts`: Winston logger configuration
- `server/envValidation.ts`: Startup environment validation
- `server.js`: Passenger entry point
- `server/routes.ts`: Health check endpoint at `/api/health`