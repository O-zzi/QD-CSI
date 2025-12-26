/**
 * Production entry point for Passenger (Hostinger VPS)
 * 
 * Loads .env file and then starts the compiled server.
 */

// Use dynamic import to load the compiled CommonJS server
(async () => {
  try {
    const { createRequire } = await import('module');
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    const fs = await import('fs');
    
    const require = createRequire(import.meta.url);
    const __dirname = dirname(fileURLToPath(import.meta.url));
    
    // Load .env file manually before starting server
    const envPath = join(__dirname, '.env');
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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
