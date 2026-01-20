import passport from "passport";
import googlePkg from "passport-google-oauth20"; // CommonJS default import
import type { Profile } from "passport-google-oauth20"; // Type only
import { env } from "../env.js";
import { findOrCreateUser } from "./userHelper.js"; // your reusable function

const GoogleStrategy = googlePkg.Strategy;

const callbackURL = `${env.BACKEND_URL}/api/auth/google/callback`;
console.log("🔵 Google OAuth configured with callback URL:", callbackURL);

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
        const image = profile.photos?.[0]?.value??"";
        const name = profile.displayName ?? "User";

        const user = await findOrCreateUser({
          email,
          name,
          image,
          provider: "google",
          providerId: profile.id,
        });

        done(null, user);
      } catch (err) {
        done(err);
      }
    },
  ),
);

export default googleAuth;
