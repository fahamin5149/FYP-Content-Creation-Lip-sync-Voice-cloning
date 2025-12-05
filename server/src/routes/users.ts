// server/src/routes/users.ts
import { Router } from "express"
import type { Request, Response } from "express"
import { requireAuth } from "../middleware/auth.js"
import { createSupabaseAdminClient } from "../db/supabase.js"
import type { Database } from "../types/database.types.js"

const router = Router()

/**
 * POST /api/users/sync
 * Syncs a user from Clerk to Supabase
 *
 * Body:
 * {
 *   email: string
 *   firstName?: string
 *   lastName?: string
 * }
 *
 * Returns: { success: true, data: user object }
 */
router.post("/sync", requireAuth, async (req: Request, res: Response) => {
  try {
    // Auth middleware ensures req.auth.userId exists
    const clerkId = req.auth?.userId

    if (!clerkId) {
      return res.status(401).json({ error: "User not authenticated" })
    }

    const { email, firstName, lastName } = req.body

    if (!email) {
      return res.status(400).json({ error: "Email is required" })
    }

    // Initialize Supabase Admin Client
    const supabase = createSupabaseAdminClient()

    // Upsert user into Supabase
    // This will insert if clerk_id doesn't exist, update if it does
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          clerk_id: clerkId,
          email: email,
          first_name: firstName || null,
          last_name: lastName || null,
        } as any,
        {
          onConflict: "clerk_id", // Use clerk_id as the unique identifier for upsert
        }
      )
      .select()
      .single()

    if (error) {
      console.error("Supabase upsert error:", error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({
      success: true,
      data: data,
    })
  } catch (error: any) {
    console.error("User sync error:", error)
    return res.status(500).json({ error: error.message || "Internal server error" })
  }
})

export default router
