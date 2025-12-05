import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { sendWelcomeEmail } from "./email";

// Security constants for all authenticated users
const SESSION_REAUTH_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes - require fresh login
const SESSION_INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes - inactivity timeout

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
  const sessionUser = req.user as any;

  if (!req.isAuthenticated() || !sessionUser.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const nowMs = Date.now();

  // Check if OIDC token is expired and try to refresh
  if (nowSeconds > sessionUser.expires_at) {
    const refreshToken = sessionUser.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      updateUserSession(sessionUser, tokenResponse);
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  // Get user from database for session timeout checks
  if (!sessionUser?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(sessionUser.claims.sub);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check for inactivity timeout (2 minutes)
  if (user.lastActivityAt) {
    const inactiveTime = nowMs - new Date(user.lastActivityAt).getTime();
    if (inactiveTime > SESSION_INACTIVITY_TIMEOUT_MS) {
      return res.status(401).json({ 
        message: "Session timed out", 
        code: "SESSION_INACTIVITY_TIMEOUT",
        reason: "You have been logged out due to inactivity. Please log in again."
      });
    }
  }

  // Check if authentication is fresh (within 10 minutes)
  if (user.lastAuthenticatedAt) {
    const authAge = nowMs - new Date(user.lastAuthenticatedAt).getTime();
    if (authAge > SESSION_REAUTH_TIMEOUT_MS) {
      return res.status(401).json({ 
        message: "Session expired", 
        code: "SESSION_REAUTH_REQUIRED",
        reason: "Your session has expired. Please log in again."
      });
    }
  } else {
    // No authentication timestamp - require fresh login
    return res.status(401).json({ 
      message: "Session expired", 
      code: "SESSION_REAUTH_REQUIRED",
      reason: "Please log in again."
    });
  }

  // Update activity on every authenticated request
  await storage.updateUserActivity(user.id);

  next();
};

// Middleware to check admin role (session security already handled by isAuthenticated)
export const isAdmin: RequestHandler = async (req, res, next) => {
  const sessionUser = req.user as any;
  if (!sessionUser?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(sessionUser.claims.sub);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  next();
};

// API endpoint to check session status and refresh activity (heartbeat) - for all authenticated users
export const sessionHeartbeat: RequestHandler = async (req, res) => {
  const sessionUser = req.user as any;
  if (!sessionUser?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(sessionUser.claims.sub);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Date.now();

  // Check if authentication is still valid
  if (user.lastAuthenticatedAt) {
    const authAge = now - new Date(user.lastAuthenticatedAt).getTime();
    if (authAge > SESSION_REAUTH_TIMEOUT_MS) {
      return res.status(401).json({ 
        code: "SESSION_REAUTH_REQUIRED",
        message: "Session expired"
      });
    }
  }

  // Check for inactivity timeout
  if (user.lastActivityAt) {
    const inactiveTime = now - new Date(user.lastActivityAt).getTime();
    if (inactiveTime > SESSION_INACTIVITY_TIMEOUT_MS) {
      return res.status(401).json({ 
        code: "SESSION_INACTIVITY_TIMEOUT",
        message: "Session timed out due to inactivity"
      });
    }
  }

  // Update activity and return remaining time
  await storage.updateUserActivity(user.id);

  const authAge = user.lastAuthenticatedAt ? now - new Date(user.lastAuthenticatedAt).getTime() : 0;
  const sessionRemainingMs = SESSION_REAUTH_TIMEOUT_MS - authAge;

  res.json({ 
    success: true,
    sessionRemainingMs,
    inactivityTimeoutMs: SESSION_INACTIVITY_TIMEOUT_MS,
    reauthTimeoutMs: SESSION_REAUTH_TIMEOUT_MS
  });
};

// Legacy admin heartbeat - now uses same logic as general session heartbeat
export const adminHeartbeat: RequestHandler = sessionHeartbeat;
