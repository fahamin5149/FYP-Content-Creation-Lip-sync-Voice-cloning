-- ============================================================
-- TTS Jobs Table
-- Tracks every voice-cloning synthesis request.
-- ============================================================
-- Run this in the Supabase SQL Editor, then confirm the table
-- appears in the Table Editor before writing controller code.
-- ============================================================

CREATE TABLE IF NOT EXISTS tts_jobs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id        text        NOT NULL,
  script_id       uuid        REFERENCES scripts(id) ON DELETE SET NULL,

  -- input_media_ids: denormalized array; no FK enforced —
  -- user_media rows may be deleted independently.
  -- Treat as informational only (for display / audit).
  input_media_ids uuid[]      NOT NULL DEFAULT '{}',

  output_audio_path text,                       -- absolute disk path
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'completed', 'failed')),
  error           text,
  duration_seconds double precision,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- All access is via the Node.js service-role key (bypasses RLS).
-- RLS is enabled to prevent accidental direct client-side queries.
ALTER TABLE tts_jobs ENABLE ROW LEVEL SECURITY;
