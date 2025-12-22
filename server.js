/**
 * Production entry point for Passenger (ES Module)
 * 
 * This file is the entry point for Hostinger VPS with Passenger.
 * Passenger expects a server.js file in the root directory.
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
require('dotenv').config({ path: join(__dirname, '.env') });

// Set production environment
process.env.NODE_ENV = 'production';

// Start the compiled server (CommonJS bundle)
require('./dist/index.cjs');
