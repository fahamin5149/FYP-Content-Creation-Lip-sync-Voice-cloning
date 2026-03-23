# Environment Variables Setup

## Step 1: Get Your Keys

### From Clerk Dashboard (clerk.com)
1. Go to your project
2. Click **Settings → API Keys**
3. Copy:
   - **Publishable Key** → `pk_test_...`
   - **Secret Key** → `sk_test_...`

### From Supabase Dashboard (supabase.com)
1. Go to your project
2. Click **Settings → API**
3. Copy:
   - **Project URL** → `https://your-project.supabase.co`
   - **Service Role Secret** (NOT anon key) → Long JWT string starting with `eyJhbGc...`

---

## Step 2: Create `.env.local` (Frontend)

In your project root (`e:\FYP-Content-Creation-Lip-sync-Voice-cloning\.env.local`):

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Python TTS Services
PYTHON_TTS_URL=http://localhost:8000     # English xtts_v2 service
URDU_TTS_URL=http://localhost:8001       # Urdu Parler-TTS + OpenVoice V2 service
```

---

## Step 3: Create `.env` (Backend)

In the server folder (`e:\FYP-Content-Creation-Lip-sync-Voice-cloning\server\.env`):

```env
# Clerk (same as frontend)
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Supabase Admin Keys
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2plY3QtaWQiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.YOUR_FULL_SERVICE_ROLE_KEY

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

## Step 4: Database Setup

Run this SQL in **Supabase → SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL UNIQUE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.users
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true)
  TO authenticated, service_role;
```

---

## Step 5: Verify Installation

Run these commands:

```bash
# Frontend
cd e:\FYP-Content-Creation-Lip-sync-Voice-cloning
npm run dev

# Backend (new terminal)
cd e:\FYP-Content-Creation-Lip-sync-Voice-cloning\server
npm run dev
```

Both should start without errors.

---

## Checklist

- [ ] Created `.env.local` with Clerk keys
- [ ] Created `server/.env` with Supabase keys
- [ ] Ran SQL to create users table
- [ ] Frontend server running on port 3000
- [ ] Backend server running on port 5000
- [ ] Can sign up a new user
- [ ] User appears in Supabase table

---

**Need Help?** Check `CLERK_SUPABASE_SYNC_GUIDE.md` for detailed troubleshooting.
