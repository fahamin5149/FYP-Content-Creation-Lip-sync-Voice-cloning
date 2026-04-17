// server/src/routes/tts.ts
import { Router } from 'express'
import { requireAuth, requireInternalOrAuth } from '../middleware/auth.js'
import {
  resolveMediaPaths,
  createTTSJob,
  updateTTSJob,
  streamTTSOutput,
  getTTSOutputPath,
  getLatestTTSJobByScript,
} from '../controllers/ttsController.js'

const router = Router()

// Resolve user_media IDs → absolute disk paths (server-to-server from Next.js)
router.post('/resolve-paths', requireAuth, resolveMediaPaths)

// TTS job CRUD
// PATCH accepts internal secret (Clerk JWT may have expired after long synthesis)
router.post('/jobs', requireAuth, createTTSJob)
router.patch('/jobs/:jobId', requireInternalOrAuth, updateTTSJob)
router.get('/jobs/by-script/:scriptId', requireAuth, getLatestTTSJobByScript)

// Stream the generated WAV to the browser (frontend creates Blob URL)
router.get('/output/:jobId', requireAuth, streamTTSOutput)

// Return the absolute output audio disk path for downstream services (e.g., Wav2Lip)
router.get('/output-path/:jobId', requireAuth, getTTSOutputPath)

export default router
