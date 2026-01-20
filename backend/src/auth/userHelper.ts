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
      console.log("✅ EXISTING USER - User found:", {
        id: existingUser.id,
        email: existingUser.email,
        provider: existingUser.provider,
      });
      return existingUser;
    }

    console.log("📝 NEW USER - Creating new user for email:", profile.email);
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
    console.log("✅ NEW USER - User created successfully:", {
      id: newUser.id,
      email: newUser.email,
      provider: newUser.provider,
    });
    return newUser;
  } catch (error) {
    console.error("❌ Error in findOrCreateUser:", error);
    throw error;
  }
}
