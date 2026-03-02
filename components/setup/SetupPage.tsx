"use client"

import { useAuth } from "@clerk/nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, Video } from "lucide-react"
import { VoiceTab } from "./VoiceTab"
import { VideoTab } from "./VideoTab"

export function SetupPage() {
  const { getToken } = useAuth()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Voice & Video Setup</h1>
        <p className="text-white/60 mt-1">
          Upload and manage your voice samples and video templates
        </p>
      </div>

      <Tabs defaultValue="voice" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl h-auto">
          <TabsTrigger
            value="voice"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 text-white/60 rounded-lg px-6 py-2.5 font-medium transition-all"
          >
            <Mic className="mr-2 h-4 w-4" />
            Voice
          </TabsTrigger>
          <TabsTrigger
            value="video"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 text-white/60 rounded-lg px-6 py-2.5 font-medium transition-all"
          >
            <Video className="mr-2 h-4 w-4" />
            Video
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="mt-6">
          <VoiceTab getToken={getToken} />
        </TabsContent>
        <TabsContent value="video" className="mt-6">
          <VideoTab getToken={getToken} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
