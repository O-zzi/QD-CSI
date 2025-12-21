# The Quarterdeck - Production Deployment Roadmap

## Project Overview
**Target:** Hostinger Shared VPS with Passenger + Supabase PostgreSQL  
**Authentication:** Passport.js (Local Strategy)  
**Created:** December 21, 2025  
**Status:** Batch 4 Complete

---

## Batch Overview

| Batch | Focus | Est. Time | Status |
|-------|-------|-----------|--------|
| Batch 1 | CMS Dynamism + Database Prep | 4-5 hours | DONE |
| Batch 2 | Membership & Auth System | 4-5 hours | DONE |
| Batch 3 | Booking Portal Fixes | 3-4 hours | DONE |
| Batch 4 | Member Dashboard & Notifications | 3-4 hours | DONE |
| Batch 5 | Security & UX Hardening | 2-3 hours | Pending |
| Batch 6 | Deployment Preparation | 3-4 hours | Pending |

**Total Estimated:** 20-25 hours

---

## Batch 1: CMS Dynamism + Database Prep

### Objective
Ensure ALL content is database-driven and editable via admin panel. NO HARDCODED DATA.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Create DEPLOYMENT_ROADMAP.md | DONE | This document |
| 1.2 | Audit all pages for hardcoded content | DONE | See inventory below |
| 1.3 | Extend CMS schema for page content | DONE | cms_fields, nav_items, siteImages tables exist |
| 1.4 | Add WhatsApp settings to site_settings | DONE | Phone, default message added to DB |
| 1.5 | Verify admin CRUD for all sections | DONE | Admin panel has CRUD for all content |

### Hardcoded Content Inventory

#### BookingConsole.tsx (CRITICAL) - ALL FIXED IN BATCH 3
- [x] `MOCK_USER_PROFILE` - Now fetches real user membership data via /api/memberships/my
- [x] `LEADERBOARD_DATA` - Now fetches from /api/leaderboard
- [x] `MOCK_EVENTS` - Now fetches from /api/events
- [x] `VENUES` - Now fetches from /api/venues (database-driven)
- [x] `TIME_SLOTS` - Now uses operating_hours table
- [x] `FACILITY_ADD_ONS` - Already fetching from /api/facilities/:slug/addons
- [x] `DEFAULT_FACILITIES` - Removed, using database facilities only
- [x] `HALL_ACTIVITIES` - Now database-driven via facility configuration
- [x] `MOCK_MEMBERSHIP_NUMBERS` - Removed, using real membership validation

#### Home.tsx - ALL CMS DRIVEN
- [x] Hero section text and CTAs - Uses cms_fields table
- [x] Feature highlights - Uses cms_fields table
- [x] Membership benefits text - Uses cms_fields table
- [x] "Why Choose Us" content - Uses cms_fields table

#### Navigation & Footer - ALL CMS DRIVEN
- [x] Nav item labels - Uses nav_items table
- [x] Footer links and text - Uses cms_fields table
- [x] Copyright text - Uses site_settings table
- [x] Social media links - Uses site_settings table

#### Other Pages - ALL CMS DRIVEN
- [x] About page content - Uses cms_fields table
- [x] Contact page content - Uses site_settings table
- [x] Facilities page descriptions - Uses facilities table
- [x] Page meta titles/descriptions - Uses cms_fields table

---

## Batch 2: Membership & Auth System

### Objective
Replace Replit Auth with Passport.js, implement proper membership workflow.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Make membership tiers fully dynamic | DONE | Tiers from database |
| 2.2 | Add membershipStatus field | DONE | See status flow below |
| 2.3 | Add passwordHash column to users | DONE | bcrypt hashing implemented |
| 2.4 | Implement Passport.js local strategy | DONE | Login, session with PostgreSQL store |
| 2.5 | Build signup flow | DONE | Email verification with 15-min token |
| 2.6 | Integrate Cloudflare Turnstile CAPTCHA | DEFERRED | Move to Batch 5 |
| 2.7 | Add terms acceptance tracking | DONE | termsAcceptedAt field |
| 2.8 | Implement admin approval workflow | DONE | Admin can approve/reject |
| 2.9 | Add password reset flow | DONE | 60-min secure token via email |
| 2.10 | Add account lockout | DONE | 5 attempts, 30-min lockout |
| 2.11 | Implement membership expiry | DONE | Auto-downgrade logic ready |
| 2.12 | Add guest pass tracking | DONE | guestPasses field exists |
| 2.13 | Add payment reference tracking | DONE | Payment workflow integrated |
| 2.14 | Create admin seeding script | DONE | scripts/seed-admin.ts |

### Membership Status Flow
```
User Signup → PENDING_PAYMENT (treated as GUEST)
     ↓
Payment Claimed → PENDING_VERIFICATION
     ↓
Admin Approves → ACTIVE (full tier benefits)
     ↓
Expiry Date Passed → EXPIRED (reverts to GUEST)
```

### Security Rules
- Discounts only apply if `membershipStatus === 'ACTIVE'`
- Booking windows only apply if `membershipStatus === 'ACTIVE'`
- Guest passes only available if `membershipStatus === 'ACTIVE'`

---

## Batch 3: Booking Portal Fixes

### Objective
Make booking portal fully dynamic and respect real user membership data.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Fetch real user membership data | DONE | useQuery to /api/memberships/my |
| 3.2 | Block discounts if status ≠ ACTIVE | DONE | isActiveMember check in bookingSummary |
| 3.3 | Enforce booking window limits | DONE | maxBookingDate calculated by tier |
| 3.4 | Make add-ons database-driven | DONE | Already fetching from /api/facilities/:slug/addons |
| 3.5 | Make venues database-driven | DONE | Already fetching from /api/venues |
| 3.6 | Fetch real leaderboard | DONE | useQuery to /api/leaderboard |
| 3.7 | Make time slots configurable | DONE | Using operating_hours table |
| 3.8 | Remove ALL MOCK data | DONE | MOCK_USER_PROFILE, LEADERBOARD_DATA, MOCK_EVENTS, MOCK_MEMBERSHIP_NUMBERS removed |
| 3.9 | Add WhatsApp floating button | DONE | Fetches settings from /api/site-settings |
| 3.10 | Implement admin path masking | DONE | ADMIN_PATH secret masks admin routes for security |

### Booking Windows by Tier
| Tier | Advance Booking | Off-Peak Discount |
|------|-----------------|-------------------|
| Founding | 14 days | 25% |
| Gold | 7 days | 20% |
| Silver | 5 days | 10% |
| Guest | 2 days | 0% |

---

## Batch 4: Member Dashboard & Notifications

### Objective
Create comprehensive member experience with notifications.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Add notifications table to schema | DONE | userId, type, title, message, isRead, data, createdAt |
| 4.2 | Build notification API endpoints | DONE | GET, POST, mark read, delete with ownership enforcement |
| 4.3 | Create NotificationBell component | DONE | Header bell with unread count badge, popover dropdown |
| 4.4 | Create email templates (Resend) | DONE | See list below |
| 4.5 | Enhance Profile page with tabs | DONE | Account, Bookings (upcoming/past), Notifications, Membership |
| 4.6 | Add profile photo upload | DONE | Avatar with camera overlay, 5MB limit |

### Notification System
- **Database**: `notifications` table with proper ownership validation
- **API Endpoints**:
  - `GET /api/notifications` - List user's notifications
  - `GET /api/notifications/unread-count` - Unread count for badge
  - `POST /api/notifications/:id/read` - Mark read (ownership enforced)
  - `POST /api/notifications/read-all` - Mark all read
  - `DELETE /api/notifications/:id` - Delete (ownership enforced, returns 403 if not owner)
- **Types**: booking, event, membership, system, payment
- **NotificationBell**: Header component with badge, popover, deep link to profile

### Profile Page Tabs
- **Account**: Profile photo upload, user info display
- **Bookings**: Upcoming and Past sub-tabs with status badges
- **Notifications**: Full management (mark read, mark all, delete)
- **Membership**: Membership card with tier, status, expiry

### Email Templates (All Implemented)
- [x] Welcome email (after signup)
- [x] Email verification
- [x] Membership approved
- [x] Membership rejected
- [x] Booking confirmation
- [x] Booking cancellation
- [x] Payment verified
- [x] Payment rejected
- [x] Renewal reminder (7 days)
- [x] Renewal reminder (3 days)
- [x] Renewal reminder (1 day)
- [x] Event registration confirmation
- [x] Contact form submission
- [x] Career application received
- [x] Password reset

---

## Batch 5: Security & UX Hardening

### Objective
Production-ready security and polished user experience.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Implement configurable ADMIN_PATH | DONE | Admin routes masked via ADMIN_PATH secret |
| 5.2 | Add server-side admin protection | DONE | isAdmin middleware, role-based access |
| 5.3 | Add Helmet security headers | Pending | XSS, CSRF, etc. |
| 5.4 | Add rate limiting | Pending | Login, API endpoints |
| 5.5 | Implement admin audit logging | Pending | Track admin actions |
| 5.6 | Add Cloudflare Turnstile CAPTCHA | Pending | Deferred from Batch 2 |
| 5.7 | Add WhatsApp floating button | DONE | CMS-configurable via site_settings |
| 5.8 | Add 404 page with helpful redirects | Pending | User-friendly errors |

### Admin Path Security (IMPLEMENTED)
```
Configuration: ADMIN_PATH secret (e.g., "secure-manage-2025")
Access: /${ADMIN_PATH}/dashboard, /${ADMIN_PATH}/cms, etc.
Frontend: Uses useAdminPath() hook to dynamically build admin URLs
Protection: isAdmin middleware validates role before access
```

---

## Batch 6: Deployment Preparation

### Objective
Prepare for Hostinger VPS + Supabase deployment.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Integrate Winston logging | Pending | Structured logs |
| 6.2 | Add environment variable validation | Pending | Startup checks |
| 6.3 | Create server.js for Passenger | Pending | Production entry |
| 6.4 | Add health check endpoint | Pending | /api/health |
| 6.5 | Export SQL schema | Pending | For Supabase |
| 6.6 | Export SQL seed data | Pending | Initial content |
| 6.7 | Create .htaccess template | Pending | Passenger config |
| 6.8 | Create .env.example | Pending | Required env vars |
| 6.9 | Write deployment checklist | Pending | Step-by-step |
| 6.10 | Test production build | Pending | npm run build |

### Environment Variables Required
```env
# Database
DATABASE_URL=postgresql://...pooler.supabase.com:5432/postgres

# Auth
SESSION_SECRET=<generated-secret>

# Admin
ADMIN_BASE_PATH=manage-secure-path

# Email
RESEND_API_KEY=re_xxxx
EMAIL_FROM=The Quarterdeck <noreply@thequarterdeck.pk>

# CAPTCHA
CLOUDFLARE_TURNSTILE_SITE_KEY=xxxx
CLOUDFLARE_TURNSTILE_SECRET_KEY=xxxx

# WhatsApp (from CMS)
WHATSAPP_DEFAULT_NUMBER=923185026001

# Production
NODE_ENV=production
PORT=5000
```

---

## Deployment Checklist (Final)

### Pre-Deployment
- [ ] All batches completed
- [ ] No hardcoded content remaining
- [ ] All admin CRUD verified
- [ ] Build passes without errors
- [ ] SQL schema exported
- [ ] SQL seed data exported

### Supabase Setup
- [ ] Create Supabase project
- [ ] Get pooler connection string
- [ ] Run schema SQL
- [ ] Run seed data SQL
- [ ] Disable RLS on all tables
- [ ] Verify table structures

### Hostinger Setup
- [ ] SSH access configured
- [ ] Node.js version verified
- [ ] .htaccess created
- [ ] server.js created
- [ ] .env created with all variables
- [ ] Dependencies installed
- [ ] dist/ folder uploaded

### Post-Deployment
- [ ] Health check endpoint responds
- [ ] Admin login works
- [ ] Member signup works
- [ ] Booking flow works
- [ ] Emails sending correctly
- [ ] WhatsApp button works

---

## Progress Tracking

### Completed Batches
- [x] Batch 1: CMS Dynamism (COMPLETE)
- [x] Batch 2: Membership & Auth (COMPLETE)
- [x] Batch 3: Booking Portal (COMPLETE)
- [x] Batch 4: Dashboard & Notifications (COMPLETE)
- [ ] Batch 5: Security & UX (3/8 tasks done)
- [ ] Batch 6: Deployment Prep

### Key Files Reference
| Component | File Path |
|-----------|-----------|
| Notifications Schema | `shared/schema.ts` (notifications table) |
| Notification Storage | `server/storage.ts` (CRUD with ownership) |
| Notification API | `server/routes.ts` (/api/notifications/*) |
| NotificationBell | `client/src/components/NotificationBell.tsx` |
| Profile Page | `client/src/pages/Profile.tsx` |
| Email Templates | `server/email.ts` |
| Admin Path Hook | `client/src/hooks/useAdminPath.ts` |
| Admin Seeding | `scripts/seed-admin.ts` |

---

*Last Updated: December 21, 2025*
