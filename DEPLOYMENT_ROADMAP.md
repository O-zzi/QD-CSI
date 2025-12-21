# The Quarterdeck - Production Deployment Roadmap

## Project Overview
**Target:** Hostinger Shared VPS with Passenger + Supabase PostgreSQL  
**Authentication:** Passport.js (Local Strategy)  
**Created:** December 21, 2025  
**Status:** Batch 1 In Progress

---

## Batch Overview

| Batch | Focus | Est. Time | Status |
|-------|-------|-----------|--------|
| Batch 1 | CMS Dynamism + Database Prep | 4-5 hours | IN PROGRESS |
| Batch 2 | Membership & Auth System | 4-5 hours | Pending |
| Batch 3 | Booking Portal Fixes | 3-4 hours | Pending |
| Batch 4 | Member Dashboard & Notifications | 3-4 hours | Pending |
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
| 1.2 | Audit all pages for hardcoded content | IN PROGRESS | See inventory below |
| 1.3 | Extend CMS schema for page content | Pending | cms_fields, nav_items |
| 1.4 | Add WhatsApp settings to site_settings | Pending | Phone, default message |
| 1.5 | Verify admin CRUD for all sections | Pending | Full CRUD for all content |

### Hardcoded Content Inventory

#### BookingConsole.tsx (CRITICAL)
- [ ] `MOCK_USER_PROFILE` (lines 134-141) - User membership mock data
- [ ] `LEADERBOARD_DATA` (lines 108-132) - Hardcoded leaderboard
- [ ] `MOCK_EVENTS` (lines 95-106) - Hardcoded events
- [ ] `VENUES` (line 85) - `['Islamabad', 'Karachi', 'Lahore', 'Rawalpindi']`
- [ ] `TIME_SLOTS` (line 86) - Fixed time array
- [ ] `FACILITY_ADD_ONS` (lines 55-83) - Hardcoded add-ons per facility
- [ ] `DEFAULT_FACILITIES` (lines 46-52) - Fallback facilities
- [ ] `HALL_ACTIVITIES` (lines 89-93) - Hardcoded activities
- [ ] `MOCK_MEMBERSHIP_NUMBERS` (line 87) - Mock member numbers

#### Home.tsx
- [ ] Hero section text and CTAs
- [ ] Feature highlights
- [ ] Membership benefits text
- [ ] "Why Choose Us" content

#### Navigation & Footer
- [ ] Nav item labels
- [ ] Footer links and text
- [ ] Copyright text
- [ ] Social media links

#### Other Pages
- [ ] About page content
- [ ] Contact page content
- [ ] Facilities page descriptions
- [ ] Page meta titles/descriptions

---

## Batch 2: Membership & Auth System

### Objective
Replace Replit Auth with Passport.js, implement proper membership workflow.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Make membership tiers fully dynamic | Pending | Remove hardcoded enum |
| 2.2 | Add membershipStatus field | Pending | See status flow below |
| 2.3 | Add passwordHash column to users | Pending | bcrypt hashing |
| 2.4 | Implement Passport.js local strategy | Pending | Login, session handling |
| 2.5 | Build signup flow | Pending | Email verification, 15-min token |
| 2.6 | Integrate Cloudflare Turnstile CAPTCHA | Pending | Signup + Contact forms |
| 2.7 | Add terms acceptance tracking | Pending | T&C checkbox, date |
| 2.8 | Implement admin approval workflow | Pending | Approve/Reject membership |
| 2.9 | Add password reset flow | Pending | Secure token via email |
| 2.10 | Add account lockout | Pending | After X failed attempts |
| 2.11 | Implement membership expiry | Pending | Auto-downgrade to GUEST |
| 2.12 | Add guest pass tracking | Pending | Limit per tier |
| 2.13 | Add payment reference tracking | Pending | WhatsApp payment refs |
| 2.14 | Create admin seeding script | Pending | Initial admin user |

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
| 3.1 | Fetch real user membership data | Pending | Tier, status, expiry from DB |
| 3.2 | Block discounts if status ≠ ACTIVE | Pending | Security check |
| 3.3 | Enforce booking window limits | Pending | 14/7/5/2 days by tier |
| 3.4 | Make add-ons database-driven | Pending | Use facility_add_ons table |
| 3.5 | Make venues database-driven | Pending | Use venues table |
| 3.6 | Fetch real leaderboard | Pending | From leaderboard table |
| 3.7 | Make time slots configurable | Pending | CMS settings |
| 3.8 | Remove ALL MOCK data | Pending | Clean up hardcoded arrays |

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
| 4.1 | Create member profile page | Pending | Photo, info, membership |
| 4.2 | Add booking history view | Pending | Past and upcoming |
| 4.3 | Build in-app notification center | Pending | Bell icon, list |
| 4.4 | Create email templates (Resend) | Pending | See list below |
| 4.5 | Add renewal reminder system | Pending | 7, 3, 1 days |

### Email Templates Required
- [ ] Welcome email (after signup)
- [ ] Email verification
- [ ] Membership approved
- [ ] Membership rejected
- [ ] Booking confirmation
- [ ] Booking cancellation
- [ ] Payment verified
- [ ] Renewal reminder (7 days)
- [ ] Renewal reminder (3 days)
- [ ] Renewal reminder (1 day)
- [ ] Membership expired

---

## Batch 5: Security & UX Hardening

### Objective
Production-ready security and polished user experience.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Implement configurable ADMIN_BASE_PATH | Pending | Mask admin route |
| 5.2 | Add server-side admin protection | Pending | Redirect non-admins |
| 5.3 | Add Helmet security headers | Pending | XSS, CSRF, etc. |
| 5.4 | Add rate limiting | Pending | Login, API endpoints |
| 5.5 | Implement admin audit logging | Pending | Track admin actions |
| 5.6 | Build route registry | Pending | Ghost-link prevention |
| 5.7 | Add WhatsApp floating button | Pending | CMS-configurable |
| 5.8 | Add 404 page with helpful redirects | Pending | User-friendly errors |

### Admin Path Security
```
Current: /admin (exposed)
Target: /${ADMIN_BASE_PATH} (configurable via env)
Example: /manage-qd2025-secure
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
- [ ] Batch 1: CMS Dynamism
- [ ] Batch 2: Membership & Auth
- [ ] Batch 3: Booking Portal
- [ ] Batch 4: Dashboard & Notifications
- [ ] Batch 5: Security & UX
- [ ] Batch 6: Deployment Prep

---

*Last Updated: December 21, 2025*
