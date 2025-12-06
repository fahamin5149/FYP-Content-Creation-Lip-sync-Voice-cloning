-- Create the scripts table in Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create the scripts table
CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL, -- This references clerk_id from users table
  title TEXT NOT NULL, -- User-provided title for content identification
  language TEXT NOT NULL,
  method TEXT NOT NULL, -- 'refinement' or 'generated'
  content TEXT NOT NULL,
  parameters JSONB,
  versions JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft', -- 'draft', 'approved', 'in_progress'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON public.scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_script_id ON public.scripts(script_id);
CREATE INDEX IF NOT EXISTS idx_scripts_status ON public.scripts(status);

-- Enable Row Level Security
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- Policy: Service Role has full access
CREATE POLICY "Service role full access on scripts" ON public.scripts
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true)
  TO authenticated, service_role;

-- Policy: Users can only access their own scripts
CREATE POLICY "Users can access their own scripts" ON public.scripts
  AS PERMISSIVE
  FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Add foreign key constraint to users table (optional but recommended)
ALTER TABLE public.scripts
ADD CONSTRAINT fk_scripts_user_id
FOREIGN KEY (user_id) REFERENCES public.users(clerk_id)
ON DELETE CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON public.scripts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
