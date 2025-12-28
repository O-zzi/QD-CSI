import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { logger } from './logger';

const supabaseUrl = process.env.SUPABASE_URL;
// Support both SUPABASE_SERVICE_KEY and SUPABASE_SERVICE_ROLE_KEY for flexibility
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  return supabaseAdmin;
}

export function isSupabaseAuthEnabled(): boolean {
  return !!(supabaseUrl && supabaseServiceKey);
}

export async function verifySupabaseToken(token: string): Promise<any | null> {
  const client = getSupabaseAdmin();
  if (!client) {
    return null;
  }
  
  try {
    const { data: { user }, error } = await client.auth.getUser(token);
    
    if (error || !user) {
      logger.debug('Supabase token verification failed:', error?.message);
      return null;
    }
    
    return user;
  } catch (error) {
    logger.error('Supabase token verification error:', error);
    return null;
  }
}

export async function syncSupabaseUser(
  supabaseUserId: string,
  email: string,
  supabaseEmailConfirmed: boolean,
  firstName?: string,
  lastName?: string
): Promise<any> {
  let user = await storage.getUserByEmail(email);
  
  if (!user) {
    user = await storage.upsertUser({
      id: supabaseUserId,
      email,
      firstName: firstName || null,
      lastName: lastName || null,
      role: 'USER',
      emailVerified: supabaseEmailConfirmed,
    });
    logger.info(`Created new user from Supabase: ${email}, emailVerified: ${supabaseEmailConfirmed}`);
  } else if (user.id !== supabaseUserId) {
    logger.info(`Linked existing user ${email} to Supabase ID`);
  }
  
  return user;
}

export function supabaseAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.substring(7);
  
  verifySupabaseToken(token)
    .then(async (supabaseUser) => {
      if (supabaseUser) {
        const dbUser = await storage.getUserByEmail(supabaseUser.email);
        if (dbUser) {
          (req as any).user = dbUser;
          (req as any).supabaseUser = supabaseUser;
        }
      }
      next();
    })
    .catch((error) => {
      logger.error('Supabase auth middleware error:', error);
      next();
    });
}
