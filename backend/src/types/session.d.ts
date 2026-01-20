import "express-session";

declare module "express-session" {
  interface SessionData {
    passport: {
      user: string;
    };
  }
}

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      provider: "google" | "github";
      providerId: string;
      createdAt: Date;
    }
  }
}

export {};
