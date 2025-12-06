// server/src/routes/content.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { 
  generateScript, 
  refineScript, 
  refineWithFeedback, 
  getScriptById, 
  saveDraft,
  getUserDrafts 
} from '../controllers/contentController.js';

const router = Router();

// Apply Clerk authentication middleware to all routes
router.use(requireAuth);

// Script generation routes
router.post('/generate-script', generateScript);
router.post('/refine-script', refineScript);
router.post('/refine-with-feedback', refineWithFeedback);
router.get('/script/:scriptId', getScriptById);
router.post('/save-draft', saveDraft);
router.get('/drafts', getUserDrafts);

export default router;
