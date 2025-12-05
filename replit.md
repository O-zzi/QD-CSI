# The Quarterdeck - Sports & Recreation Complex

## Overview

The Quarterdeck is a full-stack web application for a sports and recreation complex in Islamabad. The platform combines a public-facing landing page with a comprehensive booking system for multiple facilities including Padel Tennis, Squash, Air Rifle Range, Bridge Room, and a Multipurpose Hall. The application is currently in development with a target launch of Q4 2026, and features membership tiers, real-time booking management, event registration, and a CMS for dynamic content management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type safety and modern component patterns
- Vite as the build tool for fast development and optimized production builds
- Wouter for lightweight client-side routing (routes: `/`, `/booking`, `/profile`)
- React Query (TanStack Query) for server state management and data fetching

**UI Component System**
- Shadcn/ui component library (New York style variant) built on Radix UI primitives
- Tailwind CSS for styling with custom design system based on existing HTML implementation
- Custom CSS variables for theming support (light/dark mode capability)
- Design system preserves exact spacing, colors, and layouts from original static HTML

**State Management Strategy**
- React Query handles all server state with query invalidation on mutations
- Local component state for UI interactions
- Auth state managed through custom `useAuth` hook with query-based user fetching
- Session-based authentication with 401 handling for unauthorized requests

**Key Design Constraints**
- Must exactly preserve existing HTML/Tailwind implementation
- Design guidelines document enforces specific color palette, typography, spacing, and component patterns
- Primary navy (#2a4060), gold accents, specific border radius system
- Mobile-first responsive design with 900px breakpoint for navigation

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for the HTTP server
- Node.js http module wrapping Express for WebSocket support capability
- Custom middleware for JSON body parsing, logging, and error handling
- Session-based authentication with PostgreSQL session store

**Authentication System**
- Replit Auth integration using OpenID Connect (OIDC)
- Passport.js strategy for authentication flow
- Session management via express-session with connect-pg-simple
- Protected routes using `isAuthenticated` middleware
- User data synchronized to local database on authentication

**API Design**
- RESTful endpoints under `/api` prefix
- Authentication routes: `/api/auth/user`
- Membership routes: `/api/memberships/my`, `/api/memberships/validate/:number`
- Booking routes: `/api/bookings/my`, `/api/bookings` (create)
- Event routes for tournaments and classes
- Leaderboard and CMS content endpoints

**Data Access Layer**
- Storage interface pattern (`IStorage`) abstracts database operations
- Drizzle ORM for type-safe database queries
- Schema-first approach with Zod validation
- Centralized database connection pool management

### Database Architecture

**ORM & Schema Management**
- Drizzle ORM with PostgreSQL dialect
- Schema defined in TypeScript with type inference
- Migration management via Drizzle Kit
- Schema location: `shared/schema.ts` for code sharing between client/server

**Core Tables**
- `users`: User accounts with role-based permissions (USER, ADMIN, SUPER_ADMIN)
- `sessions`: Express session storage for authentication
- `memberships`: Membership tiers (FOUNDING, GOLD, SILVER, GUEST) with status tracking
- `facilities`: Available facilities with pricing and availability
- `facility_add_ons`: Additional services/equipment rentals
- `bookings`: Court/facility reservations with status tracking
- `booking_add_ons`: Junction table for booking extras
- `events`: Tournaments, classes, academies with registration
- `event_registrations`: User event participation
- `leaderboard`: Performance tracking and rankings
- `cms_content`: Dynamic page content management
- `announcements`: Site-wide notifications
- `gallery_images`: Construction updates and facility photos
- `time_slot_blocks`: Availability management

**Data Relationships**
- Users → Memberships (one-to-one)
- Users → Bookings (one-to-many)
- Facilities → FacilityAddOns (one-to-many)
- Bookings → BookingAddOns (many-to-many through junction)
- Events → EventRegistrations → Users (many-to-many)

**Enums & Type Safety**
- PostgreSQL enums for constrained values (roles, tiers, statuses)
- Drizzle-Zod integration for runtime validation
- Insert schemas generated from table definitions

### External Dependencies

**Authentication & Session Management**
- Replit Auth (OpenID Connect) for user authentication
- PostgreSQL for session persistence via connect-pg-simple
- JWT tokens managed by openid-client library

**UI Component Libraries**
- Radix UI for accessible, unstyled component primitives (40+ components)
- Embla Carousel for image galleries
- cmdk for command palette functionality
- Lucide React for consistent icon system
- class-variance-authority for component variant management

**Form Handling & Validation**
- React Hook Form for form state management
- @hookform/resolvers for Zod schema integration
- Zod for runtime type validation and schema definition
- zod-validation-error for user-friendly error messages

**Date & Time Management**
- date-fns for date manipulation and formatting
- Custom time slot calculation utilities
- Off-peak vs peak hour detection logic

**Development Tools**
- tsx for TypeScript execution in development
- esbuild for production server bundling
- Replit-specific plugins: runtime error overlay, cartographer, dev banner
- Custom build script for coordinated client/server builds

**Styling & Theming**
- Tailwind CSS v3+ with PostCSS processing
- tailwind-merge and clsx for conditional class composition
- Custom CSS properties for theme variables
- Dark mode support through class-based theming

**Database & ORM**
- pg (node-postgres) for PostgreSQL connection pooling
- Drizzle ORM for query building and type inference
- drizzle-zod for schema-to-validator conversion

**Utility Libraries**
- nanoid for unique ID generation
- memoizee for function result caching
- ws for WebSocket support (infrastructure ready)

**Path Resolution**
- TypeScript path aliases: `@/` for client, `@shared/` for shared code, `@assets/` for static assets
- Vite resolver for development, esbuild for production builds

## Recent Changes (December 2025)

### Completed Features
- Full database schema with 18+ tables covering all aspects of the sports complex
- Replit Auth integration with Google, GitHub, Apple, and email/password login
- Complete landing page with all sections (Hero, About, Facilities, Updates, Gallery, Membership, Rules, Careers, Contact)
- Booking Console with facility selection, venue picker, date/time selection, matchmaking, add-ons
- Events and Leaderboard pages with filtering
- Profile page with membership details and booking history
- Full Gallery page with category filtering (Renders, Construction, Facilities)
- Seed data for demo users, facilities, events, and leaderboard entries

### Admin CMS Dashboard (December 2025)
Complete admin panel at `/admin` with role-based access control (ADMIN/SUPER_ADMIN roles required):

**Admin Routes:**
- `/admin` - Dashboard with statistics overview
- `/admin/homepage` - CMS content management for homepage text
- `/admin/facilities` - CRUD for facilities with pricing, status, certification requirements
- `/admin/pricing` - Membership pricing tiers with benefits management
- `/admin/announcements` - Site announcements with publish status
- `/admin/careers` - Job listings with department, location, type
- `/admin/rules` - Rules and policies with categories and sort order
- `/admin/gallery` - Gallery image management with categories

**Admin API Endpoints:**
All protected with `isAuthenticated` and `isAdmin` middleware:
- GET/POST/PATCH/DELETE `/api/admin/cms`
- GET/POST/PATCH/DELETE `/api/admin/announcements`
- GET/POST/PATCH/DELETE `/api/admin/gallery`
- GET/POST/PATCH/DELETE `/api/admin/pricing-tiers`
- GET/POST/PATCH/DELETE `/api/admin/careers`
- GET/POST/PATCH/DELETE `/api/admin/rules`
- GET/POST/PATCH/DELETE `/api/admin/facilities`

All PATCH routes validate using partial Zod schemas for type safety.

### Stripe Payment Integration (December 2025)
Complete online payment system integrated with Stripe for card payments:

**Payment Flow:**
1. User selects facility, court, date, time, and add-ons
2. User chooses "Pay with Card" payment method
3. Frontend calls `/api/stripe/create-checkout` to initiate payment
4. Server validates prices server-side (prevents tampering)
5. Server checks for double-booking before allowing checkout
6. Stripe checkout session created with booking metadata
7. User redirected to Stripe-hosted checkout page
8. After payment, user returns to `/booking?success=true&session_id=xxx`
9. Frontend calls `/api/stripe/verify-session` to confirm payment
10. Booking created only after payment verification

**API Endpoints:**
- POST `/api/stripe/create-checkout` - Creates Stripe checkout session (authenticated)
- POST `/api/stripe/verify-session` - Verifies payment and creates booking
- GET `/api/stripe/session/:sessionId` - Retrieves session details
- Webhook: `/api/stripe/webhook/:uuid` - Receives Stripe events

**Security Features:**
- Server-side price calculation using database values (no client-submitted prices trusted)
- NaN validation guard prevents invalid calculations
- Double-booking check before checkout AND before booking creation
- Idempotent booking creation via stripeSessionId tracking
- Webhook route uses raw body (registered before express.json())

**Database Fields Added:**
- `bookings.hall_activity` - Activity type for multipurpose hall
- `bookings.stripe_session_id` - Stripe checkout session ID
- `bookings.stripe_payment_intent_id` - Stripe payment intent ID

### Security & Validation
- Double-booking prevention: Server checks for existing bookings before creating new ones
- Membership number format validation: Enforces QD-XXXX pattern (e.g., QD-0001)
- Payer validation: Verifies membership exists and is active when booking on behalf of another member
- Admin route protection with role-based middleware
- Zod validation on all admin POST and PATCH endpoints
- Server-side Stripe price validation prevents payment amount tampering

### Seed Data Available
- 5 Facilities: Padel Tennis, Squash, Air Rifle Range, Bridge Club, Multipurpose Hall
- 5 Demo Members: QD-0001 (Founding), QD-0002/0003 (Gold), QD-0004/0005 (Silver)
- Events: Padel Beginner Academy, Monthly Tournament, Squash Pro Clinic, Air Rifle Safety Course
- Leaderboard entries with sample rankings

### Running the Seed Script
```bash
npx tsx script/seed.ts
```

## Admin Dashboard Access

### Accessing the Admin Panel

The admin dashboard is available at `/admin` for users with ADMIN or SUPER_ADMIN roles.

**How to Access:**
1. Log in using Replit Auth (Google, GitHub, Apple, or email)
2. Navigate to `/admin` in your browser
3. If unauthorized, you'll be redirected to the homepage

**Setting Up Admin Access:**
To make a user an admin, update their role directly in the database:

```sql
-- Make a user an ADMIN
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';

-- Make a user a SUPER_ADMIN (highest privileges)
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'your-email@example.com';
```

Or run via the execute_sql tool or Replit's database pane.

**Admin Role Permissions:**
- `USER` (default): Standard member access, can book facilities
- `ADMIN`: Access to admin dashboard, can manage CMS content, announcements, gallery, careers, rules
- `SUPER_ADMIN`: Full access including facilities and pricing management

**Admin Dashboard Sections:**
| Route | Purpose | Access Level |
|-------|---------|--------------|
| `/admin` | Dashboard with statistics overview | ADMIN+ |
| `/admin/homepage` | Edit homepage CMS content | ADMIN+ |
| `/admin/facilities` | Manage facilities, pricing, status | ADMIN+ |
| `/admin/pricing` | Membership tier pricing and benefits | ADMIN+ |
| `/admin/announcements` | Site-wide announcements | ADMIN+ |
| `/admin/careers` | Job listings management | ADMIN+ |
| `/admin/rules` | Rules and policies | ADMIN+ |
| `/admin/gallery` | Gallery image management | ADMIN+ |

**Testing Admin Access:**
After setting up admin access, verify by:
1. Logging in with your account
2. Going to `/admin` - you should see the admin dashboard
3. Check that sidebar navigation shows all management sections

### Booking Console Layout

The booking console at `/booking` now features a sidebar-based layout with:
- **Navigation Tabs:** Book Facility, Events & Academies, Leaderboard, My Profile
- **User Stats Panel:** Credit Balance, Hours Played, Guest Passes
- **Facility Selection:** All 5 facilities with court/lane selection
- **Hall-Specific Activity Type:** Team Training, Private Event/Party, General Practice options
- **Time Slot Picker:** Off-peak discount indicators, duration selection
- **Add-Ons & Payment:** Quantity controls, payer details, payment method selection