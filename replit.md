# The Quarterdeck - Sports & Recreation Complex

## Overview

The Quarterdeck is a full-stack web application for a sports and recreation complex, scheduled for a Q4 2026 launch. It features a public landing page and a comprehensive booking system for various facilities (e.g., Padel Tennis, Squash, Air Rifle Range). The platform supports membership tiers, real-time booking, event registration, a leaderboard, and a robust CMS for dynamic content, aiming to streamline operations and enhance user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18, TypeScript, Vite, Wouter for routing, and React Query for server state management. UI components leverage Shadcn/ui (New York style) on Radix UI primitives, styled with Tailwind CSS and custom CSS variables. The design is mobile-first and strictly adheres to existing HTML/Tailwind implementations, focusing on consistent color palettes, typography, spacing, and component patterns.

### Backend Architecture

The backend uses Express.js and Node.js with WebSocket capabilities. **Authentication is now handled by Supabase Auth** (email/password with email verification, password reset flows). Supabase users are synced to the PostgreSQL users table on sign-in via the `/api/auth/sync` endpoint. Backend validates Supabase JWTs via middleware. The API is RESTful, covering authentication, memberships, bookings, events, leaderboards, and CMS. Drizzle ORM is used for type-safe database interactions with a schema-first approach and Zod validation. Key features include double-booking prevention, membership validation, and role-based access control. Session cookies are still used for legacy compatibility but Supabase Auth is the primary authentication method.

### Database Architecture

A PostgreSQL database, managed by Drizzle ORM and Drizzle Kit, defines core tables such as `users`, `memberships`, `facilities`, `bookings`, `events`, `leaderboard`, and `cms_content`. Relationships support various operational flows, and PostgreSQL enums with Drizzle-Zod integration ensure type safety. Dedicated tables manage multi-venue support, construction timelines, and site-wide CMS fields.

**Phase 2 CMS Expansion Tables (added December 2024):**
- `blogs` - Full blog/news article management with slugs, categories, tags, and publishing workflow
- `hero_sections` - Per-page hero banner configuration with background images/videos and CTAs
- `ctas` - Call-to-action components with styling options and page/section placement
- `testimonials` - Customer testimonials with ratings and facility associations
- `event_galleries` - Image galleries for events with captions and ordering

All new CMS tables have complete CRUD APIs with admin protection and Zod validation.

### Admin Dashboard

An `/admin` panel provides role-based access (ADMIN, SUPER_ADMIN) for managing CMS content, facilities, pricing, announcements, careers, rules, and gallery images. All admin API endpoints are protected and use Zod for validation. It includes CRUD operations for dynamic membership tier definitions with configurable properties like discounts and guest passes, and an interface for payment verification.

### Key Features

- **Event Registration:** Authenticated users can register and cancel event participation.
- **Career Applications:** Job seekers can apply through a modal form, including CV and cover letter uploads.
- **Contact Form:** Visitors can submit inquiries, stored for admin review.
- **Site Settings:** Admin-configurable settings for contact information and social media.
- **Membership Discount Logic:** Discounts are applied only during off-peak hours (10 AM - 5 PM) based on membership tier.
- **Notifications System:** Real-time user notifications (bookings, events, membership) stored in a `notifications` table, accessible via API and a dedicated bell component/profile tab.
- **Enhanced User Profile:** A multi-tab profile page (Account, Bookings, Notifications, Membership) supporting profile photo uploads (up to 5MB, image types only) and detailed displays.
- **Standardized Page Layouts:** Consistent layout structure with shared headers and footers across all major pages, including specific hero banner heights.
- **Deployment Infrastructure:** Includes Winston-based structured logging, environment variable validation, a health check endpoint (`/api/health`), and Passenger compatibility for VPS deployment. Deployment artifacts include SQL schemas and seeding scripts.

### Supabase Integration (Optional)

The system supports optional integration with Supabase for Storage, Auth, and Realtime capabilities.
- **Supabase Storage:** For file uploads (profile photos, admin uploads) to an `uploads` bucket, with a local `/uploads/` directory fallback. Max file size is 10MB.
- **Supabase Auth:** A hybrid approach where Supabase Auth coexists with Passport.js. Supabase users are synced to PostgreSQL, and backend validates Supabase JWTs.
- **Supabase Realtime:** Provides live updates for bookings, notifications, and events, integrating with React Query for cache invalidation.

## External Dependencies

**Authentication & Session Management:**
- Supabase Auth (primary - email/password with JWT tokens)
- PostgreSQL (`connect-pg-simple` for legacy session persistence)
- `@supabase/supabase-js` for auth client

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

**Styling & Theming:**
- Tailwind CSS v3+
- PostCSS
- `tailwind-merge`, `clsx`

**Database & ORM:**
- `pg` (node-postgres)
- Drizzle ORM
- `drizzle-zod`

**Payment Processing:**
- Offline Payment System (Bank Transfer, Cash) for the Pakistan market.
- Stripe client libraries are present for future integration but currently disabled.

**Email Notifications:**
- Resend API for transactional emails (e.g., booking confirmations, payment status, event registrations, membership updates).
- Email templates configured for various notifications.

**Utility Libraries:**
- `nanoid`
- `memoizee`
- `ws` (for WebSocket infrastructure)
- Winston (logging)