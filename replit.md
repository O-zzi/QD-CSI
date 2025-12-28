# The Quarterdeck - Sports & Recreation Complex

## Overview
The Quarterdeck is a full-stack web application for a sports and recreation complex, targeting a Q4 2026 launch. It provides a public landing page and a comprehensive booking system for various facilities like Padel Tennis, Squash, and an Air Rifle Range. The platform supports membership tiers, real-time booking, event registration, a leaderboard, and a robust CMS for dynamic content, aiming to streamline operations and enhance user experience with a strong business vision for market leadership in sports recreation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and React Query for server state management. UI components are built with Shadcn/ui (New York style) on Radix UI primitives, styled with Tailwind CSS and custom CSS. The design prioritizes a mobile-first approach and adheres to consistent styling guidelines.

### Backend
The backend is built with Express.js and Node.js, featuring WebSocket capabilities. Supabase Auth handles user authentication (email/password, verification, password reset), with Supabase users synced to a PostgreSQL `users` table. The API is RESTful, covering authentication, memberships, bookings, events, leaderboards, and CMS. Drizzle ORM provides type-safe database interactions with Zod validation. Key features include double-booking prevention, membership validation, and role-based access control.

### Database
The project utilizes PostgreSQL, managed by Drizzle ORM and Drizzle Kit. Core tables include `users`, `memberships`, `facilities`, `bookings`, `events`, `leaderboard`, `cms_content`, and various CMS expansion tables for blogs, hero sections, CTAs, testimonials, and event galleries. Development and production databases are separate. Schema migrations run automatically on server startup. All new CMS tables include CRUD APIs with admin protection and Zod validation.

### Admin Dashboard
An `/admin` panel provides role-based access with a 4-tier hierarchy: USER, EDITOR, ADMIN, and SUPER_ADMIN. This panel allows for managing bookings, members, certifications, facilities, events, and all CMS content, including dynamic membership tier definitions and payment verification. Admin navigation dynamically adjusts based on user roles, and all admin API endpoints are role-protected.

### CMS Image Management
All images are database-driven and editable via the admin panel, eliminating hardcoded images in the frontend. This includes site-wide images (hero, footer, navbar backgrounds), per-page hero section images/videos, facility images, gallery images, and event images. Seed scripts are available for populating default images and CMS Phase 2 content.

### Navigation Structure

**Top Navbar (4 Category Dropdowns):**
- Logo (links to home)
- Facilities dropdown: Padel Tennis, Squash Courts, Air Rifle Range, Multipurpose Hall (dynamic from API)
- Experiences dropdown: Events & Academies, Leaderboard, Gallery
- Community dropdown: Blog, Testimonials, Updates
- About dropdown: Vision, Contact, FAQ, Club Rules
- User Menu (authenticated): Profile, Admin Dashboard (for admins), Logout
- Book Now button

**Footer Links:**
- Vision → /vision
- Club Rules → /rules
- Careers → /careers
- Contact → /contact
- Terms → /terms
- Privacy → /privacy
- Social links (Instagram, Facebook, LinkedIn from site_settings)

**Public Pages:**
- / (Home/Landing)
- /facilities (Facility listing)
- /facilities/:slug (Facility detail)
- /events (Events & Academies listing)
- /events/:slug (Event detail)
- /updates (Updates/Announcements)
- /roadmap (Development Roadmap)
- /gallery (Photo Gallery)
- /vision (About/Vision)
- /membership (Membership tiers)
- /contact (Contact form)
- /careers (Job listings)
- /rules (Club Rules)
- /faq (FAQ)
- /leaderboard (Player rankings)
- /blog (Blog listing)
- /blog/:slug (Blog post)
- /testimonials (Member testimonials)
- /terms (Terms & Conditions)
- /privacy (Privacy Policy)
- /certifications (Certification info)
- /coming-soon (Pre-launch page)
- /login, /signup, /forgot-password, /verify-email, /auth/callback, /auth/reset-password (Auth flows)

**Authenticated Pages:**
- /booking (Booking console)
- /profile (Multi-tab profile: Overview, Bookings, Membership, Settings)

**Admin Pages (role-protected via dynamic /{adminPath}/):**
- Dashboard (overview)
- /homepage (Homepage section management)
- /coming-soon (Coming soon page)
- /venues (Venue management)
- /facilities (Facility CRUD)
- /roadmap (Roadmap items)
- /events (Events management)
- /pricing (Pricing configuration)
- /membership-tiers (Tier definitions)
- /announcements (Announcements)
- /careers (Career postings)
- /rules (Rules management)
- /policies (Terms/Privacy policies)
- /gallery (Gallery images)
- /site-images (Site-wide images)
- /hero-sections (Hero section CMS)
- /ctas (Call-to-action buttons)
- /bookings (Booking management with payment verification)
- /branding (Logo, colors)
- /faq (FAQ management)
- /members (Member management)
- /membership-applications (Application review)
- /certifications (User certifications)
- /comparison-features (Membership comparison)
- /member-benefits (Benefits CMS)
- /blogs (Blog posts)
- /testimonials (Testimonial management)
- /user-management (User roles - SUPER_ADMIN only)
- /site-settings (Global settings)

### Key Features
Key features include event registration, career application forms (with CV/cover letter upload), a contact form, admin-configurable site settings, membership discount logic for off-peak hours, a real-time notifications system, and an enhanced user profile with photo uploads. The system employs standardized page layouts, Winston-based structured logging, environment variable validation, and a health check endpoint. Admins can reorder homepage sections and manage facility certifications (e.g., Air Rifle Range requires certification). Email test endpoints and scheduled cron jobs for event reminders are also implemented.

### Email Configuration
Supabase Auth handles email verification, requiring users to verify their email before accessing authenticated features. Custom email templates (confirm signup, reset password, magic link) can be branded via the Supabase Dashboard. Custom SMTP settings and DNS records (SPF, DKIM, DMARC) are configurable for branded sender domains.

## External Dependencies

**Authentication & Session Management:**
- Supabase Auth (primary)
- PostgreSQL (`connect-pg-simple` for legacy sessions)
- `@supabase/supabase-js`

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
- Offline Payment System (Bank Transfer, Cash) for Pakistan market.

**Email Notifications:**
- Nodemailer with Hostinger SMTP for transactional emails (booking confirmations, event reminders, etc.).

**Utility Libraries:**
- `nanoid`
- `memoizee`
- `ws` (WebSockets)
- Winston (logging)