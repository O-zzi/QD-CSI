# Hostinger VPS + Supabase Deployment Guide

This guide covers deploying a Replit full-stack JavaScript application to Hostinger shared VPS with Supabase PostgreSQL backend.

---

## Prerequisites

- Hostinger VPS with Node.js support (OpenLiteSpeed + Passenger)
- Supabase account with a project created
- SSH access to Hostinger VPS
- Git repository with your app

---

## Part 1: Supabase Database Setup

### 1.1 Create Supabase Project
1. Go to https://supabase.com and create a new project
2. Note your project reference ID (e.g., `jjicxmwzvfzzasrexvml`)

### 1.2 Get Connection String
1. Go to **Project Settings > Database**
2. Copy the **Connection string (URI)** under "Connection pooling" section
3. **IMPORTANT**: Use the **pooler URL** (ends with `pooler.supabase.com`), NOT the direct connection
   - Hostinger VPS requires IPv4, and the pooler provides IPv4 compatibility
   - Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`

### 1.3 Create Tables
1. Go to **SQL Editor** in Supabase
2. Run your schema creation SQL (or use Drizzle push from local)

### 1.4 Disable RLS (for backend-only access)
If your Express backend connects directly with credentials (bypassing Supabase client):
```sql
-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
-- ... repeat for all tables
```

### 1.5 Verify Schema Matches Drizzle
Compare your `shared/schema.ts` columns with Supabase table columns:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'your_table_name'
ORDER BY ordinal_position;
```

Add any missing columns:
```sql
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name data_type;
```

---

## Part 2: Build Your App Locally (Replit)

### 2.1 Build the Production Bundle
```bash
npm run build
```

This creates:
- `dist/index.js` - ESM server entry point
- `dist/index.cjs` - CommonJS server bundle
- `dist/public/` - Static frontend assets

### 2.2 Files to Deploy
```
dist/
├── index.js          # ESM entry
├── index.cjs         # CJS bundle
└── public/
    ├── assets/       # JS/CSS bundles
    └── index.html    # Frontend entry
```

---

## Part 3: Hostinger VPS Setup

### 3.1 Directory Structure
```
~/domains/your-domain.hostingersite.com/
└── public_html/           # Web root (Passenger runs from here)
    ├── .htaccess          # Passenger configuration
    ├── .env               # Environment variables
    ├── server.js          # Entry point for Passenger
    ├── package.json       # Dependencies
    ├── node_modules/      # Installed packages
    ├── dist/              # Built app
    │   ├── index.js
    │   ├── index.cjs
    │   └── public/
    └── tmp/
        └── restart.txt    # Touch to restart Passenger
```

### 3.2 Create .htaccess (Passenger Configuration)
Create `public_html/.htaccess`:
```apache
PassengerAppRoot /home/YOUR_USERNAME/domains/your-domain.hostingersite.com/public_html
PassengerAppType node
PassengerNodejs /opt/alt/alt-nodejs20/root/bin/node
PassengerStartupFile server.js
PassengerBaseURI /
```

**Find your Node.js path:**
```bash
which node
# or
ls /opt/alt/alt-nodejs*/root/bin/node
```

### 3.3 Create server.js (Entry Point)
Create `public_html/server.js`:
```javascript
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env manually before importing app
const envPath = join(__dirname, '.env');
const envContent = readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

// Now import the app
import('./dist/index.js');
```

**Alternative (if dotenv is installed):**
```javascript
import 'dotenv/config';
import './dist/index.js';
```

### 3.4 Create .env File
Create `public_html/.env`:
```env
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
SESSION_SECRET=your-secure-session-secret
NODE_ENV=production
PORT=5000
ADMIN_PATH=manage
```

**Generate a secure session secret:**
```bash
openssl rand -base64 32
```

### 3.5 Create package.json
Create `public_html/package.json`:
```json
{
  "name": "your-app-name",
  "type": "module",
  "dependencies": {
    "dotenv": "^16.3.1"
  }
}
```

### 3.6 Install Dependencies
```bash
cd ~/domains/your-domain.hostingersite.com/public_html
npm install
```

Also install your app's production dependencies if needed (pg, drizzle-orm, etc.):
```bash
npm install pg drizzle-orm express
```

---

## Part 4: Deploy Files

### 4.1 Option A: Git Clone (Recommended)
```bash
cd ~/domains/your-domain.hostingersite.com/public_html
git clone https://github.com/your-repo.git .
npm install
npm run build  # If build isn't committed
```

### 4.2 Option B: Manual Upload
Upload via SFTP:
1. Upload `dist/` folder
2. Upload `package.json`
3. Create `.htaccess`, `server.js`, `.env` manually

### 4.3 Set Permissions
```bash
chmod 755 ~/domains/your-domain.hostingersite.com/public_html
chmod 644 ~/domains/your-domain.hostingersite.com/public_html/.env
```

---

## Part 5: Restart & Test

### 5.1 Restart Passenger
```bash
touch ~/domains/your-domain.hostingersite.com/public_html/tmp/restart.txt
```

### 5.2 Test API Endpoints
```bash
curl https://your-domain.hostingersite.com/api/health
curl https://your-domain.hostingersite.com/api/projects
```

### 5.3 Check Error Logs
```bash
tail -50 ~/domains/your-domain.hostingersite.com/public_html/stderr.log
```

---

## Part 6: Common Issues & Troubleshooting

### Issue: "DATABASE_URL must be set"
**Cause:** Environment variables not loading before app starts.

**Solutions:**
1. Ensure `.env` is in `public_html/` (same directory as `server.js`)
2. Use absolute path loading in `server.js` (see section 3.3)
3. Verify `.env` syntax - no spaces around `=`, no quotes

### Issue: "Failed to fetch [resource]"
**Cause:** Missing column in Supabase that Drizzle expects.

**Solution:**
```sql
-- Check columns in Supabase
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'your_table';

-- Add missing column
ALTER TABLE your_table ADD COLUMN IF NOT EXISTS missing_column text;
```

### Issue: Connection timeout / Can't connect to database
**Cause:** Using direct Supabase URL instead of pooler.

**Solution:** Use the pooler connection string:
- **Wrong:** `db.xxx.supabase.co`
- **Correct:** `aws-0-region.pooler.supabase.com`

### Issue: "dotenv is not defined" or module not found
**Cause:** dotenv not installed in public_html.

**Solution:**
```bash
cd ~/domains/your-domain.hostingersite.com/public_html
npm install dotenv
```

### Issue: Passenger not using server.js
**Cause:** .htaccess misconfigured or not being read.

**Verify:**
```bash
cat ~/domains/your-domain.hostingersite.com/public_html/.htaccess
```

Ensure `PassengerStartupFile server.js` is set.

### Issue: 503 Service Unavailable
**Cause:** App crashed on startup.

**Debug:**
```bash
tail -100 ~/domains/your-domain.hostingersite.com/public_html/stderr.log
```

---

## Part 7: Updating the App

### 7.1 Pull Latest Code
```bash
cd ~/domains/your-domain.hostingersite.com/public_html
git pull origin main
npm install
npm run build  # If needed
```

### 7.2 Restart
```bash
touch ~/domains/your-domain.hostingersite.com/public_html/tmp/restart.txt
```

### 7.3 Verify
```bash
curl https://your-domain.hostingersite.com/api/health
```

---

## Quick Reference Commands

```bash
# SSH to VPS
ssh u805618386@your-vps-ip

# Navigate to app
cd ~/domains/your-domain.hostingersite.com/public_html

# View logs
tail -f stderr.log

# Restart app
touch tmp/restart.txt

# Check environment
cat .env

# Test API
curl https://your-domain.hostingersite.com/api/projects

# Install packages
npm install package-name

# Update from git
git pull origin main && touch tmp/restart.txt
```

---

## Checklist for New Deployment

- [ ] Supabase project created
- [ ] Connection pooler URL copied (not direct)
- [ ] All tables created with matching columns
- [ ] RLS disabled (if using direct connection)
- [ ] App built locally (`npm run build`)
- [ ] .htaccess created with correct paths
- [ ] server.js created with env loading
- [ ] .env created with correct DATABASE_URL
- [ ] package.json created
- [ ] Dependencies installed (`npm install`)
- [ ] dist/ folder uploaded
- [ ] Passenger restarted (`touch tmp/restart.txt`)
- [ ] API endpoints tested
- [ ] Frontend loads correctly
