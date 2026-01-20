import passport from "passport";
import githubPkg from "passport-github2"; // CommonJS default import
import type { Profile } from "passport-github2"; // Type only
import { env } from "../env.js";
import { findOrCreateUser } from "./userHelper.js"; // same helper

const GitHubStrategy = githubPkg.Strategy;

const githubAuth = passport.use(
  new GitHubStrategy(
    {
      clientID: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback",
      scope: ["user:email"],
    },
    async (
      _accessToken: any,
      _refreshToken: any,
      profile: Profile,
      done: (
        arg0: unknown,
        arg1:
          | {
              id: string;
              name: string | null;
              email: string;
              image: string | null;
              provider: "google" | "github";
              providerId: string;
              createdAt: Date;
            }
          | undefined,
      ) => void,
    ) => {
      try {
        const email: string = profile.emails?.[0]?.value ?? "";
        const image = profile.photos?.[0]?.value ?? "";
        const name = profile.username ?? "User";

        const user = await findOrCreateUser({
          email,
          name: name,
          image: image, // <-- default to empty string
          provider: "github",
          providerId: profile.id,
        });

        done(null, user);
      } catch (err) {
        done(err, undefined);
      }
    },
  ),
);

export default githubAuth;
