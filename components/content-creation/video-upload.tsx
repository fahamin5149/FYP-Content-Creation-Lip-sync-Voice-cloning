"use client"

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Video, X, CheckCircle, AlertCircle, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoUploadProps {
  onUploadComplete: (fileInfo: any) => void
  onError: (error: string) => void
  maxSize?: number // in MB
  acceptedTypes?: string[]
}

export default function VideoUpload({
  onUploadComplete,
  onError,
  maxSize = 100,
  acceptedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/webm', 'video/mkv']
}: VideoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload a video file (MP4, AVI, MOV, WebM, or MKV).'
    }

    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size is ${maxSize}MB.`
    }

    return null
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const validationError = validateFile(file)
      if (validationError) {
        throw new Error(validationError)
      }

      const formData = new FormData()
      formData.append('video', file)

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setUploadedFile(result)
      onUploadComplete(result)
      setIsUploading(false)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      onError(errorMessage)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setError(null)
    setUploadProgress(0)
    setIsPlaying(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Upload Video Template
        </CardTitle>
        <CardDescription>
          Upload a video template for lip synchronization (MP4, AVI, MOV, WebM, or MKV) up to {maxSize}MB
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!uploadedFile && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              isUploading && "pointer-events-none opacity-50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            
            {isUploading ? (
              <div className="space-y-4">
                <p className="text-sm font-medium">Uploading...</p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag and drop your video template here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse files
                </p>
                <Button variant="outline" size="sm">
                  Choose File
                </Button>
              </div>
            )}
          </div>
        )}

        {uploadedFile && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Video template uploaded successfully!
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Video className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{uploadedFile.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(uploadedFile.size)} • {uploadedFile.type}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Video Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={URL.createObjectURL(new Blob())} // In real app, use actual file URL
                  className="w-full h-64 object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={togglePlayback}
                    className="rounded-full w-16 h-16"
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6 ml-1" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

