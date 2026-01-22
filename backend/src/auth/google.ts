import passport from "passport";
import googlePkg from "passport-google-oauth20";
import type { Profile } from "passport-google-oauth20";
import { env } from "../env.js";
import { findOrCreateUser, PendingLinkError } from "./userHelper.js";
import { logger } from "../utils/logger.js";

const GoogleStrategy = googlePkg.Strategy;

const callbackURL = `${env.BACKEND_URL}/api/auth/google/callback`;
logger.auth("Google OAuth configured with callback URL:", callbackURL);

const googleAuth = passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value ?? "";
        const image = profile.photos?.[0]?.value ?? "";
        const name = profile.displayName ?? "User";

        const result = await findOrCreateUser({
          email,
          name,
          image,
          provider: "google",
          providerId: profile.id,
        });

        done(null, result.user, { pendingLink: result.action === "pending_link" });
      } catch (err) {
        if (err instanceof PendingLinkError) {
          // Return user info for pending link, not an error
          return done(null, { email: err.email, provider: err.provider, providerId: err.providerId }, { pendingLink: true });
        }
        done(err);
      }
    },
  ),
);

export default googleAuth;
