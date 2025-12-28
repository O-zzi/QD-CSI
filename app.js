// Passenger entry point for Hostinger
// This file should be at the root of public_html

const fs = require('fs');
const path = require('path');

// Log startup
console.log('[Passenger] Starting The Quarterdeck...');
console.log('[Passenger] Node version:', process.version);
console.log('[Passenger] Working directory:', __dirname);

// Load .env file from current directory
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('[Passenger] Loading .env from:', envPath);
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        let value = trimmed.substring(eqIndex + 1).trim();
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
  console.log('[Passenger] Environment loaded successfully');
} else {
  console.warn('[Passenger] No .env file found at:', envPath);
}

// Set production mode
process.env.NODE_ENV = 'production';

// Check critical environment variables
const requiredVars = ['DATABASE_URL', 'SESSION_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error('[Passenger] Missing required environment variables:', missing.join(', '));
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Passenger] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Passenger] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Now require the actual app
try {
  console.log('[Passenger] Loading application...');
  require('./dist/index.cjs');
} catch (err) {
  console.error('[Passenger] Failed to load application:', err);
  process.exit(1);
}
