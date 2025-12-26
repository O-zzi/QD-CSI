/**
 * Production entry point for Passenger (Hostinger VPS)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load environment variables first
require('./loadEnv.cjs');

// Start the compiled server
require('./dist/index.cjs');
