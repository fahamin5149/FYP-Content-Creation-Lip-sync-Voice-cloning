# Clerk-Supabase Sync Implementation Guide

## Overview
This guide walks you through integrating Clerk authentication with Supabase database syncing on user registration.

---

## Part 1: Database Setup (Supabase)

### Step 1: Create the Users Table

Go to your Supabase project dashboard and navigate to **SQL Editor**. Create a new query and run:

```sql
-- Create the users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL UNIQUE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on clerk_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Service Role (backend) has full access
CREATE POLICY "Service role full access" ON public.users
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true)
  TO authenticated, service_role;

-- Optional: Policy for authenticated users to read their own data
CREATE POLICY "Users can read their own data" ON public.users
  AS PERMISSIVE
  FOR SELECT
  USING (auth.uid()::text = clerk_id);
```

After running, you should see the `users` table in the **Table editor**.

---

## Part 2: Environment Configuration

### Frontend (.env.local)
Add or update these variables:

```env
# Clerk keys (get from Clerk Dashboard → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_HERE

# Backend URL
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)
Create or update `.env` in the `/server` folder:

```env
# Clerk
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_HERE

# Supabase (get from Settings → API in your Supabase project)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server config
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**⚠️ IMPORTANT:** Use the **Service Role Key**, NOT the anon key. The Service Role bypasses RLS, allowing your backend to write to the database.

---

## Part 3: Frontend Implementation

### Updated `lib/api.ts`

The file has been updated with:

1. **`fetchWithAuth()`** - Attaches Clerk JWT to all requests
   - Handles both client-side and server-side calls
   - On client: Requires `getToken()` function from `useAuth()` hook
   - On server: Uses `auth()` from `@clerk/nextjs/server`

2. **`syncUserToBackend()`** - Calls the backend sync endpoint
   - Parameters: `email`, `firstName`, `lastName`, `getToken`
   - Returns: User data from Supabase

### Usage in Sign-Up Component

```typescript
'use client'
import { useAuth } from "@clerk/nextjs"
import { syncUserToBackend } from "@/lib/api"

export function SignUpForm() {
  const { getToken } = useAuth()

  const handleSignUpComplete = async (user: any) => {
    try {
      // After user signs up with Clerk, sync to backend/Supabase
      await syncUserToBackend(
        user.emailAddresses[0].emailAddress,
        user.firstName,
        user.lastName,
        getToken
      )
      console.log("User synced successfully!")
    } catch (error) {
      console.error("Failed to sync user:", error)
    }
  }

  return (
    // Your sign-up form JSX
    // Call handleSignUpComplete() after successful signup
  )
}
```

---

## Part 4: Backend Implementation

### Files Created/Updated

#### 1. `server/src/middleware/auth.ts`
- **Purpose:** Verify Clerk JWT tokens
- **Function:** `requireAuth()` middleware
- **Action:** Extracts token from `Authorization: Bearer <token>` header and verifies with Clerk
- **Attaches:** `req.auth.userId` (clerk_id) to request

#### 2. `server/src/db/supabase.ts`
- **Purpose:** Initialize Supabase admin client
- **Function:** `createSupabaseAdminClient()`
- **Benefit:** Uses Service Role Key to bypass RLS restrictions

#### 3. `server/src/routes/users.ts`
- **Purpose:** Handle user sync endpoint
- **Endpoint:** `POST /api/users/sync`
- **Middleware:** Protected with `requireAuth`
- **Logic:**
  1. Extract clerk_id from auth middleware
  2. Get email, firstName, lastName from request body
  3. Upsert user into Supabase using clerk_id as unique key
  4. Return synced user data

#### 4. `server/src/index.ts` (Updated)
- Added import for `usersRoutes`
- Registered `app.use("/api/users", usersRoutes)`

### How It Works

```
User Signs Up (Clerk)
        ↓
Frontend calls syncUserToBackend()
        ↓
fetchWithAuth() adds Clerk JWT
        ↓
POST /api/users/sync with email, firstName, lastName
        ↓
Backend requireAuth middleware verifies token
        ↓
Upsert user to Supabase users table
        ↓
Return success + user data
```

---

## Part 5: Setup Instructions

### 1. Install Backend Dependencies

```bash
cd server
npm install @supabase/supabase-js @clerk/clerk-sdk-node
```

### 2. Update TypeScript Types (if needed)

The middleware adds a global type for `Express.Request.auth`. Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "typeRoots": ["./node_modules/@types"]
  }
}
```

### 3. Restart Your Servers

```bash
# Terminal 1: Frontend
cd /
npm run dev

# Terminal 2: Backend
cd server
npm run dev
```

### 4. Test the Flow

1. **Sign up** a new user on your Next.js app
2. **Check Supabase Table Editor** - the user should appear in the `users` table
3. **Verify columns**: `clerk_id`, `email`, `first_name`, `last_name` should be populated

---

## Part 6: Environment Variables Reference

| Variable | Frontend | Backend | Source | Example |
|----------|----------|---------|--------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | ❌ | Clerk Dashboard → API Keys | `pk_test_...` |
| `CLERK_SECRET_KEY` | ❌ | ✅ | Clerk Dashboard → API Keys | `sk_test_...` |
| `SUPABASE_URL` | ❌ | ✅ | Supabase Settings → API | `https://project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | ✅ | Supabase Settings → API | `eyJhbGc...` |
| `NEXT_PUBLIC_API_URL` | ✅ | ❌ | Your backend URL | `http://localhost:5000` |
| `FRONTEND_URL` | ❌ | ✅ | Your frontend URL | `http://localhost:3000` |
| `PORT` | ❌ | ✅ | Server port | `5000` |

---

## Troubleshooting

### Issue: "Missing or invalid Authorization header"
**Solution:** Ensure `fetchWithAuth()` is being called with a valid `getToken` function on the client.

### Issue: "Invalid token"
**Solution:** Check that `CLERK_SECRET_KEY` in backend .env matches your Clerk project.

### Issue: User not appearing in Supabase
**Solutions:**
- Check SQL error in backend logs
- Verify `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Ensure `users` table was created correctly
- Check RLS policies allow service_role access

### Issue: CORS errors
**Solution:** Verify `FRONTEND_URL` in backend .env matches your frontend URL, and CORS is configured in `server/src/index.ts`:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}))
```

---

## Next Steps

1. ✅ Set up Supabase table
2. ✅ Configure environment variables
3. ✅ Test the sync flow
4. 🔄 Add additional sync logic (profile updates, etc.)
5. 🔄 Implement webhook for real-time Supabase updates
6. 🔄 Add Supabase-based user queries in frontend

---

## File Structure Summary

```
FYP-Content-Creation-Lip-sync-Voice-cloning/
├── lib/
│   └── api.ts                          (✨ UPDATED)
├── server/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts                 (✨ NEW)
│   │   ├── db/
│   │   │   └── supabase.ts             (✨ NEW)
│   │   ├── routes/
│   │   │   ├── auth.ts                 (existing)
│   │   │   └── users.ts                (✨ NEW)
│   │   └── index.ts                    (✨ UPDATED)
│   └── package.json                    (✨ UPDATED with dependencies)
├── .env.local                          (⚠️ TODO: Update with keys)
└── server/.env                         (⚠️ TODO: Create with keys)
```

---

**You're all set!** 🚀 The Clerk-Supabase sync is now configured and ready to use.
