import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { sendWelcomeEmail } from "./email";

// Security constants for admin access
const ADMIN_REAUTH_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes - require fresh login
const ADMIN_INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes - inactivity timeout

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  const userId = claims["sub"];
  
  // Check if this is a new user
  const existingUser = await storage.getUser(userId);
  const isNewUser = !existingUser;
  
  const now = new Date();
  
  // Upsert user record with authentication timestamp
  const user = await storage.upsertUser({
    id: userId,
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    lastAuthenticatedAt: now,
    lastActivityAt: now,
  });
  
  // Check if user has a membership, if not create a guest membership
  const existingMembership = await storage.getMembership(userId);
  if (!existingMembership) {
    try {
      // Generate membership number: QD-XXXX format
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const membershipNumber = `QD-${randomNum}`;
      
      // Create a guest membership valid for 1 year
      const validTo = new Date();
      validTo.setFullYear(validTo.getFullYear() + 1);
      
      await storage.createMembership({
        userId,
        tier: 'GUEST',
        membershipNumber,
        status: 'ACTIVE',
        validFrom: new Date(),
        validTo,
        guestPasses: 0,
      });
      console.log(`Created guest membership for user ${userId}`);
    } catch (error) {
      console.error(`Failed to create guest membership for user ${userId}:`, error);
    }
  }
  
  // Send welcome email for new users
  if (isNewUser && user.email) {
    sendWelcomeEmail({ 
      firstName: user.firstName, 
      email: user.email 
    }).catch(err => {
      console.error('[email] Failed to send welcome email:', err);
    });
    console.log(`Sent welcome email to new user ${userId}`);
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Middleware to check admin role and update activity
export const isAdmin: RequestHandler = async (req, res, next) => {
  const sessionUser = req.user as any;
  if (!sessionUser?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(sessionUser.claims.sub);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  const now = Date.now();

  // Check for inactivity timeout (2 minutes)
  if (user.lastActivityAt) {
    const inactiveTime = now - new Date(user.lastActivityAt).getTime();
    if (inactiveTime > ADMIN_INACTIVITY_TIMEOUT_MS) {
      return res.status(401).json({ 
        message: "Session timed out", 
        code: "ADMIN_INACTIVITY_TIMEOUT",
        reason: "You have been logged out due to inactivity. Please log in again."
      });
    }
  }

  // Check if authentication is fresh (within 10 minutes)
  if (user.lastAuthenticatedAt) {
    const authAge = now - new Date(user.lastAuthenticatedAt).getTime();
    if (authAge > ADMIN_REAUTH_TIMEOUT_MS) {
      return res.status(401).json({ 
        message: "Session expired", 
        code: "ADMIN_REAUTH_REQUIRED",
        reason: "Your admin session has expired. Please log in again to access the admin panel."
      });
    }
  } else {
    // No authentication timestamp - require fresh login
    return res.status(401).json({ 
      message: "Session expired", 
      code: "ADMIN_REAUTH_REQUIRED",
      reason: "Please log in again to access the admin panel."
    });
  }

  // Update activity on every admin request
  await storage.updateUserActivity(user.id);

  next();
};

// Middleware to enforce admin security (re-authentication + activity timeout)
export const isAdminSecure: RequestHandler = async (req, res, next) => {
  const sessionUser = req.user as any;
  if (!sessionUser?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(sessionUser.claims.sub);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  const now = Date.now();

  // Check if authentication is fresh (within 10 minutes)
  if (user.lastAuthenticatedAt) {
    const authAge = now - new Date(user.lastAuthenticatedAt).getTime();
    if (authAge > ADMIN_REAUTH_TIMEOUT_MS) {
      return res.status(401).json({ 
        message: "Session expired", 
        code: "ADMIN_REAUTH_REQUIRED",
        reason: "Your admin session has expired. Please log in again to access the admin panel."
      });
    }
  } else {
    // No authentication timestamp - require fresh login
    return res.status(401).json({ 
      message: "Session expired", 
      code: "ADMIN_REAUTH_REQUIRED",
      reason: "Please log in again to access the admin panel."
    });
  }

  // Check for inactivity timeout (2 minutes)
  if (user.lastActivityAt) {
    const inactiveTime = now - new Date(user.lastActivityAt).getTime();
    if (inactiveTime > ADMIN_INACTIVITY_TIMEOUT_MS) {
      return res.status(401).json({ 
        message: "Session timed out", 
        code: "ADMIN_INACTIVITY_TIMEOUT",
        reason: "You have been logged out due to inactivity. Please log in again."
      });
    }
  }

  // Update last activity timestamp
  await storage.updateUserActivity(user.id);

  next();
};

// Middleware to update activity timestamp (for admin routes)
export const updateAdminActivity: RequestHandler = async (req, res, next) => {
  const sessionUser = req.user as any;
  if (sessionUser?.claims?.sub) {
    const user = await storage.getUser(sessionUser.claims.sub);
    if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      await storage.updateUserActivity(user.id);
    }
  }
  next();
};

// API endpoint to refresh admin activity (heartbeat)
export const adminHeartbeat: RequestHandler = async (req, res) => {
  const sessionUser = req.user as any;
  if (!sessionUser?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(sessionUser.claims.sub);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const now = Date.now();

  // Check if authentication is still valid
  if (user.lastAuthenticatedAt) {
    const authAge = now - new Date(user.lastAuthenticatedAt).getTime();
    if (authAge > ADMIN_REAUTH_TIMEOUT_MS) {
      return res.status(401).json({ 
        code: "ADMIN_REAUTH_REQUIRED",
        message: "Admin session expired"
      });
    }
  }

  // Check for inactivity timeout
  if (user.lastActivityAt) {
    const inactiveTime = now - new Date(user.lastActivityAt).getTime();
    if (inactiveTime > ADMIN_INACTIVITY_TIMEOUT_MS) {
      return res.status(401).json({ 
        code: "ADMIN_INACTIVITY_TIMEOUT",
        message: "Session timed out due to inactivity"
      });
    }
  }

  // Update activity and return remaining time
  await storage.updateUserActivity(user.id);

  const authAge = user.lastAuthenticatedAt ? now - new Date(user.lastAuthenticatedAt).getTime() : 0;
  const sessionRemainingMs = ADMIN_REAUTH_TIMEOUT_MS - authAge;
  const inactivityRemainingMs = ADMIN_INACTIVITY_TIMEOUT_MS;

  res.json({ 
    success: true,
    sessionRemainingMs,
    inactivityTimeoutMs: ADMIN_INACTIVITY_TIMEOUT_MS,
    reauthTimeoutMs: ADMIN_REAUTH_TIMEOUT_MS
  });
};
