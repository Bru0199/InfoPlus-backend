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
  try {
    console.log("🔍 Finding or creating user:", {
      provider: profile.provider,
      providerId: profile.providerId,
      email: profile.email,
    });

    const [existingUser] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.provider, profile.provider),
          eq(users.providerId, profile.providerId),
        ),
      );

    if (existingUser) {
      console.log("✅ User found:", existingUser.id);
      return existingUser;
    }

    console.log("📝 Creating new user for email:", profile.email);
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

    if (!newUser) throw new Error("Failed to create user");
    console.log("✅ User created:", newUser.id);
    return newUser;
  } catch (error) {
    console.error("❌ Error in findOrCreateUser:", error);
    throw error;
  }
}
