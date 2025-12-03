import {
  Download,
  Trash2,
  Play,
  CheckCircle,
  Loader2
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"

interface Video {
  id: number
  title: string
  duration: string
  language: string
  status: "completed" | "processing"
  date: string
  thumbnailColor: string
  progress?: number
  processingStage?: string
}

interface VideoCardProps {
  video: Video
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="group p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className={`relative w-40 h-24 rounded-xl ${video.thumbnailColor} flex items-center justify-center border border-white/10 overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Play className="h-10 w-10 text-white/60 relative z-10 group-hover:text-white transition-colors" />
          <span className="absolute bottom-2 right-2 text-xs bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-white font-medium">
            {video.duration}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white truncate mb-2">{video.title}</h3>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 text-xs font-medium rounded-full border
              ${video.language === "English" 
                ? "bg-blue-500/20 text-blue-400 border-blue-500/30" 
                : "bg-green-500/20 text-green-400 border-green-500/30"}`}>
              {video.language}
            </span>
            
            <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 border
              ${video.status === "completed" 
                ? "bg-green-500/20 text-green-400 border-green-500/30" 
                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}`}>
              {video.status === "completed" ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  Completed
                </>
              ) : (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing
                </>
              )}
            </span>
          </div>

          {video.status === "processing" && (
            <div className="mt-3">
              <p className="text-xs text-white/70 mb-2 font-medium">{video.processingStage}</p>
              <Progress value={video.progress} className="h-1.5" />
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-white/60 font-medium">{video.date}</span>
            
            {video.status === "completed" && (
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors opacity-40 cursor-not-allowed text-white">
                      <Download className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black/90 border-white/20">
                    <p className="text-white">Coming Soon</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors opacity-40 cursor-not-allowed text-white">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black/90 border-white/20">
                    <p className="text-white">Coming Soon</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}