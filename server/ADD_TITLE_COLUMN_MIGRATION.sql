-- Migration: Add title column to scripts table
-- Run this SQL in your Supabase SQL Editor to add the title field

-- Add title column to existing scripts table
ALTER TABLE public.scripts
ADD COLUMN IF NOT EXISTS title TEXT;

-- Update existing records to have a default title based on content
-- This extracts the first 50 characters from content as a fallback
UPDATE public.scripts
SET title = CASE 
  WHEN LENGTH(content) > 50 THEN SUBSTRING(content FROM 1 FOR 50) || '...'
  ELSE content
END
WHERE title IS NULL;

-- Make title NOT NULL after setting defaults
ALTER TABLE public.scripts
ALTER COLUMN title SET NOT NULL;

-- Add comment to column for documentation
COMMENT ON COLUMN public.scripts.title IS 'User-provided title for the content, used for identification in dashboard';
