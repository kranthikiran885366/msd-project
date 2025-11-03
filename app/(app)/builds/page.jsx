"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Eye,
  Settings,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Terminal,
  Zap,
  GitBranch,
  Code2,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function BuildsPage() {
  const [builds, setBuilds] = useState([])
  const [selectedBuild, setSelectedBuild] = useState(null)
  const [showNewBuild, setShowNewBuild] = useState(false)
  const [showBuildDetails, setShowBuildDetails] = useState(false)
  const [buildLogs, setBuildLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const [newBuild, setNewBuild] = useState({
    branch: "main",
    buildCommand: "npm run build",
    installCommand: "npm install",
    environment: "production",
  })

  useEffect(() => {
    fetchBuilds()
    const interval = setInterval(fetchBuilds, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchBuilds = async () => {
    try {
      // Mock data - replace with real API call
      setBuilds([
        {
          id: 1,
          projectId: 1,
          branch: "main",
          commit: "abc123def",
          status: "success",
          duration: 245,
          trigger: "git-push",
          author: "John Doe",
          message: "Add new features",
          createdAt: new Date(Date.now() - 1000 * 60 * 5),
          completedAt: new Date(Date.now() - 1000 * 60 * 1),
          cacheHit: true,
          metrics: { buildSize: 45, cacheHitRate: 85 },
        },
        {
          id: 2,
          projectId: 1,
          branch: "develop",
          commit: "def456ghi",
          status: "failed",
          duration: 180,
          trigger: "manual",
          author: "Jane Smith",
          message: "Bug fixes",
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
          completedAt: new Date(Date.now() - 1000 * 60 * 25),
          cacheHit: false,
          metrics: { buildSize: 52, cacheHitRate: 60 },
        },
        {
          id: 3,
          projectId: 1,
          branch: "feature/dashboard",
          commit: "ghi789jkl",
          status: "building",
          duration: null,
          trigger: "git-push",
          author: "Bob Wilson",
          message: "Dashboard redesign",
          createdAt: new Date(Date.now() - 1000 * 60 * 2),
          completedAt: null,
          cacheHit: true,
          metrics: { buildSize: 0, cacheHitRate: 75 },
        },
      ])
    } catch (error) {
      console.error("Failed to fetch builds:", error)
    }
  }

  const handleCreateBuild = async () => {
    setLoading(true)
    try {
      // Mock API call
      const newBuildData = {
        ...newBuild,
        id: builds.length + 1,
        status: "pending",
        createdAt: new Date(),
      }
      setBuilds([newBuildData, ...builds])
      setShowNewBuild(false)
      setNewBuild({
        branch: "main",
        buildCommand: "npm run build",
        installCommand: "npm install",
        environment: "production",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewLogs = (build) => {
    setSelectedBuild(build)
    setBuildLogs([
      { timestamp: "14:32:12", message: "Starting build...", level: "info" },
      { timestamp: "14:32:15", message: "Installing dependencies...", level: "info" },
      { timestamp: "14:32:45", message: "Running build script...", level: "info" },
      { timestamp: "14:33:20", message: "Build complete!", level: "info" },
      { timestamp: "14:33:22", message: "Deploying to production...", level: "info" },
      { timestamp: "14:33:45", message: "Deployment successful", level: "success" },
    ])
    setShowBuildDetails(true)
  }

  const handleRetryBuild = async (buildId) => {
    try {
      // Mock retry
      const updatedBuilds = builds.map(b => (b.id === buildId ? { ...b, status: "pending" } : b))
      setBuilds(updatedBuilds)
    } catch (error) {
      console.error("Failed to retry build:", error)
    }
  }

  const handleCancelBuild = async (buildId) => {
    try {
      // Mock cancel
      const updatedBuilds = builds.map(b => (b.id === buildId ? { ...b, status: "canceled" } : b))
      setBuilds(updatedBuilds)
    } catch (error) {
      console.error("Failed to cancel build:", error)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      success: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", badge: "success" },
      failed: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", badge: "destructive" },
      building: { icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10", badge: "secondary" },
      pending: { icon: Clock, color: "text-gray-500", bg: "bg-gray-500/10", badge: "outline" },
      canceled: { icon: Pause, color: "text-yellow-500", bg: "bg-yellow-500/10", badge: "outline" },
    }
    return configs[status] || configs.pending
  }

  const filteredBuilds = builds.filter((b) => {
    const matchesStatus = filter === "all" || b.status === filter
    const matchesSearch =
      b.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.commit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const analyticsData = [
    { day: "Mon", successful: 5, failed: 1, duration: 240 },
    { day: "Tue", successful: 7, failed: 2, duration: 210 },
    { day: "Wed", successful: 6, failed: 0, duration: 195 },
    { day: "Thu", successful: 8, failed: 1, duration: 220 },
    { day: "Fri", successful: 9, failed: 2, duration: 240 },
    { day: "Sat", successful: 3, failed: 0, duration: 180 },
    { day: "Sun", successful: 4, failed: 1, duration: 200 },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Builds & CI/CD</h1>
          <p className="text-muted-foreground">Manage your build pipelines, logs, and deployment hooks</p>
        </div>
        <Dialog open={showNewBuild} onOpenChange={setShowNewBuild}>
          <DialogTrigger asChild>
            <Button>
              <Zap className="w-4 h-4 mr-2" /> New Build
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Trigger New Build</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Branch</Label>
                <Input
                  value={newBuild.branch}
                  onChange={(e) => setNewBuild({ ...newBuild, branch: e.target.value })}
                  placeholder="main"
                />
              </div>
              <div className="space-y-2">
                <Label>Install Command</Label>
                <Input
                  value={newBuild.installCommand}
                  onChange={(e) => setNewBuild({ ...newBuild, installCommand: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Build Command</Label>
                <Input
                  value={newBuild.buildCommand}
                  onChange={(e) => setNewBuild({ ...newBuild, buildCommand: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Environment</Label>
                <select className="w-full border rounded px-3 py-2 bg-background">
                  <option>production</option>
                  <option>staging</option>
                  <option>development</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowNewBuild(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBuild} disabled={loading}>
                {loading ? "Building..." : "Trigger Build"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Builds</p>
                <p className="text-2xl font-bold mt-2">{builds.length}</p>
              </div>
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold mt-2">
                  {((builds.filter(b => b.status === "success").length / builds.length) * 100).toFixed(0)}%
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold mt-2">
                  {Math.round(builds.reduce((s, b) => s + (b.duration || 0), 0) / builds.filter(b => b.duration).length)}s
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
                <p className="text-2xl font-bold mt-2">78%</p>
              </div>
              <Code2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="builds" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builds">Builds</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="hooks">Hooks</TabsTrigger>
        </TabsList>

        <TabsContent value="builds" className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Search by branch, commit, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="border rounded-lg px-4 py-2 bg-background"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="building">Building</option>
            </select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Build History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Commit</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBuilds.map((build) => {
                      const config = getStatusConfig(build.status)
                      const StatusIcon = config.icon
                      return (
                        <TableRow key={build.id}>
                          <TableCell>
                            <div className={`p-2 rounded-lg w-fit ${config.bg}`}>
                              <StatusIcon className={`w-4 h-4 ${config.color}`} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{build.branch}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{build.commit.substring(0, 7)}</TableCell>
                          <TableCell>{build.author}</TableCell>
                          <TableCell>{build.duration ? `${build.duration}s` : "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{build.trigger}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(build.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewLogs(build)}
                                title="View logs"
                              >
                                <Terminal className="w-4 h-4" />
                              </Button>
                              {build.status === "failed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRetryBuild(build.id)}
                                  title="Retry build"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              )}
                              {build.status === "building" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelBuild(build.id)}
                                  title="Cancel build"
                                >
                                  <Pause className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Build Performance (7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="successful" stroke="#10b981" name="Successful" />
                    <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" />
                    <Line type="monotone" dataKey="duration" stroke="#3b82f6" name="Avg Duration (s)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Success Rate by Branch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {["main", "develop", "feature/dashboard"].map((branch) => (
                  <div key={branch} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm">{branch}</div>
                      <div className="text-xs text-muted-foreground">12 builds</div>
                    </div>
                    <Badge>95%</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Build Time Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-2">Average build time: 4m 12s</div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: "65%" }} />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Fastest build: 2m 30s</div>
                  <div className="text-xs text-muted-foreground">main branch</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Build Hooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {["pre-build", "post-build", "pre-deploy", "post-deploy"].map((hookType) => (
                <div key={hookType} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="font-semibold capitalize">{hookType}</Label>
                    <Button size="sm" variant="outline">
                      Add Hook
                    </Button>
                  </div>
                  <Textarea placeholder={`${hookType} command...`} rows={3} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showBuildDetails} onOpenChange={setShowBuildDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Build Logs - {selectedBuild?.branch}</DialogTitle>
          </DialogHeader>
          <div className="bg-muted/50 p-4 rounded-lg font-mono text-xs leading-relaxed max-h-96 overflow-auto space-y-1">
            {buildLogs.map((log, idx) => (
              <div key={idx} className={log.level === "success" ? "text-green-500" : "text-foreground"}>
                <span className="text-muted-foreground">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
            <Button onClick={() => setShowBuildDetails(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
