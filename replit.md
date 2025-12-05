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