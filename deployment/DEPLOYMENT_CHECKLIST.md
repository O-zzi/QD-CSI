# The Quarterdeck - Deployment Checklist

## Pre-Deployment Preparation

### 1. Environment Setup
- [ ] Copy `.env.example` to `.env` on production server
- [ ] Set `DATABASE_URL` to Supabase PostgreSQL connection string
- [ ] Generate and set strong `SESSION_SECRET` (min 32 characters)
- [ ] Set custom `ADMIN_PATH` for security
- [ ] Configure `RESEND_API_KEY` for email notifications
- [ ] Set up Cloudflare Turnstile and configure keys

### 2. Database Setup (Supabase)
- [ ] Create Supabase project
- [ ] Import `deployment/schema.sql` to create tables
- [ ] Import `deployment/seed.sql` for initial data (optional)
- [ ] Verify database connection from local environment
- [ ] Note: Use SSL mode for production connections

### 3. Build Application
```bash
npm install
npm run build
```
- [ ] Verify `dist/` folder is created
- [ ] Verify `dist/public/` contains frontend assets

### 4. Admin User Setup
- [ ] Create admin user account in database
- [ ] Set `role` to `ADMIN` or `SUPER_ADMIN`
- [ ] Test admin login locally before deployment

---

## Hostinger VPS Deployment

### 5. Server Preparation
- [ ] SSH into Hostinger VPS
- [ ] Install Node.js (v18+ recommended)
- [ ] Create application directory
- [ ] Set up domain and SSL certificate

### 6. Upload Files
Upload these files/folders to your VPS:
- [ ] `dist/` - Compiled application
- [ ] `server.js` - Passenger entry point
- [ ] `package.json` & `package-lock.json`
- [ ] `.htaccess` - Passenger configuration
- [ ] `.env` - Environment variables (create from .env.example)
- [ ] `uploads/` - Create empty directory for file uploads

### 7. Install Dependencies
```bash
npm install --production
```
- [ ] Verify node_modules is created
- [ ] Check no dev dependencies installed

### 8. Configure Passenger
- [ ] Place `.htaccess` in `public_html` root
- [ ] Verify `PassengerStartupFile` points to `server.js`
- [ ] Uncomment HTTPS redirect when SSL is ready
- [ ] Restart Passenger application

### 9. Create Required Directories
```bash
mkdir -p uploads
mkdir -p logs
chmod 755 uploads logs
```

---

## Post-Deployment Verification

### 10. Health Check
- [ ] Visit `/api/health` - should return `{"status":"ok"}`
- [ ] Verify database connection status is "connected"

### 11. Functional Testing
- [ ] Home page loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Admin panel accessible at custom path
- [ ] Booking system functional
- [ ] Email notifications sending (if configured)

### 12. Security Verification
- [ ] HTTPS redirect working
- [ ] Admin path is obscured
- [ ] Rate limiting active
- [ ] Sensitive files blocked (.env, package.json, etc.)
- [ ] Session cookies secure

---

## Maintenance Commands

### Restart Application (via SSH)
```bash
touch tmp/restart.txt
```

### View Logs
```bash
tail -f logs/combined.log
tail -f logs/error.log
```

### Update Application
```bash
# Pull latest code or upload new dist/
npm install --production
touch tmp/restart.txt
```

---

## Rollback Procedure

If issues occur:
1. SSH into server
2. Restore previous `dist/` folder from backup
3. Restart application: `touch tmp/restart.txt`
4. If database issues, restore from Supabase backup

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| SESSION_SECRET | Yes | Session encryption key |
| NODE_ENV | No | production/development |
| PORT | No | Server port (default: 5000) |
| ADMIN_PATH | No | Custom admin URL path |
| RESEND_API_KEY | No | Email API key |
| EMAIL_FROM | No | Default sender email |
| ADMIN_EMAIL | No | Admin notification email |
| TURNSTILE_SITE_KEY | No | Bot protection site key |
| TURNSTILE_SECRET_KEY | No | Bot protection secret |
| LOG_LEVEL | No | debug/info/warn/error |

---

## Support Contacts

- **Technical Issues**: Check logs first, then contact developer
- **Supabase Issues**: https://supabase.com/support
- **Hostinger Issues**: https://www.hostinger.com/support
