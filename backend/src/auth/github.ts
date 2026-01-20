import passport from "passport";
import githubPkg from "passport-github2"; // CommonJS default import
import type { Profile } from "passport-github2"; // Type only
import { env } from "../env.ts";
import { findOrCreateUser } from "./userHelper.ts"; // same helper

const GitHubStrategy = githubPkg.Strategy;

const githubAuth = passport.use(
  new GitHubStrategy(
    {
      clientID: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback",
      scope: ["user:email"],
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value ?? null;
        const image = profile.photos?.[0]?.value;
        const name = profile.username ?? "User";

        const user = await findOrCreateUser({
          email,
          name,
          image,
          provider: "github",
          providerId: profile.id,
        });

        done(null, user);
      } catch (err) {
        done(err);
      }
    },
  ),
);

export default githubAuth;
