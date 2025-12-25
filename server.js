/**
 * Production entry point for Passenger (ES Module)
 * 
 * This file is the entry point for Hostinger VPS with Passenger.
 * Passenger expects a server.js file in the root directory.
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Try to load dotenv if available (for local dev), skip if not installed
try {
  const envPath = join(__dirname, '.env');
  if (existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
} catch (e) {
  // dotenv not installed or .env not found - environment variables should be set externally
  console.log('Note: dotenv not available, using system environment variables');
}

// Set production environment
process.env.NODE_ENV = 'production';

// Start the compiled server (CommonJS bundle)
require('./dist/index.cjs');
