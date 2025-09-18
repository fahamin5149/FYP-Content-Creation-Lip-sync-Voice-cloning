"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Video, 
  FileAudio, 
  History, 
  Settings, 
  LogOut,
  Plus,
  Play,
  Download,
  Clock,
  CheckCircle
} from "lucide-react"
import ContentCreator from "@/components/content-creation/content-creator"

export default function Dashboard() {
  const { user, logout, loading } = useAuth()  
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("create")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Mock data for recent projects
  const recentProjects = [
    {
      id: 1,
      name: "Marketing Video - Product Launch",
      status: "completed",
      createdAt: "2024-01-15",
      duration: "2m 30s",
      quality: 92
    },
    {
      id: 2,
      name: "Educational Content - Urdu Tutorial",
      status: "processing",
      createdAt: "2024-01-14",
      duration: "5m 15s",
      quality: null
    },
    {
      id: 3,
      name: "Social Media Post - English",
      status: "completed",
      createdAt: "2024-01-13",
      duration: "45s",
      quality: 88
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-zinc-400">Welcome back, {user.email?.split('@')[0]}!</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Email Verification Notice */}
        {!user.emailVerified && (
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-orange-400 text-sm">Please verify your email address to access all features.</p>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <ContentCreator userId={user.uid} />
          </TabsContent>

          <TabsContent value="projects">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Recent Projects</h2>
                <Button onClick={() => setActiveTab("create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentProjects.map((project) => (
                  <Card key={project.id} className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <Badge 
                          variant={project.status === 'completed' ? 'default' : 'secondary'}
                          className={project.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-zinc-400">
                        Created: {project.createdAt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Duration:</span>
                        <span>{project.duration}</span>
                      </div>
                      
                      {project.quality && (
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400">Quality:</span>
                          <span>{project.quality}%</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        {project.status === 'completed' ? (
                          <>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Play className="h-3 w-3 mr-1" />
                              Play
                            </Button>
                            <Button size="sm" className="flex-1">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" className="flex-1" disabled>
                            <Clock className="h-3 w-3 mr-1" />
                            Processing...
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Total Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-zinc-400">+3 this month</p>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Processing Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2m 34s</div>
                    <p className="text-xs text-zinc-400">Average</p>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">95%</div>
                    <p className="text-xs text-zinc-400">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quality Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">91%</div>
                    <p className="text-xs text-zinc-400">Average</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Settings</h2>
              
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Manage your account settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Email</span>
                    <span>{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Email Verified</span>
                    <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                      {user.emailVerified ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle>Processing Preferences</CardTitle>
                  <CardDescription>Configure your content generation settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Default Language</span>
                    <Badge variant="outline">Auto-detect</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Quality Preference</span>
                    <Badge variant="outline">High</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Processing Speed</span>
                    <Badge variant="outline">Standard</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
