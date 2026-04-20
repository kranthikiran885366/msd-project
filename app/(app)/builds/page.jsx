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
import apiClient from "@/lib/api-client"

export default function BuildsPage() {
  const [projectId, setProjectId] = useState("")
  const [builds, setBuilds] = useState([])
  const [selectedBuild, setSelectedBuild] = useState(null)
  const [showNewBuild, setShowNewBuild] = useState(false)
  const [showBuildDetails, setShowBuildDetails] = useState(false)
  const [buildLogs, setBuildLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const [newBuild, setNewBuild] = useState({
    branch: "main",
    buildCommand: "npm run build",
    installCommand: "npm install",
    environment: "production",
  })

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    const activeProjectId = user?.currentProjectId || localStorage.getItem("currentProjectId")
    setProjectId(activeProjectId || "")
  }, [])

  useEffect(() => {
    if (!projectId) {
      setBuilds([])
      return
    }

    fetchBuilds()
    const interval = setInterval(fetchBuilds, 30000)
    return () => clearInterval(interval)
  }, [projectId])

  const fetchBuilds = async () => {
    if (!projectId) return

    try {
      setError("")
      const response = await apiClient.getBuilds(projectId, { limit: 100 })
      const buildList = response?.builds || response?.data?.builds || []
      const normalizedBuilds = buildList.map((build) => ({
        ...build,
        id: build._id || build.id,
        commit: build.commit || build.commitSha || "-",
        status: ["running", "building", "installing", "packaging", "docker_building", "docker_running"].includes(build.status)
          ? "building"
          : build.status === "queued"
            ? "pending"
            : build.status,
        duration: build.duration ? Math.round(build.duration / 1000) : null,
        author: build.author || "System",
      }))
      setBuilds(normalizedBuilds)
    } catch (error) {
      console.error("Failed to fetch builds:", error)
      setError(error.message || "Failed to load builds")
    }
  }

  const handleCreateBuild = async () => {
    if (!projectId) {
      setError("Please select a project first")
      return
    }

    setLoading(true)
    try {
      setError("")
      await apiClient.createBuild(projectId, {
        branch: newBuild.branch,
        buildConfig: {
          buildCommand: newBuild.buildCommand,
          installCommand: newBuild.installCommand,
          environment: newBuild.environment,
        },
        triggeredBy: "manual",
      })
      await fetchBuilds()
      setShowNewBuild(false)
      setNewBuild({
        branch: "main",
        buildCommand: "npm run build",
        installCommand: "npm install",
        environment: "production",
      })
      setSuccessMessage("Build triggered successfully")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      setError(error.message || "Failed to trigger build")
    } finally {
      setLoading(false)
    }
  }

  const handleViewLogs = async (build) => {
    setSelectedBuild(build)
    try {
      const response = await apiClient.getBuildLogs(projectId, build.id)
      const logs = response?.logs || response?.data?.logs || []
      setBuildLogs(
        logs.map((log) => ({
          timestamp: new Date(log.timestamp).toLocaleTimeString(),
          message: log.line,
          level: log.level,
        }))
      )
    } catch (error) {
      setBuildLogs([])
      setError(error.message || "Failed to fetch build logs")
    }
    setShowBuildDetails(true)
  }

  const handleRetryBuild = async (buildId) => {
    try {
      await apiClient.retryBuild(projectId, buildId)
      await fetchBuilds()
      setSuccessMessage("Build retry started")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Failed to retry build:", error)
      setError(error.message || "Failed to retry build")
    }
  }

  const handleCancelBuild = async (buildId) => {
    try {
      await apiClient.cancelBuild(projectId, buildId, "Canceled by user")
      await fetchBuilds()
      setSuccessMessage("Build canceled")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Failed to cancel build:", error)
      setError(error.message || "Failed to cancel build")
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

  const analyticsData = (() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const key = d.toISOString().split("T")[0]
      return {
        key,
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        successful: 0,
        failed: 0,
        durationTotal: 0,
        durationCount: 0,
      }
    })

    const dayMap = new Map(last7Days.map((entry) => [entry.key, entry]))
    for (const build of builds) {
      const key = new Date(build.createdAt).toISOString().split("T")[0]
      const dayEntry = dayMap.get(key)
      if (!dayEntry) continue
      if (build.status === "success") dayEntry.successful += 1
      if (build.status === "failed") dayEntry.failed += 1
      if (build.duration) {
        dayEntry.durationTotal += build.duration
        dayEntry.durationCount += 1
      }
    }

    return last7Days.map((entry) => ({
      day: entry.day,
      successful: entry.successful,
      failed: entry.failed,
      duration: entry.durationCount > 0 ? Math.round(entry.durationTotal / entry.durationCount) : 0,
    }))
  })()

  const branchStats = Object.entries(
    builds.reduce((acc, build) => {
      const branch = build.branch || "unknown"
      if (!acc[branch]) {
        acc[branch] = { total: 0, success: 0 }
      }
      acc[branch].total += 1
      if (build.status === "success") acc[branch].success += 1
      return acc
    }, {})
  )

  const avgDuration = builds.filter((b) => b.duration).length
    ? Math.round(builds.reduce((sum, b) => sum + (b.duration || 0), 0) / builds.filter((b) => b.duration).length)
    : 0
  const fastestBuild = builds.filter((b) => b.duration).sort((a, b) => a.duration - b.duration)[0]
  const successRate = builds.length
    ? Math.round((builds.filter((b) => b.status === "success").length / builds.length) * 100)
    : 0
  const cacheHitRate = builds.length
    ? Math.round((builds.filter((b) => b.cacheHit).length / builds.length) * 100)
    : 0

  return (
    <div className="p-6 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

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
                <select
                  className="w-full border rounded px-3 py-2 bg-background"
                  value={newBuild.environment}
                  onChange={(e) => setNewBuild({ ...newBuild, environment: e.target.value })}
                >
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
                <p className="text-2xl font-bold mt-2">{successRate}%</p>
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
                <p className="text-2xl font-bold mt-2">{avgDuration}s</p>
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
                <p className="text-2xl font-bold mt-2">{cacheHitRate}%</p>
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
                {branchStats.slice(0, 5).map(([branch, stats]) => (
                  <div key={branch} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm">{branch}</div>
                      <div className="text-xs text-muted-foreground">{stats.total} builds</div>
                    </div>
                    <Badge>{stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0}%</Badge>
                  </div>
                ))}
                {branchStats.length === 0 && <p className="text-sm text-muted-foreground">No build data yet.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Build Time Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-2">Average build time: {avgDuration}s</div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, Math.max(5, avgDuration / 6))}%` }} />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Fastest build: {fastestBuild ? `${fastestBuild.duration}s` : "-"}</div>
                  <div className="text-xs text-muted-foreground">{fastestBuild?.branch || "No data"}</div>
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
