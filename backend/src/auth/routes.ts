import { Router } from "express";
import passport from "passport";
import { env } from "../env.js";

const authRouter = Router();

const REDIRECT_URL = env.FRONTEND_URL || "http://localhost:3000";
authRouter.get("/google", (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect(`${REDIRECT_URL}/chat`);
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next,
  );
});

authRouter.get("/github", (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect(`${REDIRECT_URL}/chat`);
  }
  passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
});

// --- Callbacks ---
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    try {
      console.log("✅ Google callback success, user:", req.user);
      console.log("Session ID:", req.session?.id);
      console.log("REDIRECT_URL:", REDIRECT_URL);
      res.redirect(`${REDIRECT_URL}/chat`);
    } catch (err) {
      console.error("Google callback error:", err);
      res.status(500).json({ error: "Callback failed", details: String(err) });
    }
  },
);

authRouter.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    try {
      res.redirect(`${REDIRECT_URL}/chat`);
    } catch (err) {
      console.error("GitHub callback error:", err);
      res.status(500).json({ error: "Callback failed", details: String(err) });
    }
  },
);

// --- Session Management ---
authRouter.get("/me", (req, res) => {
  res.json({ user: req.user || null });
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
