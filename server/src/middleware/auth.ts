// server/src/middleware/auth.ts
import type { Request, Response, NextFunction } from "express"
import { ClerkExpressWithAuth, createClerkClient } from "@clerk/clerk-sdk-node"

// Lazy client: reads CLERK_SECRET_KEY at request time, after dotenv has loaded.
// (The default exported clerkClient is initialized at import time, before dotenv.config() runs.)
function getClerkClient() {
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })
}

/**
 * Middleware: Allow requests carrying the INTERNAL_API_SECRET header.
 * Used for server-to-server calls (e.g. Next.js → Node.js after long synthesis)
 * where the Clerk JWT may have expired. The caller must supply the userId in
 * the X-Internal-User-Id header so ownership checks still work.
 */
export function requireInternalOrAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const secret = req.headers['x-internal-secret'] as string | undefined
  const expectedSecret = process.env.INTERNAL_API_SECRET

  if (expectedSecret && secret === expectedSecret) {
    const userId = req.headers['x-internal-user-id'] as string | undefined
    if (!userId) {
      res.status(400).json({ error: 'X-Internal-User-Id header required with internal secret' })
      return
    }
    req.auth = { userId, getToken: async () => null }
    next()
    return
  }

  // Fall back to standard Clerk JWT auth
  requireAuth(req, res, next)
}

// Extend Express Request type to include auth data
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string
        getToken: () => Promise<string | null>
      }
    }
  }
}

/**
 * Middleware: Verify Clerk JWT token and attach userId to request
 * This middleware extracts the Bearer token from Authorization header
 * and verifies it using Clerk's SDK
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid Authorization header" })
      return
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix

    // Verify the token using Clerk
    const session = await getClerkClient().verifyToken(token)

    if (!session || !session.sub) {
      res.status(401).json({ error: "Invalid token" })
      return
    }

    // Attach userId (clerk_id) to request object
    req.auth = {
      userId: session.sub,
      getToken: async () => token,
    }

    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(401).json({ error: "Authentication failed" })
  }
}
