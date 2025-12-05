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

### Security & Validation

The system incorporates double-booking prevention, membership number format validation (e.g., QD-XXXX), payer validation for booking on behalf of others, and role-based access control for admin routes. Server-side validation with Zod is implemented across all critical endpoints, including payment processing.

### Admin Security Enhancements

The admin panel has enhanced security measures:
- **Re-authentication Timeout**: Admin users must have logged in within the last 10 minutes to access admin routes
- **Inactivity Timeout**: Admin sessions expire after 2 minutes of inactivity
- **Activity Tracking**: User activity is tracked via `lastActivityAt` and `lastAuthenticatedAt` timestamps
- **Heartbeat System**: Frontend sends activity heartbeats every 30 seconds to maintain admin sessions
- **Automatic Logout**: Users are automatically redirected to login when sessions expire

Key files:
- `server/replitAuth.ts`: Contains `isAdmin` middleware with security checks
- `client/src/hooks/useAdminSession.ts`: Frontend activity tracking hook
- `client/src/pages/admin/AdminLayout.tsx`: Admin layout with session management

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
- Email templates for: Booking confirmation, Payment verified/rejected, Booking cancelled, Event registration, Welcome email, Contact form, Career applications

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