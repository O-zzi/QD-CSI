import logger from "./logger";

interface EnvVarConfig {
  name: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

const envVarConfigs: EnvVarConfig[] = [
  { name: 'DATABASE_URL', required: true, description: 'PostgreSQL connection string' },
  { name: 'SESSION_SECRET', required: true, description: 'Session encryption secret' },
  { name: 'ADMIN_PATH', required: false, description: 'Custom admin panel URL path', defaultValue: 'admin' },
  { name: 'NODE_ENV', required: false, description: 'Environment mode (development/production)', defaultValue: 'development' },
  { name: 'PORT', required: false, description: 'Server port', defaultValue: '5000' },
  { name: 'RESEND_API_KEY', required: false, description: 'Resend email API key' },
  { name: 'EMAIL_FROM', required: false, description: 'Default from email address' },
  { name: 'ADMIN_EMAIL', required: false, description: 'Admin notification email address' },
  { name: 'TURNSTILE_SECRET_KEY', required: false, description: 'Cloudflare Turnstile secret key' },
  { name: 'TURNSTILE_SITE_KEY', required: false, description: 'Cloudflare Turnstile site key' },
  { name: 'REPLIT_DEPLOYMENT', required: false, description: 'Replit deployment flag' },
  { name: 'ISSUER_URL', required: false, description: 'OIDC issuer URL for Replit Auth' },
  { name: 'LOG_LEVEL', required: false, description: 'Winston log level (debug/info/warn/error)', defaultValue: 'info' },
];

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  logger.info('Validating environment variables...', { source: 'env' });

  for (const config of envVarConfigs) {
    const value = process.env[config.name];

    if (config.required && !value) {
      missing.push(`${config.name} - ${config.description}`);
    } else if (!config.required && !value && config.defaultValue) {
      warnings.push(`${config.name} not set, using default: ${config.defaultValue}`);
    }
  }

  if (missing.length > 0) {
    logger.error('Missing required environment variables:', { 
      source: 'env', 
      missing 
    });
  }

  if (warnings.length > 0) {
    warnings.forEach(warning => {
      logger.warn(warning, { source: 'env' });
    });
  }

  const valid = missing.length === 0;

  if (valid) {
    logger.info('Environment validation passed', { source: 'env' });
  }

  return { valid, missing, warnings };
}

export function getEnvSummary(): Record<string, string | boolean> {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '5000',
    databaseConfigured: !!process.env.DATABASE_URL,
    sessionSecretConfigured: !!process.env.SESSION_SECRET,
    emailConfigured: !!process.env.RESEND_API_KEY,
    turnstileConfigured: !!(process.env.TURNSTILE_SECRET_KEY && process.env.TURNSTILE_SITE_KEY),
    replitDeployment: !!process.env.REPLIT_DEPLOYMENT,
  };
}

export default validateEnvironment;
