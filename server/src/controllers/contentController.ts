// server/src/controllers/contentController.ts
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { callOpenRouter } from '../config/openrouter.js';
import { getSupabaseClient } from '../db/supabase.js';
import { getSimpleRefinementPrompt, getCustomRefinementPrompt } from '../prompts/scriptRefinement.js';
import { getScriptGenerationPrompt } from '../prompts/scriptGeneration.js';
import { getFeedbackRefinementPrompt } from '../prompts/feedbackRefinement.js';
import type { Script, ScriptParameters, ScriptMetadata } from '../types/database.types.js';
import { takeFirstNSentences } from '../utils/sentences.js';

type ManualSafetyResult = {
  status: 'ok' | 'warning' | 'refused';
  code: 'CONTENT_SAFE' | 'CONTENT_REWRITTEN_FOR_SAFETY' | 'UNSAFE_CONTENT_REFUSED';
  message?: string;
  safeContent?: string;
  details?: {
    reason?: string;
  };
  action?: {
    allow_continue: boolean;
    suggestion?: string;
  };
};

/**
 * Helper function to calculate word count and duration
 */
const calculateMetadata = (content: string, pacing: string) => {
  const wordCount = content.trim().split(/\s+/).length;
  const wordsPerMinute = pacing === 'slow' ? 120 : pacing === 'fast' ? 160 : 140;
  const estimatedDuration = wordCount / wordsPerMinute;
  return { wordCount, estimatedDuration };
};

const manualUploadSafetyPrompt = (language: string) => `You are a strict safety validator for user-submitted scripts.

Enforce these guardrails:
- Do NOT allow harassment, hate speech, abusive, toxic, insulting, or demeaning content.
- Do NOT allow illegal or harmful instructions.
- Keep outputs safe, respectful, and appropriate for a general audience.

If unsafe content appears:
- Rewrite into a safe, neutral, professional form preserving intent where possible.
- If safe rewriting is not feasible, refuse politely.

Return ONLY valid JSON matching this exact schema:
{
  "status": "ok" | "warning" | "refused",
  "code": "CONTENT_SAFE" | "CONTENT_REWRITTEN_FOR_SAFETY" | "UNSAFE_CONTENT_REFUSED",
  "message": "string",
  "safeContent": "string or empty",
  "details": { "reason": "string" },
  "action": { "allow_continue": true | false, "suggestion": "string" }
}

Language requirement:
- Keep the output script language aligned with the input language (${language}).
`;

async function validateManualScriptSafety(content: string, language: string): Promise<ManualSafetyResult> {
  const messages = [
    {
      role: 'user' as const,
      content: `${manualUploadSafetyPrompt(language)}\n\nInput script:\n${content}`,
    },
  ];

  const raw = await callOpenRouter(messages, 1200, 0.1);
  let parsed: ManualSafetyResult | null = null;
  try {
    parsed = JSON.parse(raw) as ManualSafetyResult;
  } catch {
    // fallback below
  }

  if (!parsed || !parsed.status || !parsed.code) {
    return {
      status: 'ok',
      code: 'CONTENT_SAFE',
      message: 'Safety validator fallback applied.',
      action: { allow_continue: true, suggestion: 'Continue normally.' },
      safeContent: content,
    };
  }

  if (parsed.status === 'warning') {
    return {
      ...parsed,
      action: { allow_continue: true, suggestion: parsed.action?.suggestion || 'Proceed with the safe rewrite.' },
      safeContent: parsed.safeContent?.trim() ? parsed.safeContent : content,
    };
  }

  if (parsed.status === 'refused') {
    return {
      ...parsed,
      action: { allow_continue: false, suggestion: parsed.action?.suggestion || 'Please provide safer wording.' },
      safeContent: '',
    };
  }

  return {
    ...parsed,
    action: { allow_continue: true, suggestion: parsed.action?.suggestion || 'Continue normally.' },
    safeContent: content,
  };
}

function denyUnsafeRequest(res: Response, reason: string) {
  res.status(400).json({
    status: 'error',
    code: 'UNSAFE_CONTENT_DENIED',
    message:
      'Your request contains content that is not appropriate for this platform. Please rewrite it in a safe and respectful way and try again.',
    details: { reason },
    action: {
      allow_continue: false,
      suggestion: 'Please edit your script/request to remove harmful or abusive content.',
    },
  });
}

/**
 * Generate Script
 * POST /api/content/generate-script
 */
export const generateScript = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId; // From Clerk middleware
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      title, language, topic, styleTone, targetAudience, keyPoints,
      duration, generateExactlyOneSentence, generateExactlyThreeSentences,
    } = req.body;

    // Validation
    if (!title || !language || !topic || !targetAudience || !duration) {
      res.status(400).json({ error: 'Missing required fields: title, language, topic, targetAudience, duration' });
      return;
    }
    
    const pacing = 'Medium';
    const shortOneSentence = Boolean(
      generateExactlyOneSentence ?? generateExactlyThreeSentences,
    );
    const generateSafetyInput = [topic, styleTone, keyPoints].filter(Boolean).join('\n');
    const generateSafety = await validateManualScriptSafety(generateSafetyInput, language);
    if (generateSafety.status !== 'ok') {
      denyUnsafeRequest(res, generateSafety.details?.reason || 'Unsafe request content');
      return;
    }
    const parameters: ScriptParameters = {
      title, language, topic, styleTone, targetAudience, keyPoints,
      duration,
      generateExactlyOneSentence: shortOneSentence,
    };
    
    const systemPrompt = getScriptGenerationPrompt(parameters as any);
    
    const messages = [
      { role: 'user' as const, content: systemPrompt }
    ];
    
    // Call OpenRouter LLM
    console.log('Generating script for user:', userId);
    const oneSentenceOnly = Boolean(parameters.generateExactlyOneSentence);
    let generatedScript = await callOpenRouter(messages, oneSentenceOnly ? 400 : 4000, oneSentenceOnly ? 0.45 : 0.7);

    if (oneSentenceOnly) {
      generatedScript = takeFirstNSentences(generatedScript, 1);
    }

    // Calculate metadata
    const { wordCount, estimatedDuration } = calculateMetadata(generatedScript, pacing);
    const metadata: ScriptMetadata = { 
      wordCount, 
      estimatedDuration, 
      scriptType: styleTone,
      tone: styleTone,
    };
    
    const scriptId = uuidv4();
    
    // Save to Supabase
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('scripts')
      .insert({
        script_id: scriptId,
        user_id: userId,
        title,
        language,
        method: 'generated' as const,
        content: generatedScript,
        parameters,
        metadata,
        versions: [],
        status: 'draft' as const
      } as any)
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Failed to save script to database' });
      return;
    }
    
    res.json({
      scriptId,
      content: generatedScript,
      metadata
    });
  } catch (error: any) {
    console.error('Script generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate script' });
  }
};

/**
 * Refine Script
 * POST /api/content/refine-script
 */
export const refineScript = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { 
      title, originalScript, refinementType, customInstructions,
      language, duration, pacing 
    } = req.body;

    // Validation
    if (!title || !originalScript || !refinementType || !language || !duration || !pacing) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    let systemPrompt: string;
    if (refinementType === 'simple') {
      systemPrompt = getSimpleRefinementPrompt(language, duration, pacing);
    } else if (refinementType === 'custom') {
      if (!customInstructions) {
        res.status(400).json({ error: 'Custom instructions required for custom refinement' });
        return;
      }
      systemPrompt = getCustomRefinementPrompt(language, duration, pacing, customInstructions);
    } else {
      res.status(400).json({ error: 'Invalid refinement type. Must be "simple" or "custom"' });
      return;
    }
    const refineSafetyInput = [originalScript, customInstructions].filter(Boolean).join('\n');
    const refineSafety = await validateManualScriptSafety(refineSafetyInput, language);
    if (refineSafety.status !== 'ok') {
      denyUnsafeRequest(res, refineSafety.details?.reason || 'Unsafe script content');
      return;
    }
    
    const messages = [
      { role: 'user' as const, content: `${systemPrompt}\n\nHere is the script to refine:\n\n${originalScript}` }
    ];
    
    console.log('Refining script for user:', userId);
    const refinedScript = await callOpenRouter(messages, 4000);
    
    const { wordCount, estimatedDuration } = calculateMetadata(refinedScript, pacing);
    const metadata: ScriptMetadata = { wordCount, estimatedDuration };
    
    const scriptId = uuidv4();
    const parameters: ScriptParameters = { 
      refinementType, 
      customInstructions, 
      originalScript,
      duration, 
      pacing 
    };
    
    // Save to Supabase
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('scripts')
      .insert({
        script_id: scriptId,
        user_id: userId,
        title,
        language,
        method: 'refinement' as const,
        content: refinedScript,
        parameters,
        metadata,
        versions: [],
        status: 'draft' as const
      } as any)
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Failed to save script to database' });
      return;
    }
    
    res.json({
      scriptId,
      content: refinedScript,
      metadata
    });
  } catch (error: any) {
    console.error('Script refinement error:', error);
    res.status(500).json({ error: error.message || 'Failed to refine script' });
  }
};

/**
 * Refine with Feedback
 * POST /api/content/refine-with-feedback
 */
export const refineWithFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { 
      scriptId, currentScript, feedback,
      language, duration, pacing 
    } = req.body;

    // Validation
    if (!scriptId || !currentScript || !feedback || !language || !duration || !pacing) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Get existing script from database to access versions
    const supabase = getSupabaseClient();
    const { data: existingScript, error: fetchError } = await supabase
      .from('scripts')
      .select('*')
      .eq('script_id', scriptId)
      .eq('user_id', userId)
      .single() as { data: Script | null; error: any };
    
    if (fetchError || !existingScript) {
      res.status(404).json({ error: 'Script not found' });
      return;
    }
    
    const currentVersion = existingScript.versions?.length || 0;
    
    const systemPrompt = getFeedbackRefinementPrompt(
      language, duration, pacing, feedback, currentVersion
    );
    
    const messages = [
      { role: 'user' as const, content: `${systemPrompt}\n\nHere is the current script:\n\n${currentScript}` }
    ];
    
    console.log('Refining script with feedback for user:', userId);
    const refinedScript = await callOpenRouter(messages, 4000);
    
    const { wordCount, estimatedDuration } = calculateMetadata(refinedScript, pacing);
    const metadata: ScriptMetadata = { wordCount, estimatedDuration };
    
    // Add new version to versions array
    const newVersion = {
      versionNumber: currentVersion + 1,
      content: refinedScript,
      feedback,
      createdAt: new Date().toISOString()
    };
    
    const updatedVersions = [...(existingScript.versions || []), newVersion];
    
    // Update script in database
    const { error: updateError } = await (supabase
      .from('scripts') as any)
      .update({
        content: refinedScript,
        metadata,
        versions: updatedVersions,
        updated_at: new Date().toISOString()
      })
      .eq('script_id', scriptId)
      .eq('user_id', userId);
    
    if (updateError) {
      console.error('Database update error:', updateError);
      res.status(500).json({ error: 'Failed to update script' });
      return;
    }
    
    res.json({
      scriptId,
      content: refinedScript,
      metadata,
      version: currentVersion + 1
    });
  } catch (error: any) {
    console.error('Feedback refinement error:', error);
    res.status(500).json({ error: error.message || 'Failed to refine script with feedback' });
  }
};

/**
 * Get Script by ID
 * GET /api/content/script/:scriptId
 */
export const getScriptById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    const { scriptId } = req.params;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    if (!scriptId) {
      res.status(400).json({ error: 'Script ID is required' });
      return;
    }
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('script_id', scriptId)
      .eq('user_id', userId)
      .single() as { data: Script | null; error: any };
    
    if (error || !data) {
      res.status(404).json({ error: 'Script not found' });
      return;
    }
    
    res.json(data);
  } catch (error: any) {
    console.error('Get script error:', error);
    res.status(500).json({ error: 'Failed to retrieve script' });
  }
};

/**
 * Save Draft
 * POST /api/content/save-draft
 */
export const saveDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    const { scriptId, content, parameters } = req.body;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    if (!scriptId || !content) {
      res.status(400).json({ error: 'Missing required fields: scriptId, content' });
      return;
    }
    
    // Update script
    const supabase = getSupabaseClient();
    const { error } = await (supabase
      .from('scripts') as any)
      .update({
        content,
        parameters,
        status: 'draft' as const,
        updated_at: new Date().toISOString()
      })
      .eq('script_id', scriptId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Save draft error:', error);
      res.status(500).json({ error: 'Failed to save draft' });
      return;
    }
    
    res.json({ success: true, draftId: scriptId });
  } catch (error: any) {
    console.error('Save draft error:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
};

/**
 * Get User Drafts
 * GET /api/content/drafts
 */
export const getUserDrafts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Get drafts error:', error);
      res.status(500).json({ error: 'Failed to retrieve drafts' });
      return;
    }
    
    res.json({ drafts: data || [] });
  } catch (error: any) {
    console.error('Get drafts error:', error);
    res.status(500).json({ error: 'Failed to retrieve drafts' });
  }
};

/**
 * DELETE /api/content/draft/:scriptId
 * Permanently removes a draft owned by the current user.
 */
export const deleteDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const scriptId = String(req.params.scriptId || '').trim();
    if (!scriptId || scriptId.length > 200) {
      res.status(400).json({ error: 'Invalid script id' });
      return;
    }

    const supabase = getSupabaseClient();

    const { data: row, error: fetchErr } = await supabase
      .from('scripts')
      .select('script_id')
      .eq('user_id', userId)
      .eq('script_id', scriptId)
      .eq('status', 'draft')
      .maybeSingle();

    if (fetchErr) {
      console.error('Delete draft lookup:', fetchErr);
      res.status(500).json({ error: 'Failed to verify draft' });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Draft not found' });
      return;
    }

    const { error: delErr } = await supabase
      .from('scripts')
      .delete()
      .eq('user_id', userId)
      .eq('script_id', scriptId)
      .eq('status', 'draft');

    if (delErr) {
      console.error('Delete draft:', delErr);
      res.status(500).json({ error: 'Failed to delete draft' });
      return;
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete draft error:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
};

/**
 * Save Script Directly (Passthrough)
 * POST /api/content/save-script-direct
 * Saves the user's own script without any AI processing
 */
export const saveScriptDirect = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { title, language, content } = req.body;

    // Validation
    if (!title || !language || !content) {
      res.status(400).json({ error: 'Missing required fields: title, language, content' });
      return;
    }

    const safety = await validateManualScriptSafety(String(content), String(language));
    if (safety.status !== 'ok') {
      denyUnsafeRequest(res, safety.details?.reason || 'Unsafe script content');
      return;
    }

    const finalContent = (safety.safeContent && safety.safeContent.trim()) || content;

    // Calculate metadata
    const wordCount = finalContent.trim().split(/\s+/).length;
    const estimatedDuration = wordCount / 140; // assume medium pacing
    const metadata: ScriptMetadata = { wordCount, estimatedDuration };

    const scriptId = uuidv4();

    // Save to Supabase
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('scripts')
      .insert({
        script_id: scriptId,
        user_id: userId,
        title,
        language,
        method: 'passthrough' as const,
        content: finalContent,
        parameters: null,
        metadata,
        versions: [],
        status: 'draft' as const
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Failed to save script to database' });
      return;
    }

    res.json({
      safety: {
        status: safety.status,
        code: safety.code,
        message: safety.message,
        details: safety.details,
        action: safety.action,
      },
      scriptId,
      content: finalContent,
      metadata
    });
  } catch (error: any) {
    console.error('Save script direct error:', error);
    res.status(500).json({ error: error.message || 'Failed to save script' });
  }
};
