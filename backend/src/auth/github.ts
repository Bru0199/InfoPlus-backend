import passport from "passport";
import githubPkg from "passport-github2";
import type { Profile } from "passport-github2";
import { env } from "../env.js";
import { findOrCreateUser, PendingLinkError } from "./userHelper.js";
import { logger } from "../utils/logger.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const GitHubStrategy = githubPkg.Strategy;

const callbackURL = `${env.BACKEND_URL}/api/auth/github/callback`;
logger.auth("GitHub OAuth configured with callback URL:", callbackURL);

const githubAuth = passport.use(
  new GitHubStrategy(
    {
      clientID: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: callbackURL,
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
        const result = await findOrCreateUser({
          email,
          name: name,
          image: image,
          provider: "github",
          providerId: profile.id,
        });

        done(null, result.user as any);
      } catch (err) {
        if (err instanceof PendingLinkError) {
          // Find existing user by email and return with pending link flag
          const [existingUser] = await db.select().from(users).where(eq(users.email, err.email));
          if (existingUser) {
            done(null, {
              ...existingUser,
              _pendingLink: true,
              _newProvider: "github",
              _newProviderId: err.providerId,
            } as any);
          } else {
            done(new Error("User not found for pending link"), undefined);
          }
        } else {
          done(err, undefined);
        }
      }
    },
  ),
);

export default githubAuth;
