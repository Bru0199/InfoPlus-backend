import { Router } from "express";
import passport from "passport";
import { env } from "../env.js";
import { logger } from "../utils/logger.js";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants/index.js";
import { authProviders, users } from "../db/schema.js";
import { db } from "../db/index.js";
import { and, eq } from "drizzle-orm";

const authRouter = Router();

const REDIRECT_URL = env.FRONTEND_URL || "http://localhost:3000";
const CHAT_REDIRECT_URL = `${REDIRECT_URL}/chat`;

authRouter.get("/google", (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect(CHAT_REDIRECT_URL);
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next,
  );
});

authRouter.get("/github", (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect(CHAT_REDIRECT_URL);
  }
  passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
});

// --- Callbacks ---
authRouter.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { failureRedirect: `${REDIRECT_URL}/login` }, (err: any, user: any) => {
      if (err) return next(err);
      
      // Check if there's a pending link (same email, different provider)
      if (user?._pendingLink) {
        // Store pending link info in session WITHOUT logging in
        (req.session as any).pendingLink = {
          email: user.email,
          newProvider: user._newProvider,
          newProviderId: user._newProviderId,
          existingUserId: user.id,
        };
        req.session.save((saveErr) => {
          if (saveErr) {
            logger.error("Session save error:", saveErr);
            return next(saveErr);
          }
          return res.redirect(
            `${REDIRECT_URL}/link-provider?email=${encodeURIComponent(user.email)}&provider=${user._newProvider}&providerId=${user._newProviderId}`,
          );
        });
      } else {
        // New user or existing provider - log them in
        req.logIn(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          
          req.session.save((saveErr) => {
            if (saveErr) {
              logger.error("Session save error:", saveErr);
              return next(saveErr);
            }
            
            res.redirect(CHAT_REDIRECT_URL);
          });
        });
      }
    })(req, res, next);
  },
);

authRouter.get(
  "/github/callback",
  (req, res, next) => {
    passport.authenticate("github", { failureRedirect: `${REDIRECT_URL}/login` }, (err: any, user: any) => {
      if (err) return next(err);
      
      // Check if there's a pending link (same email, different provider)
      if (user?._pendingLink) {
        // Store pending link info in session WITHOUT logging in
        (req.session as any).pendingLink = {
          email: user.email,
          newProvider: user._newProvider,
          newProviderId: user._newProviderId,
          existingUserId: user.id,
        };
        req.session.save((saveErr) => {
          if (saveErr) {
            logger.error("Session save error:", saveErr);
            return next(saveErr);
          }
          return res.redirect(
            `${REDIRECT_URL}/link-provider?email=${encodeURIComponent(user.email)}&provider=${user._newProvider}&providerId=${user._newProviderId}`,
          );
        });
      } else {
        // New user or existing provider - log them in
        req.logIn(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          
          req.session.save((saveErr) => {
            if (saveErr) {
              logger.error("Session save error:", saveErr);
              return next(saveErr);
            }
            
            res.redirect(CHAT_REDIRECT_URL);
          });
        });
      }
    })(req, res, next);
  },
);

// --- Linking Management ---
authRouter.get("/link-provider/info", async (req, res) => {
  const { email, provider, providerId } = req.query;

  if (!email || !provider || !providerId) {
    return res.status(400).json({ error: "Missing required query parameters: email, provider, providerId" });
  }

  res.json({
    email,
    provider,
    providerId,
    message: `Link your ${provider} account to ${email}?`,
  });
});

authRouter.post("/link-provider/decline", async (req, res) => {
  // Clear pending link from session
  (req.session as any).pendingLink = null;
  req.session.save((err) => {
    if (err) {
      logger.error("Session save error:", err);
      return res.status(500).json({ error: "Failed to clear session" });
    }
    res.json({ success: true, message: "Link declined", redirectUrl: `${REDIRECT_URL}/login` });
  });
});

authRouter.post("/link-provider", async (req, res) => {
  const { email, provider, providerUserId } = req.body;
  const pendingLink = (req.session as any)?.pendingLink;

  if (!pendingLink) {
    return res.status(400).json({ error: "No pending link found. Please try logging in again." });
  }

  if (!email || !provider || !providerUserId) {
    return res.status(400).json({ error: "Missing required fields: email, provider, providerUserId" });
  }

  if (pendingLink.email !== email) {
    return res.status(403).json({ error: "Email mismatch" });
  }

  try {
    const userId = pendingLink.existingUserId;

    // Link the provider
    await db.insert(authProviders).values({
      userId,
      provider: provider as any,
      providerUserId,
    });

    // Now log the user in
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.logIn(user, (err) => {
      if (err) {
        logger.error("Login error after linking:", err);
        return res.status(500).json({ error: "Failed to log in" });
      }

      // Clear pending link
      (req.session as any).pendingLink = null;
      req.session.save((saveErr) => {
        if (saveErr) {
          logger.error("Session save error:", saveErr);
          return res.status(500).json({ error: "Session save failed" });
        }

        res.json({ success: true, message: "Provider linked and logged in successfully" });
      });
    });
  } catch (error) {
    logger.error("Error linking provider:", error);
    res.status(500).json({ error: "Failed to link provider" });
  }
});

// --- Session Management ---
authRouter.get("/me", (req, res) => {
  res.json({
    user: req.user || null,
    authenticated: req.isAuthenticated(),
  });
});

authRouter.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
});

export default authRouter;
