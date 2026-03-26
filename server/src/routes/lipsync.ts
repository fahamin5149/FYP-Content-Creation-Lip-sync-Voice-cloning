import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { listLipSyncOutputs, streamLipSyncOutput } from '../controllers/lipsyncController.js'

const router = Router()

router.use(requireAuth)

router.get('/outputs', listLipSyncOutputs)
// Stream generated lip-sync MP4 (frontend builds a Blob URL).
router.get('/output/:jobId', streamLipSyncOutput)

export default router

