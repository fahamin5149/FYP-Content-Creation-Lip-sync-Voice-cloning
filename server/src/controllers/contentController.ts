// server/src/controllers/contentController.ts
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { callOpenRouter } from '../config/openrouter.js';
import { getSupabaseClient } from '../db/supabase.js';
import { getSimpleRefinementPrompt, getCustomRefinementPrompt } from '../prompts/scriptRefinement.js';
import { getScriptGenerationPrompt } from '../prompts/scriptGeneration.js';
import { getFeedbackRefinementPrompt } from '../prompts/feedbackRefinement.js';
import type { Script, ScriptParameters, ScriptMetadata } from '../types/database.types.js';

/**
 * Helper function to calculate word count and duration
 */
const calculateMetadata = (content: string, pacing: string) => {
  const wordCount = content.trim().split(/\s+/).length;
  const wordsPerMinute = pacing === 'slow' ? 120 : pacing === 'fast' ? 160 : 140;
  const estimatedDuration = wordCount / wordsPerMinute;
  return { wordCount, estimatedDuration };
};

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
      language, topic, scriptType, tone, targetAudience, keyPoints,
      duration, pacing, introStyle, includeHook, includeCTA,
      includeTransitions, includeQuestions, specialRequirements 
    } = req.body;

    // Validation
    if (!language || !topic || !duration || !pacing) {
      res.status(400).json({ error: 'Missing required fields: language, topic, duration, pacing' });
      return;
    }
    
    const parameters: ScriptParameters = {
      language, topic, scriptType, tone, targetAudience, keyPoints,
      duration, pacing, introStyle, includeHook, includeCTA,
      includeTransitions, includeQuestions, specialRequirements
    };
    
    const systemPrompt = getScriptGenerationPrompt(parameters as any);
    
    const messages = [
      { role: 'user' as const, content: systemPrompt }
    ];
    
    // Call OpenRouter LLM
    console.log('Generating script for user:', userId);
    const generatedScript = await callOpenRouter(messages, 4000);
    
    // Calculate metadata
    const { wordCount, estimatedDuration } = calculateMetadata(generatedScript, pacing);
    const metadata: ScriptMetadata = { 
      wordCount, 
      estimatedDuration, 
      scriptType, 
      tone 
    };
    
    const scriptId = uuidv4();
    
    // Save to Supabase
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('scripts')
      .insert({
        script_id: scriptId,
        user_id: userId,
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
      originalScript, refinementType, customInstructions,
      language, duration, pacing 
    } = req.body;

    // Validation
    if (!originalScript || !refinementType || !language || !duration || !pacing) {
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
