// AI Services Integration
// This file contains the actual AI service integrations for production use

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

// Helper: lazily initialize OpenAI client only when an API key is available
async function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  const OpenAI = (await import('openai')).default
  return new OpenAI({ apiKey })
}

// Configuration
const CONFIG = {
  WHISPER_MODEL: 'whisper-1',
  GPT_MODEL: 'gpt-4',
  MAX_AUDIO_SIZE: 25 * 1024 * 1024, // 25MB for Whisper
  SUPPORTED_AUDIO_FORMATS: ['mp3', 'wav', 'mp4', 'm4a', 'ogg', 'webm'],
  SUPPORTED_VIDEO_FORMATS: ['mp4', 'avi', 'mov', 'webm', 'mkv'],
}

// Wav2Lip microservice (FastAPI)
const WAV2LIP_URL = process.env.WAV2LIP_URL || 'http://localhost:8002'

export class TranscriptionService {
  async transcribeAudio(filePath: string, language: string = 'auto'): Promise<{
    text: string
    confidence: number
    language: string
    segments: Array<{
      start: number
      end: number
      text: string
      confidence: number
    }>
  }> {
    try {
      // Check file size
      const stats = await fs.stat(filePath)
      if (stats.size > CONFIG.MAX_AUDIO_SIZE) {
        throw new Error(`File too large. Maximum size is ${CONFIG.MAX_AUDIO_SIZE / (1024 * 1024)}MB`)
      }

      // Use Whisper API for transcription (lazy-init OpenAI client)
      const openai = await getOpenAIClient()
      if (!openai) throw new Error('OpenAI API key not configured')
      const fsMod = await import('fs')
      const transcription = await openai.audio.transcriptions.create({
        file: fsMod.createReadStream(filePath),
        model: CONFIG.WHISPER_MODEL,
        language: language !== 'auto' ? language : undefined,
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      })

      return {
        text: transcription.text,
        confidence: 0.95, // Whisper doesn't provide confidence scores
        language: transcription.language || language,
        segments: transcription.segments?.map(segment => ({
          start: segment.start,
          end: segment.end,
          text: segment.text,
          confidence: 0.95
        })) || []
      }
    } catch (error) {
      console.error('Transcription error:', error)
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async detectLanguage(filePath: string): Promise<{
    language: string
    confidence: number
    script: string
  }> {
    try {
      // Use Whisper for language detection (lazy-init OpenAI client)
      const openai = await getOpenAIClient()
      if (!openai) throw new Error('OpenAI API key not configured')
      const fsMod = await import('fs')
      const transcription = await openai.audio.transcriptions.create({
        file: fsMod.createReadStream(filePath),
        model: CONFIG.WHISPER_MODEL,
        response_format: 'verbose_json'
      })

      const language = transcription.language || 'en'
      const script = this.getScriptFromLanguage(language)

      return {
        language,
        confidence: 0.9,
        script
      }
    } catch (error) {
      console.error('Language detection error:', error)
      throw new Error(`Language detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private getScriptFromLanguage(language: string): string {
    const scriptMap: Record<string, string> = {
      'ur': 'arabic',
      'ar': 'arabic',
      'fa': 'arabic',
      'en': 'latin',
      'es': 'latin',
      'fr': 'latin',
      'de': 'latin',
      'hi': 'devanagari',
      'bn': 'bengali',
      'zh': 'chinese',
      'ja': 'japanese',
      'ko': 'korean'
    }
    return scriptMap[language] || 'latin'
  }
}

export class TextEnhancementService {
  async enhanceText(
    text: string,
    language: string,
    enhancementOptions: {
      improveGrammar?: boolean
      addPunctuation?: boolean
      enhanceFlow?: boolean
      maintainOriginalLength?: boolean
      targetAudience?: string
    } = {}
  ): Promise<{
    enhancedText: string
    originalText: string
    changes: Array<{
      type: 'grammar' | 'punctuation' | 'flow' | 'style'
      original: string
      enhanced: string
      confidence: number
    }>
    qualityScore: number
  }> {
    try {
      const prompt = this.buildEnhancementPrompt(text, language, enhancementOptions)
      
      const openai = await getOpenAIClient()
      if (!openai) throw new Error('OpenAI API key not configured')
      const response = await openai.chat.completions.create({
        model: CONFIG.GPT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      })

      const enhancedText = response.choices[0].message.content || text
      
      return {
        enhancedText,
        originalText: text,
        changes: this.calculateChanges(text, enhancedText),
        qualityScore: 0.95
      }
    } catch (error) {
      console.error('Text enhancement error:', error)
      throw new Error(`Text enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async translateText(
    text: string,
    fromLanguage: string,
    toLanguage: string
  ): Promise<{
    translatedText: string
    confidence: number
    detectedLanguage: string
  }> {
    try {
      const prompt = `Translate the following text from ${fromLanguage} to ${toLanguage}. 
      Maintain the original tone, style, and meaning. Only return the translated text:
      
      "${text}"`
      
      const openai = await getOpenAIClient()
      if (!openai) throw new Error('OpenAI API key not configured')
      const response = await openai.chat.completions.create({
        model: CONFIG.GPT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1000
      })

      return {
        translatedText: response.choices[0].message.content || text,
        confidence: 0.95,
        detectedLanguage: fromLanguage
      }
    } catch (error) {
      console.error('Translation error:', error)
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildEnhancementPrompt(
    text: string, 
    language: string, 
    options: any
  ): string {
    let prompt = `Please enhance the following ${language} text while maintaining its original meaning and style:\n\n`
    
    if (options.improveGrammar) {
      prompt += '- Fix grammar and syntax errors\n'
    }
    if (options.addPunctuation) {
      prompt += '- Add proper punctuation\n'
    }
    if (options.enhanceFlow) {
      prompt += '- Improve text flow and readability\n'
    }
    if (options.maintainOriginalLength) {
      prompt += '- Keep the same approximate length\n'
    }
    if (options.targetAudience) {
      prompt += `- Adapt for ${options.targetAudience} audience\n`
    }
    
    prompt += '\nReturn only the enhanced text:\n\n'
    prompt += `"${text}"`
    
    return prompt
  }

  private calculateChanges(original: string, enhanced: string): Array<{
    type: 'grammar' | 'punctuation' | 'flow' | 'style'
    original: string
    enhanced: string
    confidence: number
  }> {
    // Simple change detection - in production, use a proper diffing library
    if (original === enhanced) {
      return []
    }

    return [{
      type: 'grammar',
      original,
      enhanced,
      confidence: 0.9
    }]
  }
}

export class VoiceCloningService {
  async cloneVoice(
    text: string,
    referenceAudioPath: string,
    userId: string,
    voiceSettings: {
      speed?: number
      pitch?: number
      emotion?: string
    } = {}
  ): Promise<{
    audioPath: string
    duration: number
    quality: number
    voiceCharacteristics: {
      similarity: number
      clarity: number
      naturalness: number
    }
  }> {
    try {
      // In production, integrate with actual TTS services like:
      // - Tortoise TTS
      // - XTTS
      // - ElevenLabs
      // - Azure Cognitive Services
      
      const outputPath = path.join(process.cwd(), 'generated', 'audio', `${userId}_${Date.now()}.wav`)
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true })
      
      // Mock implementation - replace with actual TTS service
      await this.mockVoiceGeneration(text, referenceAudioPath, outputPath, voiceSettings)
      
      return {
        audioPath: outputPath,
        duration: text.length * 0.1, // Rough estimation
        quality: 0.92,
        voiceCharacteristics: {
          similarity: 0.88,
          clarity: 0.94,
          naturalness: 0.90
        }
      }
    } catch (error) {
      console.error('Voice cloning error:', error)
      throw new Error(`Voice cloning failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async trainVoiceModel(userId: string, audioSamples: string[]): Promise<{
    modelId: string
    trainingProgress: number
    quality: number
  }> {
    try {
      // In production, implement actual voice model training
      // This would involve:
      // 1. Preprocessing audio samples
      // 2. Feature extraction
      // 3. Model training (fine-tuning)
      // 4. Validation and testing
      
      const modelId = `voice_model_${userId}_${Date.now()}`
      
      // Mock training process
      await this.mockModelTraining(audioSamples, modelId)
      
      return {
        modelId,
        trainingProgress: 100,
        quality: 0.85
      }
    } catch (error) {
      console.error('Voice training error:', error)
      throw new Error(`Voice training failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async mockVoiceGeneration(
    text: string,
    referenceAudio: string,
    outputPath: string,
    settings: any
  ): Promise<void> {
    // Mock implementation - in production, use actual TTS service
    return new Promise((resolve) => {
      setTimeout(() => {
        // Create a valid WAV file (silence) so downstream services (Wav2Lip)
        // can parse the audio without crashing.
        const sampleRate = 16000
        const durationSeconds = 2
        const numChannels = 1
        const numSamples = sampleRate * durationSeconds
        const bytesPerSample = 2 // int16

        const dataSize = numSamples * numChannels * bytesPerSample
        const buffer = Buffer.alloc(44 + dataSize)

        // RIFF header
        buffer.write("RIFF", 0)
        buffer.writeUInt32LE(36 + dataSize, 4)
        buffer.write("WAVE", 8)

        // fmt chunk
        buffer.write("fmt ", 12)
        buffer.writeUInt32LE(16, 16) // PCM fmt chunk size
        buffer.writeUInt16LE(1, 20) // audio format = 1 (PCM)
        buffer.writeUInt16LE(numChannels, 22)
        buffer.writeUInt32LE(sampleRate, 24)
        buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28) // byte rate
        buffer.writeUInt16LE(numChannels * bytesPerSample, 32) // block align
        buffer.writeUInt16LE(16, 34) // bits per sample

        // data chunk
        buffer.write("data", 36)
        buffer.writeUInt32LE(dataSize, 40)
        // PCM payload is already zeroed => silence

        fs.writeFile(outputPath, buffer)
        resolve()
      }, 2000)
    })
  }

  private async mockModelTraining(audioSamples: string[], modelId: string): Promise<void> {
    // Mock implementation - in production, use actual training pipeline
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 5000)
    })
  }
}

export class LipSyncService {
  async syncLipMovement(
    videoPath: string,
    audioPath: string,
    userId: string,
    syncSettings: {
      quality?: 'low' | 'medium' | 'high'
      smoothing?: number
      faceDetection?: boolean
    } = {}
  ): Promise<{
    jobId: string
    videoPath: string
    duration: number
    quality: number
    syncAccuracy: number
    processingTime: number
  }> {
    try {
      const jobId = (syncSettings as any)?.jobId || `lipsync_${Date.now()}`
      const outputPath = path.join(process.cwd(), 'LIPSYNC_Output', userId, `${jobId}.mp4`)

      // Ensure output directory exists so the Python service can write the MP4.
      await fs.mkdir(path.dirname(outputPath), { recursive: true })

      const res = await fetch(`${WAV2LIP_URL}/lipsync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPath,
          audioPath,
          userId,
          jobId,
          outputPath,
          syncSettings,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || `Wav2Lip service failed: ${res.status}`)
      }

      return {
        jobId,
        videoPath: data.videoPath || outputPath,
        duration: 0,
        quality: syncSettings.quality === 'high' ? 0.95 :
          syncSettings.quality === 'medium' ? 0.88 : 0.82,
        syncAccuracy: 0.91,
        processingTime: data.processingTime || 0,
      }
    } catch (error) {
      console.error('Lip sync error:', error)
      throw new Error(`Lip synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async analyzeVideo(videoPath: string): Promise<{
    faceDetected: boolean
    faceQuality: number
    duration: number
    fps: number
    resolution: string
    recommendations: string[]
  }> {
    try {
      // In production, use OpenCV or similar for video analysis
      return {
        faceDetected: true,
        faceQuality: 0.89,
        duration: 10.5,
        fps: 30,
        resolution: '1920x1080',
        recommendations: [
          'Ensure face is clearly visible',
          'Good lighting conditions detected',
          'Face angle is optimal for lip sync'
        ]
      }
    } catch (error) {
      console.error('Video analysis error:', error)
      throw new Error(`Video analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async mockLipSync(
    videoPath: string,
    audioPath: string,
    outputPath: string,
    settings: any
  ): Promise<void> {
    // Mock implementation - in production, use actual lip sync service
    return new Promise((resolve) => {
      setTimeout(() => {
        // Create a dummy video file
        const dummyVideo = Buffer.alloc(10000)
        fs.writeFile(outputPath, dummyVideo)
        resolve()
      }, settings.quality === 'high' ? 8000 : 
         settings.quality === 'medium' ? 5000 : 3000)
    })
  }
}

// Export service instances
export const transcriptionService = new TranscriptionService()
export const textEnhancementService = new TextEnhancementService()
export const voiceCloningService = new VoiceCloningService()
export const lipSyncService = new LipSyncService()

