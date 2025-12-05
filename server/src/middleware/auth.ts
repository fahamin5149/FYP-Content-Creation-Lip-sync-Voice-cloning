// server/src/middleware/auth.ts
import type { Request, Response, NextFunction } from "express"
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node"
import { clerkClient } from "@clerk/clerk-sdk-node"

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
    const session = await clerkClient.verifyToken(token)

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
