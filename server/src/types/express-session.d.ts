// server/src/types/express-session.d.ts
import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        full_name: string;
        is_email_verified: boolean;
        created_at: string;
      };
    }
  }
}

export {};