import passport from "passport";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

// We import these files just to "register" the strategies
import "./google.js";
import "./github.js";

// 1. Serialize: Decide what data to save in the cookie (we save the user ID)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// 2. Deserialize: Use the ID from the cookie to find the full user in your DB
passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    done(null, user || null);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
