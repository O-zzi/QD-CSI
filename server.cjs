/**
 * Production entry point for PM2/Passenger
 * 
 * This file is the entry point for Hostinger VPS deployment.
 * Ensure you have run `npm run build` before deploying.
 */

const fs = require('fs');
const path = require('path');

// Manually load .env file since dotenv may not be available
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  console.log('Environment variables loaded from .env');
} else {
  console.log('.env file not found, using system environment variables');
}

// Set production environment
process.env.NODE_ENV = 'production';

// Start the compiled server
require('./dist/index.cjs');
