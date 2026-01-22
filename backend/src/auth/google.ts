import passport from "passport";
import googlePkg from "passport-google-oauth20";
import type { Profile } from "passport-google-oauth20";
import { env } from "../env.js";
import { findOrCreateUser, PendingLinkError } from "./userHelper.js";
import { logger } from "../utils/logger.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

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

        done(null, result.user);
      } catch (err) {
        if (err instanceof PendingLinkError) {
          // Find existing user by email and return with pending link flag
          const [existingUser] = await db.select().from(users).where(eq(users.email, err.email));
          if (existingUser) {
            done(null, {
              ...existingUser,
              _pendingLink: true,
              _newProvider: "google",
              _newProviderId: err.providerId,
            } as any);
          } else {
            done(new Error("User not found for pending link"));
          }
        } else {
          done(err);
        }
      }
    },
  ),
);

export default googleAuth;
