/**
 * Production entry point for Passenger compatibility
 * 
 * This file is the entry point for Hostinger Shared VPS with Passenger.
 * Passenger expects a server.js file in the root directory.
 * 
 * Ensure you have run `npm run build` before deploying.
 */

// Set production environment
process.env.NODE_ENV = 'production';

// Start the compiled server
require('./dist/index.js');
