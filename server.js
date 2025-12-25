/**
 * Production entry point for Passenger
 * 
 * Uses dynamic import to load the CommonJS bundle.
 * This works with both ESM and Passenger's loader.
 */

// Set production environment
process.env.NODE_ENV = 'production';

// Use dynamic import to load the compiled CommonJS server
// This is an immediately invoked async function that Passenger can handle
(async () => {
  try {
    // Import the compiled CommonJS bundle using createRequire
    const { createRequire } = await import('module');
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    
    const require = createRequire(import.meta.url);
    const __dirname = dirname(fileURLToPath(import.meta.url));
    
    // Start the compiled server
    require('./dist/index.cjs');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
