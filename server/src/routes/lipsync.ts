import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listLipSyncOutputs,
  streamLipSyncOutput,
  streamLipSyncOutputExport,
  deleteLipSyncOutput,
} from '../controllers/lipsyncController.js'

const router = Router()

router.use(requireAuth)

router.get('/outputs', listLipSyncOutputs)
router.delete('/output/:jobId', deleteLipSyncOutput)
// Stream generated lip-sync MP4 (frontend builds a Blob URL).
router.get('/output/:jobId', streamLipSyncOutput)
// Export generated output as mp4/mov/webm. Non-mp4 formats are transcoded with ffmpeg.
router.get('/output/:jobId/export', streamLipSyncOutputExport)

export default router

