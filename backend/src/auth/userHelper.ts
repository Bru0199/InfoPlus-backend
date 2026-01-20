import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

interface UserProfile {
  email: string;
  name: string;
  image?: string;
  provider: "google" | "github";
  providerId: string;
}

export async function findOrCreateUser(profile: UserProfile) {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.provider, profile.provider),
        eq(users.providerId, profile.providerId),
      ),
    );

  if (existingUser) return existingUser;

  const [newUser] = await db
    .insert(users)
    .values({
      email: profile.email,
      name: profile.name,
      image: profile.image ?? null,
      provider: profile.provider,
      providerId: profile.providerId,
    })
    .returning();

  return newUser;
}
