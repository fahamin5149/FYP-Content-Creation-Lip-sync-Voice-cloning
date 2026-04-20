"use client"

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileAudio, X, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AUDIO_FILE_INPUT_ACCEPT,
  SUPPORTED_AUDIO_FORMATS_LABEL,
  isSupportedAudioFile,
} from '@/lib/audioFormats'
import { getAudioUploadRejectionReason } from '@/lib/mediaUploadGuards'

interface AudioUploadProps {
  onUploadComplete: (fileInfo: any) => void
  onError: (error: string) => void
  maxSize?: number // in MB
  acceptedTypes?: string[]
}

export default function AudioUpload({
  onUploadComplete,
  onError,
  maxSize = 50,
  acceptedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/webm', 'audio/flac', 'audio/aac']
}: AudioUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const validateFile = (file: File): string | null => {
    const wrongKind = getAudioUploadRejectionReason(file)
    if (wrongKind) return wrongKind
    // Check file type
    if (!isSupportedAudioFile(file) && !acceptedTypes.includes(file.type)) {
      return `Unsupported audio format. Supported formats: ${SUPPORTED_AUDIO_FORMATS_LABEL}.`
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
      formData.append('audio', file)

      const response = await fetch('/api/upload/audio', {
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
          <FileAudio className="h-5 w-5" />
          Upload Audio
        </CardTitle>
        <CardDescription>
          Upload an audio file ({SUPPORTED_AUDIO_FORMATS_LABEL}) up to {maxSize}MB. Files are auto-converted to WAV.
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
              accept={AUDIO_FILE_INPUT_ACCEPT}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            
            {isUploading ? (
              <div className="space-y-4">
                <p className="text-sm font-medium">Uploading...</p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag and drop your audio file here
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
                File uploaded successfully!
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileAudio className="h-8 w-8 text-primary" />
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

