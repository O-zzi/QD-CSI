# Deployment Guide - The Quarterdeck

## Prerequisites
- Node.js 20+ on your server
- PostgreSQL database
- SSH access to your Hostinger server

## Step 1: Clear Existing Files
In Hostinger File Manager or SSH:
- Rename old `public_html` to `public_html_old`
- Create new empty `public_html` folder

## Step 2: Clone from GitHub
```bash
cd /home/u805618386/public_html/
git clone https://github.com/O-zzi/QD-CSI.git .
```

Note the `.` at the end - this clones into the current directory.

## Step 3: Install Dependencies
```bash
npm install
```

## Step 4: Create Production Environment File
Create `.env` file with your production values:
```bash
nano .env
```

Copy the contents from `.env.production.example` and fill in your actual values.

### Required Variables:
| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| SESSION_SECRET | Random 32+ character string for session encryption |
| SUPABASE_URL | Your Supabase project URL |
| SUPABASE_ANON_KEY | Supabase anonymous key |
| SUPABASE_SERVICE_KEY | Supabase service role key |

### Email Configuration (Hostinger):
| Variable | Value |
|----------|-------|
| SMTP_HOST | smtp.hostinger.com |
| SMTP_PORT | 465 |
| SMTP_USER | noreply@thequarterdeck.pk |
| SMTP_PASS | Your email password |

## Step 5: Build for Production
```bash
npm run build
```

This creates the `dist/` folder with production files.

## Step 6: Configure Passenger (Hostinger)

Create or edit `app.js` in public_html root:
```javascript
require('./dist/index.cjs');
```

Or configure Passenger to run:
```bash
node dist/index.cjs
```

## Step 7: Restart Application
```bash
mkdir -p tmp
touch tmp/restart.txt
```

## Step 8: Verify Deployment
Visit https://thequarterdeck.pk and check:
- Homepage loads correctly
- API endpoints respond (check browser console)
- Login/authentication works

## Troubleshooting

### 503 Error
- Check if `dist/index.cjs` exists
- Verify all environment variables are set
- Check Passenger error logs

### Database Connection Failed
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is accessible from Hostinger
- Check if database exists and migrations ran

### Logs Location
Check Passenger logs at:
```bash
tail -f ~/logs/error.log
```

## Updating the Application

When you make changes:
```bash
cd /home/u805618386/public_html/
git pull origin main
npm install
npm run build
touch tmp/restart.txt
```
