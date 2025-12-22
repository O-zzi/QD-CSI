/**
 * Production entry point for PM2/Passenger
 * 
 * This file is the entry point for Hostinger VPS deployment.
 * Ensure you have run `npm run build` before deploying.
 */

// Load environment variables from .env file
require('dotenv').config();

// Set production environment
process.env.NODE_ENV = 'production';

// Start the compiled server
require('./dist/index.cjs');
