import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import bcrypt from "bcrypt";
import crypto from "crypto";
import type { Express, Request, Response, NextFunction } from "express";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
import { storage } from "./storage";
import { getDatabaseUrl } from "./db";
import { sendWelcomeEmail, sendPasswordResetEmail, sendEmailVerificationEmail } from "./email";

const SALT_ROUNDS = 12;
const EMAIL_VERIFICATION_EXPIRY_MINUTES = 15;
const PASSWORD_RESET_EXPIRY_MINUTES = 60;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

const SESSION_REAUTH_TIMEOUT_MS = 10 * 60 * 1000;
const SESSION_INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  
  let sessionStore: session.Store;
  
  let dbUrl: string | null = null;
  try {
    dbUrl = getDatabaseUrl();
  } catch {}
  
  const usePgStore = process.env.USE_PG_SESSION_STORE === 'true' && dbUrl;
  
  if (usePgStore) {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: dbUrl,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
      errorLog: (error: Error) => {
        console.error('[auth] PostgreSQL session store error:', error.message);
      },
    });
    console.log('[auth] Using PostgreSQL session store');
  } else {
    console.log('[auth] Using memory session store (set USE_PG_SESSION_STORE=true to use PostgreSQL)');
    const MemoryStore = createMemoryStore(session);
    sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email.toLowerCase());
        
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.passwordHash) {
          return done(null, false, { message: 'Please use password reset to set a password' });
        }

        if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
          const minutesRemaining = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / 60000);
          return done(null, false, { message: `Account locked. Try again in ${minutesRemaining} minutes.` });
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash);

        if (!isValidPassword) {
          const newAttempts = (user.failedLoginAttempts || 0) + 1;
          
          if (newAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
            const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
            await storage.updateUserLoginAttempts(user.id, newAttempts, lockoutUntil);
            return done(null, false, { message: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.` });
          }
          
          await storage.updateUserLoginAttempts(user.id, newAttempts, null);
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.emailVerified) {
          return done(null, false, { message: 'Please verify your email before logging in' });
        }

        await storage.updateUserLoginAttempts(user.id, 0, null);
        
        const now = new Date();
        await storage.updateUserActivity(user.id, now, now);

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, phone, termsAccepted, turnstileToken } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Email, password, first name, and last name are required" });
      }

      if (!termsAccepted) {
        return res.status(400).json({ message: "You must accept the terms and conditions" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      if (turnstileToken) {
        const turnstileValid = await verifyTurnstileToken(turnstileToken);
        if (!turnstileValid) {
          return res.status(400).json({ message: "CAPTCHA verification failed. Please try again." });
        }
      }

      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      const passwordHash = await hashPassword(password);
      const emailVerificationToken = generateToken();
      const emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MINUTES * 60 * 1000);

      const user = await storage.createUser({
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone: phone || null,
        emailVerified: false,
        emailVerificationToken,
        emailVerificationExpires,
        termsAcceptedAt: new Date(),
      });

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const membershipNumber = `QD-${randomNum}`;
      const validTo = new Date();
      validTo.setFullYear(validTo.getFullYear() + 1);

      await storage.createMembership({
        userId: user.id,
        tier: 'GUEST',
        membershipNumber,
        status: 'PENDING_PAYMENT',
        validFrom: new Date(),
        validTo,
        guestPasses: 0,
      });

      try {
        await sendEmailVerificationEmail({
          email: user.email!,
          firstName: user.firstName || 'Member',
          verificationToken: emailVerificationToken,
        });
      } catch (emailError) {
        console.error('[auth] Failed to send verification email:', emailError);
      }

      return res.status(201).json({ 
        message: "Account created. Please check your email to verify your account.",
        userId: user.id 
      });
    } catch (error) {
      console.error('[auth] Signup error:', error);
      return res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      const user = await storage.getUserByEmailVerificationToken(token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      if (user.emailVerificationExpires && new Date(user.emailVerificationExpires) < new Date()) {
        return res.status(400).json({ message: "Verification token has expired. Please request a new one." });
      }

      await storage.verifyUserEmail(user.id);

      try {
        await sendWelcomeEmail({
          email: user.email!,
          firstName: user.firstName || 'Member',
        });
      } catch (emailError) {
        console.error('[auth] Failed to send welcome email:', emailError);
      }

      return res.json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
      console.error('[auth] Email verification error:', error);
      return res.status(500).json({ message: "Failed to verify email" });
    }
  });

  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email.toLowerCase());

      if (!user) {
        return res.json({ message: "If an account exists, a verification email has been sent." });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      const emailVerificationToken = generateToken();
      const emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MINUTES * 60 * 1000);

      await storage.updateEmailVerificationToken(user.id, emailVerificationToken, emailVerificationExpires);

      try {
        await sendEmailVerificationEmail({
          email: user.email!,
          firstName: user.firstName || 'Member',
          verificationToken: emailVerificationToken,
        });
      } catch (emailError) {
        console.error('[auth] Failed to send verification email:', emailError);
      }

      return res.json({ message: "If an account exists, a verification email has been sent." });
    } catch (error) {
      console.error('[auth] Resend verification error:', error);
      return res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Login failed" });
        }
        
        const safeUser = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          role: user.role,
        };
        
        return res.json({ message: "Login successful", user: safeUser });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error('[auth] Session destroy error:', destroyErr);
        }
        res.clearCookie('connect.sid');
        return res.json({ message: "Logged out successfully" });
      });
    });
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email, turnstileToken } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      if (turnstileToken) {
        const turnstileValid = await verifyTurnstileToken(turnstileToken);
        if (!turnstileValid) {
          return res.status(400).json({ message: "CAPTCHA verification failed" });
        }
      }

      const user = await storage.getUserByEmail(email.toLowerCase());

      if (user) {
        const passwordResetToken = generateToken();
        const passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);

        await storage.updatePasswordResetToken(user.id, passwordResetToken, passwordResetExpires);

        try {
          await sendPasswordResetEmail({
            email: user.email!,
            firstName: user.firstName || 'Member',
            resetToken: passwordResetToken,
          });
        } catch (emailError) {
          console.error('[auth] Failed to send password reset email:', emailError);
        }
      }

      return res.json({ message: "If an account exists with this email, a password reset link has been sent." });
    } catch (error) {
      console.error('[auth] Forgot password error:', error);
      return res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await storage.getUserByPasswordResetToken(token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      if (user.passwordResetExpires && new Date(user.passwordResetExpires) < new Date()) {
        return res.status(400).json({ message: "Reset token has expired. Please request a new one." });
      }

      const passwordHash = await hashPassword(password);
      await storage.updateUserPassword(user.id, passwordHash);

      return res.json({ message: "Password reset successful. You can now log in." });
    } catch (error) {
      console.error('[auth] Reset password error:', error);
      return res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as any;
    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      phone: user.phone,
      role: user.role,
      isSafetyCertified: user.isSafetyCertified,
      hasSignedWaiver: user.hasSignedWaiver,
      creditBalance: user.creditBalance,
      totalHoursPlayed: user.totalHoursPlayed,
    };

    return res.json(safeUser);
  });
}

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('[auth] Turnstile secret key not configured, skipping verification');
    return true;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json() as { success: boolean };
    return data.success;
  } catch (error) {
    console.error('[auth] Turnstile verification error:', error);
    return false;
  }
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;

  if (user.lastAuthenticatedAt) {
    const timeSinceAuth = Date.now() - new Date(user.lastAuthenticatedAt).getTime();
    if (timeSinceAuth > SESSION_REAUTH_TIMEOUT_MS) {
      req.logout((err) => {
        if (err) console.error('[auth] Logout error:', err);
      });
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
  }

  if (user.lastActivityAt) {
    const timeSinceActivity = Date.now() - new Date(user.lastActivityAt).getTime();
    if (timeSinceActivity > SESSION_INACTIVITY_TIMEOUT_MS) {
      req.logout((err) => {
        if (err) console.error('[auth] Logout error:', err);
      });
      return res.status(401).json({ message: "Session expired due to inactivity." });
    }
  }

  storage.updateUserActivity(user.id, null, new Date()).catch(err => {
    console.error('[auth] Failed to update user activity:', err);
  });

  next();
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }

  next();
};

export const sessionHeartbeat = async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user as any;
  
  try {
    await storage.updateUserActivity(user.id, null, new Date());
    return res.json({ success: true });
  } catch (error) {
    console.error('[auth] Failed to update session heartbeat:', error);
    return res.status(500).json({ message: "Failed to update session" });
  }
};

export const adminHeartbeat = async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user as any;
  
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  
  try {
    await storage.updateUserActivity(user.id, null, new Date());
    return res.json({ success: true });
  } catch (error) {
    console.error('[auth] Failed to update admin heartbeat:', error);
    return res.status(500).json({ message: "Failed to update session" });
  }
};
