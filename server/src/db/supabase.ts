// server/src/db/supabase.ts
import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/database.types.js"

let supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null

/**
 * Initialize Supabase Admin Client
 * Uses Service Role Key for unrestricted access (bypasses RLS)
 */
export function createSupabaseAdminClient() {
  if (supabaseAdmin) {
    return supabaseAdmin
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    )
  }

  supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseAdmin
}

/**
 * Get the initialized Supabase client
 */
export function getSupabaseClient() {
  if (!supabaseAdmin) {
    return createSupabaseAdminClient()
  }
  return supabaseAdmin
}
