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
    passport.authenticate("google", { failureRedirect: `${REDIRECT_URL}/login` }, (err: any, user: any, info: any) => {
      if (err) return next(err);
      
      if (info?.pendingLink) {
        (req.session as any).pendingLink = {
          email: user.email,
          provider: user.provider,
          providerId: user.providerId,
        };
        req.session.save(() => {
          logger.auth("Pending link stored in session");
          res.redirect(
            `${REDIRECT_URL}/link-provider?email=${encodeURIComponent(user.email)}&provider=${user.provider}&newProviderName=Google`,
          );
        });
      } else {
        req.logIn(user, (err) => {
          if (err) return next(err);
          logger.auth("Google auth success:", {
            user: (req.user as any)?.email,
            userId: (req.user as any)?.id,
            sessionID: req.sessionID,
            isAuthenticated: req.isAuthenticated(),
          });
          res.redirect(CHAT_REDIRECT_URL);
        });
      }
    })(req, res, next);
  },
);

authRouter.get(
  "/github/callback",
  (req, res, next) => {
    passport.authenticate("github", { failureRedirect: `${REDIRECT_URL}/login` }, (err: any, user: any, info: any) => {
      if (err) return next(err);
      
      if (info?.pendingLink) {
        (req.session as any).pendingLink = {
          email: user.email,
          provider: user.provider,
          providerId: user.providerId,
        };
        req.session.save(() => {
          logger.auth("Pending link stored in session");
          res.redirect(
            `${REDIRECT_URL}/link-provider?email=${encodeURIComponent(user.email)}&provider=${user.provider}&newProviderName=GitHub`,
          );
        });
      } else {
        req.logIn(user, (err) => {
          if (err) return next(err);
          logger.auth("GitHub auth success:", {
            user: (req.user as any)?.email,
            userId: (req.user as any)?.id,
            sessionID: req.sessionID,
            isAuthenticated: req.isAuthenticated(),
          });
          res.redirect(CHAT_REDIRECT_URL);
        });
      }
    })(req, res, next);
  },
);

// --- Linking Management ---
authRouter.post("/link-provider", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { email, provider, providerUserId } = req.body;
  const userId = (req.user as any)?.id;

  if (!email || !provider || !providerUserId || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Verify the email matches the current user's email
    const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!currentUser || currentUser.email !== email) {
      return res.status(403).json({ error: "Email mismatch" });
    }

    // Check if provider is already linked
    const [existing] = await db
      .select()
      .from(authProviders)
      .where(
        and(
          eq(authProviders.userId, userId),
          eq(authProviders.provider, provider as any),
        ),
      );

    if (existing) {
      return res.status(400).json({ error: "Provider already linked" });
    }

    // Link the provider
    await db.insert(authProviders).values({
      userId,
      provider: provider as any,
      providerUserId,
    });

    logger.success("Provider linked:", { userId, email, provider });
    res.json({ success: true, message: "Provider linked successfully" });
  } catch (error) {
    logger.error("Error linking provider:", error);
    res.status(500).json({ error: "Failed to link provider" });
  }
});

// --- Session Management ---
authRouter.get("/me", (req, res) => {
  logger.auth("/me endpoint:", {
    sessionID: req.sessionID,
    hasSession: !!req.session,
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    sessionData: req.session,
  });

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
