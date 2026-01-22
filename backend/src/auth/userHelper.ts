import { db } from "../db/index.js";
import { authProviders, users } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import { logger } from "../utils/logger.js";

interface UserProfile {
  email: string;
  name: string;
  image?: string;
  provider: "google" | "github";
  providerId: string;
}

export interface FindOrCreateUserResult {
  user: any;
  action: "login" | "new_user" | "pending_link";
}

export class PendingLinkError extends Error {
  constructor(
    public email: string,
    public provider: "google" | "github",
    public providerId: string,
    public newProviderName: string,
    public existingProviders: string[],
  ) {
    super("Email already registered with another provider");
    this.name = "PendingLinkError";
  }
}

export async function findOrCreateUser(profile: UserProfile): Promise<FindOrCreateUserResult> {
  try {
    logger.auth("Finding or creating user:", {
      provider: profile.provider,
      providerId: profile.providerId,
      email: profile.email,
    });

    // Check if this provider+providerId is already linked
    const [linkedUser] = await db
      .select({ user: users })
      .from(authProviders)
      .innerJoin(users, eq(authProviders.userId, users.id))
      .where(
        and(
          eq(authProviders.provider, profile.provider),
          eq(authProviders.providerUserId, profile.providerId),
        ),
      );

    if (linkedUser?.user) {
      logger.auth("EXISTING USER - Provider already linked:", {
        id: linkedUser.user.id,
        email: linkedUser.user.email,
        provider: profile.provider,
      });
      return { user: linkedUser.user, action: "login" };
    }

    // Check if a user exists with the same email
    const [emailUser] = await db.select().from(users).where(eq(users.email, profile.email));

    if (emailUser) {
      // Get existing providers for this email
      const existingProviders = await db
        .select({ provider: authProviders.provider })
        .from(authProviders)
        .where(eq(authProviders.userId, emailUser.id));

      const existingProviderNames = existingProviders.map((p) => p.provider);
      logger.warn("PENDING LINK - Email exists with different provider:", {
        email: profile.email,
        newProvider: profile.provider,
        existingProviders: existingProviderNames,
      });

      throw new PendingLinkError(
        profile.email,
        profile.provider,
        profile.providerId,
        profile.provider,
        existingProviderNames,
      );
    }

    // Otherwise, create the user and link the provider in one transaction
    const newUser = await db.transaction(async (tx) => {
      const [createdUser] = await tx
        .insert(users)
        .values({
          email: profile.email,
          name: profile.name,
          image: profile.image ?? null,
          provider: profile.provider,
          providerId: profile.providerId,
        })
        .returning();

      if (!createdUser) throw new Error("Failed to create user");

      await tx.insert(authProviders).values({
        userId: createdUser.id,
        provider: profile.provider,
        providerUserId: profile.providerId,
      });

      return createdUser;
    });

    logger.success("NEW USER - User created and provider linked:", {
      id: newUser.id,
      email: newUser.email,
      provider: profile.provider,
    });
    return { user: newUser, action: "new_user" };
  } catch (error) {
    logger.error("Error in findOrCreateUser:", error);
    throw error;
  }
}
