// ARCHITECTURE NOTE: Files are stored on local disk at process.cwd()/uploads/.
// This is intentional for single-server / local development.
// For containerised or multi-instance production, replace multer diskStorage
// and the streaming endpoint with Supabase Storage or S3.

import type { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { getSupabaseClient } from '../db/supabase.js'

// ── MIME allowlists ──────────────────────────────────────────────────────────
const ALLOWED_AUDIO = [
  'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav',
  'audio/ogg', 'audio/x-m4a', 'audio/aac', 'audio/flac',
]
const ALLOWED_VIDEO = [
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi',
]

// ── Multer factory ───────────────────────────────────────────────────────────
// Two separate instances are exported (audioUpload, videoUpload).
// The factory bakes in the type so the destination path and allowlist are
// determined at route-registration time, not at request time.
const createUpload = (type: 'audio' | 'video') =>
  multer({
    storage: multer.diskStorage({
      destination: (req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        const dir = path.join(process.cwd(), 'uploads', type, req.auth!.userId)
        fs.mkdirSync(dir, { recursive: true })
        cb(null, dir)
      },
      filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const ext =
          path.extname(file.originalname) ||
          (type === 'video' ? '.mp4' : '.webm')
        cb(null, `${uuidv4()}${ext}`)
      },
    }),
    limits: {
      fileSize:
        type === 'audio'
          ? parseInt(process.env.MAX_AUDIO_SIZE_MB ?? '50') * 1024 * 1024
          : parseInt(process.env.MAX_VIDEO_SIZE_MB ?? '2048') * 1024 * 1024,
    },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowed = type === 'audio' ? ALLOWED_AUDIO : ALLOWED_VIDEO
      if (allowed.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error('INVALID_MIME_TYPE'))
      }
    },
  })

export const audioUpload = createUpload('audio')
export const videoUpload = createUpload('video')

// ── Upload Audio ─────────────────────────────────────────────────────────────
export const uploadAudio = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  const { language } = req.body
  if (!language || !['english', 'urdu'].includes(language)) {
    await fs.promises.unlink(req.file.path).catch(() => {})
    res.status(400).json({ error: 'language must be "english" or "urdu"' })
    return
  }

  // Store as relative path from process.cwd() for consistent reconstruction
  const filePath = `uploads/audio/${req.auth!.userId}/${req.file.filename}`
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('user_media')
      .insert({
        clerk_id: req.auth!.userId,
        media_type: 'audio',
        language,
        filename: req.file.originalname,
        file_path: filePath,
        mime_type: req.file.mimetype,
        size_bytes: req.file.size,
      } as any)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (err: any) {
    // Rollback: remove orphaned file from disk if DB insert fails
    await fs.promises.unlink(req.file.path).catch(() => {})
    res.status(500).json({ error: err.message || 'Failed to save media record' })
  }
}

// ── Upload Video ─────────────────────────────────────────────────────────────
export const uploadVideo = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  const filePath = `uploads/video/${req.auth!.userId}/${req.file.filename}`
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('user_media')
      .insert({
        clerk_id: req.auth!.userId,
        media_type: 'video',
        language: null,
        filename: req.file.originalname,
        file_path: filePath,
        mime_type: req.file.mimetype,
        size_bytes: req.file.size,
      } as any)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (err: any) {
    await fs.promises.unlink(req.file.path).catch(() => {})
    res.status(500).json({ error: err.message || 'Failed to save media record' })
  }
}

// ── Get Audio (list) ─────────────────────────────────────────────────────────
export const getAudio = async (req: Request, res: Response): Promise<void> => {
  const { language } = req.query
  const supabase = getSupabaseClient()

  let query = supabase
    .from('user_media')
    .select('*')
    .eq('clerk_id', req.auth!.userId)
    .eq('media_type', 'audio')
    .order('created_at', { ascending: false })

  if (language && ['english', 'urdu'].includes(language as string)) {
    query = query.eq('language', language as string) as any
  }

  const { data, error } = await query
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ success: true, data })
}

// ── Get Video (list) ─────────────────────────────────────────────────────────
export const getVideo = async (req: Request, res: Response): Promise<void> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('user_media')
    .select('*')
    .eq('clerk_id', req.auth!.userId)
    .eq('media_type', 'video')
    .order('created_at', { ascending: false })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ success: true, data })
}

// ── Stream File (authenticated — replaces express.static) ───────────────────
// HTML <audio>/<video> elements cannot send Authorization headers, so the
// frontend fetches this endpoint, converts the response to a Blob URL, and
// sets that as the src.  This ensures every file access is authenticated.
export const streamMediaFile = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id)
  const supabase = getSupabaseClient()

  const { data: row, error } = await supabase
    .from('user_media')
    .select('*')
    .eq('id', id)
    .eq('clerk_id', req.auth!.userId) // ownership enforced here
    .single()

  if (error || !row) {
    res.status(404).json({ error: 'Not found or access denied' })
    return
  }

  const absolutePath = path.join(process.cwd(), (row as any).file_path)

  if (!fs.existsSync(absolutePath)) {
    res.status(404).json({ error: 'File not found on disk' })
    return
  }

  const mimeType = (row as any).mime_type || 'application/octet-stream'
  res.setHeader('Content-Type', mimeType)
  res.setHeader('Accept-Ranges', 'bytes')
  fs.createReadStream(absolutePath).pipe(res)
}

// ── Resolve an uploaded media item's absolute disk path ────────────────
// Used by Next.js to pass real file paths into downstream AI microservices.
export const resolveMediaPath = async (req: Request, res: Response): Promise<void> => {
  const userId = req.auth!.userId
  const { mediaId, mediaType } = req.body as { mediaId?: string; mediaType?: 'audio' | 'video' }

  if (!mediaId || !mediaType || !['audio', 'video'].includes(mediaType)) {
    res.status(400).json({ error: 'mediaId and mediaType (audio|video) are required' })
    return
  }

  const supabase = getSupabaseClient()
  const { data: row, error } = await supabase
    .from('user_media')
    .select('file_path, mime_type')
    .eq('id', mediaId)
    .eq('clerk_id', userId)
    .eq('media_type', mediaType)
    .single()

  if (error || !row) {
    res.status(404).json({ error: 'Media not found or access denied' })
    return
  }

  const absolutePath = path.join(process.cwd(), (row as any).file_path as string)
  if (!fs.existsSync(absolutePath)) {
    res.status(404).json({ error: 'Media file not found on disk' })
    return
  }

  res.json({
    success: true,
    data: {
      absolutePath,
      mimeType: (row as any).mime_type || null,
    },
  })
}

// ── Delete Media ─────────────────────────────────────────────────────────────
export const deleteMedia = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id)
  const supabase = getSupabaseClient()

  // Ownership check — user can only delete their own records
  const { data: row, error: findError } = await supabase
    .from('user_media')
    .select('*')
    .eq('id', id)
    .eq('clerk_id', req.auth!.userId)
    .single()

  if (findError || !row) {
    res.status(404).json({ error: 'Not found or access denied' })
    return
  }

  // Delete from disk first (ENOENT is acceptable — file may have been manually removed)
  const absolutePath = path.join(process.cwd(), (row as any).file_path)
  try {
    await fs.promises.unlink(absolutePath)
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      res.status(500).json({ error: 'Failed to delete file from disk' })
      return
    }
    // File already gone — continue to remove DB row
  }

  const { error: deleteError } = await supabase
    .from('user_media')
    .delete()
    .eq('id', id)

  if (deleteError) {
    res.status(500).json({ error: deleteError.message })
    return
  }

  res.json({ success: true })
}
