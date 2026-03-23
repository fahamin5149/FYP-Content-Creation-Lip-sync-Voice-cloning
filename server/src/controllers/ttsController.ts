// server/src/controllers/ttsController.ts
//
// Handles TTS job management: path resolution, job CRUD, and output streaming.
// Ownership is always enforced via req.auth!.userId (from the validated Clerk
// token) — never from a body-supplied value.

import type { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import { getSupabaseClient } from '../db/supabase.js'

// ── Resolve media paths ─────────────────────────────────────────────────────
// Given an array of user_media IDs, return absolute disk paths.
// Uses the same resolution pattern as streamMediaFile in mediaController.ts.

export const resolveMediaPaths = async (req: Request, res: Response): Promise<void> => {
  const { mediaIds } = req.body as { mediaIds: string[] }
  const userId = req.auth!.userId

  if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
    res.status(400).json({ error: 'mediaIds array is required and must not be empty' })
    return
  }

  const supabase = getSupabaseClient()

  const { data: rows, error } = await supabase
    .from('user_media')
    .select('id, file_path')
    .in('id', mediaIds)
    .eq('clerk_id', userId)        // ownership enforced from token
    .eq('media_type', 'audio')

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  if (!rows || rows.length !== mediaIds.length) {
    const foundIds = new Set((rows || []).map((r: any) => r.id))
    const missing = mediaIds.filter((id) => !foundIds.has(id))
    res.status(404).json({
      error: 'Some media IDs were not found or do not belong to this user',
      missingIds: missing,
    })
    return
  }

  // same resolution pattern as streamMediaFile in mediaController.ts
  const resolved = (rows as any[]).map((row) => ({
    id: row.id,
    file_path: row.file_path,
    absolutePath: path.join(process.cwd(), row.file_path),
  }))

  res.json({ success: true, data: resolved })
}

// ── Create TTS job (status: pending) ────────────────────────────────────────

export const createTTSJob = async (req: Request, res: Response): Promise<void> => {
  const userId = req.auth!.userId
  const { scriptId, inputMediaIds, language } = req.body as {
    scriptId: string
    inputMediaIds: string[]
    language?: string
  }

  if (!scriptId || !Array.isArray(inputMediaIds)) {
    res.status(400).json({ error: 'scriptId and inputMediaIds are required' })
    return
  }

  const supabase = getSupabaseClient()

  // Step 1: Get the script UUID by text script_id
  // The frontend passes the TEXT script_id, but tts_jobs.script_id is a UUID
  // that references scripts.id (the UUID primary key).
  const { data: scriptRow, error: scriptError } = await supabase
    .from('scripts')
    .select('id')
    .eq('script_id', scriptId)
    .eq('user_id', userId)
    .single() as any

  if (scriptError || !scriptRow) {
    res.status(404).json({ error: 'Script not found or does not belong to this user' })
    return
  }

  const scriptUUID = (scriptRow as any).id

  // Step 2: Create the TTS job with the script UUID
  const { data, error } = await supabase
    .from('tts_jobs')
    .insert({
      clerk_id: userId,
      script_id: scriptUUID,
      input_media_ids: inputMediaIds,
      status: 'pending',
      language: language || 'english',
    } as any)
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ success: true, data })
}

// ── Update TTS job (completed / failed) ─────────────────────────────────────

export const updateTTSJob = async (req: Request, res: Response): Promise<void> => {
  const userId = req.auth!.userId
  const jobId = String(req.params.jobId)
  const { status, outputAudioPath, durationSeconds, error: jobError } = req.body as {
    status: 'completed' | 'failed'
    outputAudioPath?: string
    durationSeconds?: number
    error?: string
  }

  if (!status || !['completed', 'failed'].includes(status)) {
    res.status(400).json({ error: 'status must be "completed" or "failed"' })
    return
  }

  const supabase = getSupabaseClient()

  // Ownership check — only the owner can update their own job
  const { data: existing, error: findErr } = await supabase
    .from('tts_jobs')
    .select('id')
    .eq('id', jobId as any)
    .eq('clerk_id', userId)
    .single()

  if (findErr || !existing) {
    res.status(404).json({ error: 'Job not found or access denied' })
    return
  }

  const updates: Record<string, any> = { status }
  if (outputAudioPath) updates.output_audio_path = outputAudioPath
  if (durationSeconds !== undefined) updates.duration_seconds = durationSeconds
  if (jobError) updates.error = jobError

  const { data, error: updateErr } = await (supabase
    .from('tts_jobs') as any)
    .update(updates)
    .eq('id', jobId)
    .select()
    .single()

  if (updateErr) {
    res.status(500).json({ error: updateErr.message })
    return
  }

  res.json({ success: true, data })
}

// ── Stream TTS output ───────────────────────────────────────────────────────
// Mirrors the pattern in mediaController.ts → streamMediaFile.

export const streamTTSOutput = async (req: Request, res: Response): Promise<void> => {
  const userId = req.auth!.userId
  const jobId = String(req.params.jobId)

  const supabase = getSupabaseClient()

  const { data: row, error } = await supabase
    .from('tts_jobs')
    .select('*')
    .eq('id', jobId as any)
    .eq('clerk_id', userId)   // ownership enforced
    .single()

  if (error || !row) {
    res.status(404).json({ error: 'Job not found or access denied' })
    return
  }

  const audioPath = (row as any).output_audio_path
  if (!audioPath) {
    res.status(404).json({ error: 'No output audio available for this job' })
    return
  }

  // fs.existsSync check — mirrors streamMediaFile in mediaController.ts
  if (!fs.existsSync(audioPath)) {
    res.status(404).json({ error: 'Output file not found on disk' })
    return
  }

  res.setHeader('Content-Type', 'audio/wav')
  res.setHeader('Accept-Ranges', 'bytes')
  fs.createReadStream(audioPath).pipe(res)
}

// ── Get latest completed TTS job for a script ────────────────────────────────
// Used on TTSStage mount to restore a previous generation without re-cloning.

export const getLatestTTSJobByScript = async (req: Request, res: Response): Promise<void> => {
  const userId = req.auth!.userId
  const scriptId = String(req.params['scriptId'] ?? '')

  const supabase = getSupabaseClient()

  // Resolve TEXT scriptId → UUID (same pattern as createTTSJob)
  const { data: scriptRow, error: scriptError } = await supabase
    .from('scripts')
    .select('id')
    .eq('script_id', scriptId)
    .eq('user_id', userId)
    .single() as any

  if (scriptError || !scriptRow) {
    res.status(404).json({ exists: false })
    return
  }

  const scriptUUID = (scriptRow as any).id

  const { data: job, error } = await (supabase
    .from('tts_jobs') as any)
    .select('*')
    .eq('clerk_id', userId)
    .eq('script_id', scriptUUID)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !job) {
    res.status(404).json({ exists: false })
    return
  }

  // Verify the audio file still exists on disk before reporting success
  const audioPath = (job as any).output_audio_path
  if (!audioPath || !fs.existsSync(audioPath)) {
    res.status(404).json({ exists: false })
    return
  }

  res.json({ exists: true, data: job })
}
