"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mic, 
  FileText, 
  Wand2, 
  Volume2, 
  Video, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Play,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProcessingStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  result?: any
  error?: string
  icon: React.ReactNode
}

interface ProcessingPipelineProps {
  audioFile?: any
  videoFile?: any
  onComplete: (result: any) => void
  onError: (error: string) => void
}

export default function ProcessingPipeline({
  audioFile,
  videoFile,
  onComplete,
  onError
}: ProcessingPipelineProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: 'transcribe',
      name: 'Transcription',
      description: 'Converting audio to text',
      status: 'pending',
      progress: 0,
      icon: <Mic className="h-4 w-4" />
    },
    {
      id: 'text-enhance',
      name: 'Text Enhancement',
      description: 'Improving text quality',
      status: 'pending',
      progress: 0,
      icon: <Wand2 className="h-4 w-4" />
    },
    {
      id: 'voice-clone',
      name: 'Voice Cloning',
      description: 'Generating synthetic speech',
      status: 'pending',
      progress: 0,
      icon: <Volume2 className="h-4 w-4" />
    },
    {
      id: 'lipsync',
      name: 'Lip Synchronization',
      description: 'Syncing speech with video',
      status: 'pending',
      progress: 0,
      icon: <Video className="h-4 w-4" />
    }
  ])

  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [finalResult, setFinalResult] = useState<any>(null)
  const [overallProgress, setOverallProgress] = useState(0)

  const startProcessing = async () => {
    if (!audioFile) {
      onError('Audio file is required for processing')
      return
    }

    setIsProcessing(true)
    setCurrentStep('transcribe')

    try {
      // Step 1: Transcription
      await processTranscription()

      // Step 2: Text Enhancement
      setCurrentStep('text-enhance')
      await processTextEnhancement()

      // Step 3: Voice Cloning
      setCurrentStep('voice-clone')
      await processVoiceCloning()

      // Step 4: Lip Synchronization (if video provided)
      if (videoFile) {
        setCurrentStep('lipsync')
        await processLipSync()
      }

      // Processing complete
      setIsProcessing(false)
      setCurrentStep(null)
      setFinalResult({
        success: true,
        message: 'Content generation completed successfully!',
        steps: steps
      })
      onComplete(finalResult)

    } catch (error) {
      setIsProcessing(false)
      setCurrentStep(null)
      const errorMessage = error instanceof Error ? error.message : 'Processing failed'
      onError(errorMessage)
    }
  }

  const processTranscription = async () => {
    updateStepStatus('transcribe', 'processing', 0)
    
    try {
      const response = await fetch('/api/process/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filepath: audioFile.filepath,
          language: 'auto',
          jobId: `transcribe_${Date.now()}`
        })
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const result = await response.json()
      updateStepStatus('transcribe', 'completed', 100, result.result)
      
    } catch (error) {
      updateStepStatus('transcribe', 'failed', 0, undefined, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  const processTextEnhancement = async () => {
    updateStepStatus('text-enhance', 'processing', 0)
    
    try {
      const transcriptionStep = steps.find(s => s.id === 'transcribe')
      if (!transcriptionStep?.result?.text) {
        throw new Error('No transcription text available')
      }

      const response = await fetch('/api/process/text-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcriptionStep.result.text,
          language: 'auto',
          enhancementOptions: {
            improveGrammar: true,
            addPunctuation: true,
            enhanceFlow: true
          },
          jobId: `text_enhance_${Date.now()}`
        })
      })

      if (!response.ok) {
        throw new Error('Text enhancement failed')
      }

      const result = await response.json()
      updateStepStatus('text-enhance', 'completed', 100, result.result)
      
    } catch (error) {
      updateStepStatus('text-enhance', 'failed', 0, undefined, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  const processVoiceCloning = async () => {
    updateStepStatus('voice-clone', 'processing', 0)
    
    try {
      const textEnhancementStep = steps.find(s => s.id === 'text-enhance')
      if (!textEnhancementStep?.result?.enhancedText) {
        throw new Error('No enhanced text available')
      }

      const response = await fetch('/api/process/voice-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textEnhancementStep.result.enhancedText,
          referenceAudioPath: audioFile.filepath,
          userId: 'demo_user', // In real app, get from auth
          voiceSettings: {
            speed: 1.0,
            pitch: 1.0,
            emotion: 'neutral'
          },
          jobId: `voice_clone_${Date.now()}`
        })
      })

      if (!response.ok) {
        throw new Error('Voice cloning failed')
      }

      const result = await response.json()
      updateStepStatus('voice-clone', 'completed', 100, result.result)
      
    } catch (error) {
      updateStepStatus('voice-clone', 'failed', 0, undefined, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  const processLipSync = async () => {
    updateStepStatus('lipsync', 'processing', 0)
    
    try {
      const voiceCloneStep = steps.find(s => s.id === 'voice-clone')
      if (!voiceCloneStep?.result?.audioPath) {
        throw new Error('No generated audio available')
      }

      const response = await fetch('/api/process/lip-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPath: videoFile.filepath,
          audioPath: voiceCloneStep.result.audioPath,
          userId: 'demo_user', // In real app, get from auth
          syncSettings: {
            quality: 'high',
            smoothing: 0.8,
            faceDetection: true
          },
          jobId: `lipsync_${Date.now()}`
        })
      })

      if (!response.ok) {
        throw new Error('Lip synchronization failed')
      }

      const result = await response.json()
      updateStepStatus('lipsync', 'completed', 100, result.result)
      
    } catch (error) {
      updateStepStatus('lipsync', 'failed', 0, undefined, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  const updateStepStatus = (stepId: string, status: ProcessingStep['status'], progress: number, result?: any, error?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, progress, result, error }
        : step
    ))
  }

  const resetPipeline = () => {
    setSteps(prev => prev.map(step => ({
      ...step,
      status: 'pending' as const,
      progress: 0,
      result: undefined,
      error: undefined
    })))
    setCurrentStep(null)
    setIsProcessing(false)
    setFinalResult(null)
    setOverallProgress(0)
  }

  const getStepIcon = (step: ProcessingStep) => {
    if (step.status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (step.status === 'failed') {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
    if (step.status === 'processing') {
      return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
    }
    return step.icon
  }

  const getStepStatusBadge = (step: ProcessingStep) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const

    const colors = {
      pending: 'bg-gray-500',
      processing: 'bg-blue-500',
      completed: 'bg-green-500',
      failed: 'bg-red-500'
    }

    return (
      <Badge variant={variants[step.status]} className={colors[step.status]}>
        {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
      </Badge>
    )
  }

  // Calculate overall progress
  useEffect(() => {
    const totalSteps = steps.length
    const completedSteps = steps.filter(s => s.status === 'completed').length
    const processingSteps = steps.filter(s => s.status === 'processing')
    
    let progress = (completedSteps / totalSteps) * 100
    
    if (processingSteps.length > 0) {
      const currentStepProgress = processingSteps[0].progress
      progress += (currentStepProgress / totalSteps)
    }
    
    setOverallProgress(Math.round(progress))
  }, [steps])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Processing Pipeline
        </CardTitle>
        <CardDescription>
          Your content will be processed through these steps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="w-full" />
        </div>

        {/* Processing Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStepIcon(step)}
                  <div>
                    <h4 className="font-medium">{step.name}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {getStepStatusBadge(step)}
              </div>

              {step.status === 'processing' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Processing...</span>
                    <span className="text-xs text-muted-foreground">{step.progress}%</span>
                  </div>
                  <Progress value={step.progress} className="w-full" />
                </div>
              )}

              {step.status === 'failed' && step.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{step.error}</AlertDescription>
                </Alert>
              )}

              {step.status === 'completed' && step.result && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                  ✓ Completed successfully
                </div>
              )}

              {index < steps.length - 1 && (
                <div className="h-px bg-border ml-6" />
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          {!isProcessing && !finalResult && (
            <Button 
              onClick={startProcessing}
              disabled={!audioFile}
              className="flex-1"
            >
              Start Processing
            </Button>
          )}

          {isProcessing && (
            <Button variant="outline" onClick={() => {}} disabled className="flex-1">
              Processing...
            </Button>
          )}

          {finalResult && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={resetPipeline} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Start New
              </Button>
              <Button className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Result
              </Button>
            </div>
          )}
        </div>

        {/* Final Result */}
        {finalResult && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {finalResult.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

