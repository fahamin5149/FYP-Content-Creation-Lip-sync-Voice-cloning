# Supabase Setup Guide

## Step 1: Run this SQL in Supabase SQL Editor

Go to your Supabase project → SQL Editor → New Query and run:

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
-- This allows the backend to read/write/update/delete without RLS restrictions
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

## Step 2: Gather Your Environment Variables

You'll need these keys from Supabase:

1. Go to **Settings → API** in your Supabase project
2. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **Service Role Secret** (NOT the anon key) → `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Update Environment Variables

### Frontend (.env.local):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
CLERK_SECRET_KEY=your_secret_here
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env):
```
CLERK_SECRET_KEY=your_secret_here
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Verification

To verify the table was created:
1. Go to Supabase Dashboard
2. Click "Table editor"
3. You should see the `users` table listed
