import { Router } from "express";
import passport from "passport";
import { env } from "../env.js";

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
  passport.authenticate("google", {
    failureRedirect: `${REDIRECT_URL}/login`,
    keepSessionInfo: true, // Preserve session data
  }),
  (req, res) => {
    try {
      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error("❌ Session regeneration error:", err);
          return res.redirect(`${REDIRECT_URL}/login?error=session`);
        }

        // Save user to session
        if (!req.user) {
          console.error("❌ No user in request");
          return res.redirect(`${REDIRECT_URL}/login?error=no_user`);
        }

        (req.session as any).passport = { user: (req.user as any).id };

        req.session.save((err) => {
          if (err) {
            console.error("❌ Session save error:", err);
            return res.redirect(`${REDIRECT_URL}/login?error=session`);
          }

          console.log("✅ Google auth success:", {
            user: (req.user as any)?.email,
            userId: (req.user as any)?.id,
            sessionID: req.sessionID,
            cookie: req.session.cookie,
          });

          res.redirect(CHAT_REDIRECT_URL);
        });
      });
    } catch (error) {
      console.error("❌ Google callback error:", error);
      res.redirect(`${REDIRECT_URL}/login?error=callback`);
    }
  },
);

authRouter.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${REDIRECT_URL}/login`,
    keepSessionInfo: true,
  }),
  (req, res) => {
    try {
      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error("❌ Session regeneration error:", err);
          return res.redirect(`${REDIRECT_URL}/login?error=session`);
        }

        // Save user to session
        if (!req.user) {
          console.error("❌ No user in request");
          return res.redirect(`${REDIRECT_URL}/login?error=no_user`);
        }

        (req.session as any).passport = { user: (req.user as any).id };

        req.session.save((err) => {
          if (err) {
            console.error("❌ Session save error:", err);
            return res.redirect(`${REDIRECT_URL}/login?error=session`);
          }

          console.log("✅ GitHub auth success:", {
            user: (req.user as any)?.email,
            userId: (req.user as any)?.id,
            sessionID: req.sessionID,
            cookie: req.session.cookie,
          });

          res.redirect(CHAT_REDIRECT_URL);
        });
      });
    } catch (error) {
      console.error("❌ GitHub callback error:", error);
      res.redirect(`${REDIRECT_URL}/login?error=callback`);
    }
  },
);

// --- Session Management ---
authRouter.get("/me", (req, res) => {
  console.log("🔍 /me endpoint:", {
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
