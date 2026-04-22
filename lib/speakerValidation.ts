import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision"

export interface SpeakerValidationResponse {
  status: "ok" | "warning"
  code: "SINGLE_SPEAKER_CONFIRMED" | "MULTIPLE_SPEAKERS_DETECTED" | "VALIDATION_SKIPPED"
  message: string
  details: {
    max_detected_persons: number
    frames_analyzed: number
  }
  action: {
    allow_continue: true
    suggestion: string
  }
}

interface DetectionBackend {
  detectFaces(bitmap: ImageBitmap): Promise<number>
  close?(): void
}

class MediaPipeFaceBackend implements DetectionBackend {
  private static instance: Promise<FaceDetector> | null = null

  private static getDetector(): Promise<FaceDetector> {
    if (!MediaPipeFaceBackend.instance) {
      MediaPipeFaceBackend.instance = (async () => {
        ensureMediaPipeLogFilterInstalled()
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        )
        return FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite",
          },
          runningMode: "IMAGE",
        })
      })()
    }
    return MediaPipeFaceBackend.instance
  }

  async detectFaces(bitmap: ImageBitmap): Promise<number> {
    const detector = await MediaPipeFaceBackend.getDetector()
    const result = await runMediaPipeDetectSilenced(async () => detector.detect(bitmap))
    return result.detections?.length ?? 0
  }
}

let mediaPipeLogFilterInstalled = false

function isMediaPipeRuntimeLog(args: unknown[]): boolean {
  const text = args.map((a) => String(a ?? "")).join(" ")
  return (
    text.includes("Created TensorFlow Lite XNNPACK delegate for CPU") ||
    text.includes("inference_feedback_manager.cc:121") ||
    text.includes("Feedback manager requires a model with a single signature inference")
  )
}

function ensureMediaPipeLogFilterInstalled(): void {
  if (mediaPipeLogFilterInstalled) return
  mediaPipeLogFilterInstalled = true

  const originalError = console.error
  const originalWarn = console.warn
  const originalInfo = console.info

  console.error = (...args: unknown[]) => {
    if (isMediaPipeRuntimeLog(args)) return
    originalError(...args)
  }
  console.warn = (...args: unknown[]) => {
    if (isMediaPipeRuntimeLog(args)) return
    originalWarn(...args)
  }
  console.info = (...args: unknown[]) => {
    if (isMediaPipeRuntimeLog(args)) return
    originalInfo(...args)
  }
}

async function runMediaPipeDetectSilenced<T>(work: () => Promise<T> | T): Promise<T> {
  ensureMediaPipeLogFilterInstalled()
  return await work()
}

async function sampleFrames(file: File, frameCount: number): Promise<ImageBitmap[]> {
  const url = URL.createObjectURL(file)
  const video = document.createElement("video")
  video.src = url
  video.muted = true
  video.playsInline = true
  video.preload = "metadata"

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error("Could not read uploaded video metadata."))
    })

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0
    const timestamps = Array.from({ length: frameCount }, (_, i) =>
      duration > 0 ? Math.min(duration - 0.01, Math.max(0, i * 0.35)) : i * 0.1
    )

    const frames: ImageBitmap[] = []
    for (const time of timestamps) {
      const seekTime = Math.max(0, time)
      await new Promise<void>((resolve, reject) => {
        const onSeeked = () => {
          cleanup()
          resolve()
        }
        const onError = () => {
          cleanup()
          reject(new Error("Failed while sampling video frame."))
        }
        const cleanup = () => {
          video.removeEventListener("seeked", onSeeked)
          video.removeEventListener("error", onError)
        }
        video.addEventListener("seeked", onSeeked, { once: true })
        video.addEventListener("error", onError, { once: true })
        video.currentTime = seekTime
      })
      frames.push(await createImageBitmap(video))
    }
    return frames
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function runSpeakerValidation(file: File, framesToAnalyze = 4): Promise<SpeakerValidationResponse> {
  try {
    const backend: DetectionBackend = new MediaPipeFaceBackend()
    const sampled = await sampleFrames(file, Math.max(1, Math.min(4, framesToAnalyze)))
    let maxDetected = 0

    for (const frame of sampled) {
      const count = await backend.detectFaces(frame)
      maxDetected = Math.max(maxDetected, count)
      frame.close()
    }

    if (maxDetected > 1) {
      return {
        status: "warning",
        code: "MULTIPLE_SPEAKERS_DETECTED",
        message:
          "Multiple individuals were detected in the uploaded video template. For best results, please upload a video containing a single speaker.",
        details: {
          max_detected_persons: maxDetected,
          frames_analyzed: sampled.length,
        },
        action: {
          allow_continue: true,
          suggestion: "You may proceed, but results may be inconsistent.",
        },
      }
    }

    return {
      status: "ok",
      code: "SINGLE_SPEAKER_CONFIRMED",
      message: "Single speaker check passed.",
      details: {
        max_detected_persons: maxDetected,
        frames_analyzed: sampled.length,
      },
      action: {
        allow_continue: true,
        suggestion: "Continue normally.",
      },
    }
  } catch {
    return {
      status: "ok",
      code: "VALIDATION_SKIPPED",
      message: "Speaker validation skipped on this browser/runtime.",
      details: {
        max_detected_persons: 0,
        frames_analyzed: 0,
      },
      action: {
        allow_continue: true,
        suggestion: "You may proceed.",
      },
    }
  } finally {
    // no-op for now; backend kept reusable
  }
}

