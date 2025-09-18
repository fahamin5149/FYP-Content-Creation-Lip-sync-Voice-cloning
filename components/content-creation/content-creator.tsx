"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileAudio, 
  Video, 
  Play, 
  Download, 
  Settings, 
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import AudioUpload from './audio-upload'
import VideoUpload from './video-upload'
import ProcessingPipeline from './processing-pipeline'

interface ContentCreatorProps {
  userId?: string
}

export default function ContentCreator({ userId = 'demo_user' }: ContentCreatorProps) {
  const [audioFile, setAudioFile] = useState<any>(null)
  const [videoFile, setVideoFile] = useState<any>(null)
  const [processingResult, setProcessingResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('upload')

  const handleAudioUpload = (fileInfo: any) => {
    setAudioFile(fileInfo)
    setError(null)
  }

  const handleVideoUpload = (fileInfo: any) => {
    setVideoFile(fileInfo)
    setError(null)
  }

  const handleProcessingComplete = (result: any) => {
    setProcessingResult(result)
    setActiveTab('result')
  }

  const handleProcessingError = (error: string) => {
    setError(error)
  }

  const handleError = (error: string) => {
    setError(error)
  }

  const canStartProcessing = audioFile && !error
  const hasRequiredFiles = audioFile

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">AI Content Creator</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transform your audio into professional lip-synced videos using AI-powered voice cloning and synchronization technology.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <FileAudio className="h-4 w-4" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="process" disabled={!hasRequiredFiles} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Processing
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!processingResult} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Result
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audio Upload */}
            <AudioUpload
              onUploadComplete={handleAudioUpload}
              onError={handleError}
              maxSize={50}
            />

            {/* Video Upload */}
            <VideoUpload
              onUploadComplete={handleVideoUpload}
              onError={handleError}
              maxSize={100}
            />
          </div>

          {/* Upload Summary */}
          {(audioFile || videoFile) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Upload Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {audioFile && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileAudio className="h-6 w-6 text-primary" />
                      <div>
                        <p className="font-medium">{audioFile.filename}</p>
                        <p className="text-sm text-muted-foreground">Audio file</p>
                      </div>
                    </div>
                    <Badge variant="default">Ready</Badge>
                  </div>
                )}

                {videoFile && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Video className="h-6 w-6 text-primary" />
                      <div>
                        <p className="font-medium">{videoFile.filename}</p>
                        <p className="text-sm text-muted-foreground">Video template</p>
                      </div>
                    </div>
                    <Badge variant="default">Ready</Badge>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">
                    {audioFile ? 'Ready to process' : 'Upload audio file to continue'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Step Button */}
          {canStartProcessing && (
            <div className="text-center">
              <Button 
                size="lg" 
                onClick={() => setActiveTab('process')}
                className="px-8"
              >
                Start Processing
                <Play className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="process">
          <ProcessingPipeline
            audioFile={audioFile}
            videoFile={videoFile}
            onComplete={handleProcessingComplete}
            onError={handleProcessingError}
          />
        </TabsContent>

        <TabsContent value="result">
          {processingResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Content Generation Complete
                </CardTitle>
                <CardDescription>
                  Your AI-generated content is ready for download
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Result Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <FileAudio className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium">Audio Generated</p>
                    <p className="text-sm text-muted-foreground">Voice cloned successfully</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Video className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium">Video Processed</p>
                    <p className="text-sm text-muted-foreground">Lip sync applied</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Download className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium">Ready to Download</p>
                    <p className="text-sm text-muted-foreground">High quality output</p>
                  </div>
                </div>

                {/* Download Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Final Video
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1">
                    <FileAudio className="h-4 w-4 mr-2" />
                    Download Audio Only
                  </Button>
                </div>

                {/* Quality Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Processing Quality</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Voice Similarity</span>
                        <span className="text-sm font-medium">88%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Lip Sync Accuracy</span>
                        <span className="text-sm font-medium">91%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Overall Quality</span>
                        <span className="text-sm font-medium">92%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Processing Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Processing Time</span>
                        <span className="text-sm font-medium">2m 34s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Output Duration</span>
                        <span className="text-sm font-medium">10.5s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">File Size</span>
                        <span className="text-sm font-medium">15.2 MB</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Create New Button */}
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setActiveTab('upload')
                      setAudioFile(null)
                      setVideoFile(null)
                      setProcessingResult(null)
                      setError(null)
                    }}
                  >
                    Create New Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

