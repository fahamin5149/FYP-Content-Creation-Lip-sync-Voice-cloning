// server/src/routes/media.ts
import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  audioUpload,
  videoUpload,
  uploadAudio,
  uploadVideo,
  getAudio,
  getVideo,
  streamMediaFile,
  deleteMedia,
} from '../controllers/mediaController.js'

const router = Router()

// All routes protected — same pattern as content.ts
router.use(requireAuth)

// Multer error interceptor: wraps multer middleware so 413 / 415 errors
// are returned as JSON rather than crashing the request chain.
const withMulter =
  (multerMiddleware: ReturnType<typeof audioUpload.single>) =>
  (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, (err: any) => {
      if (!err) return next()
      if (err?.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'File exceeds the maximum allowed size' })
        return
      }
      if (err?.message === 'INVALID_MIME_TYPE') {
        res.status(415).json({ error: 'File type not supported' })
        return
      }
      next(err)
    })
  }

// NOTE: multer handles the multipart body for these routes.
// The express.json() body parser in index.ts does NOT apply here.
router.post('/audio', withMulter(audioUpload.single('file')), uploadAudio)
router.post('/video', withMulter(videoUpload.single('file')), uploadVideo)
router.get('/audio', getAudio)
router.get('/video', getVideo)
router.get('/file/:id', streamMediaFile) // authenticated streaming — no express.static
router.delete('/:id', deleteMedia)

export default router
