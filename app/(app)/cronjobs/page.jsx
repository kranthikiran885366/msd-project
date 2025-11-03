"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Play, Power, Trash2, Calendar, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import apiClient from "@/lib/api-client"

export default function CronPage() {
  const [cronjobs, setCronjobs] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [name, setName] = useState("")
  const [schedule, setSchedule] = useState("0 0 * * *")
  const [target, setTarget] = useState("/api/cleanup")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchCronJobs()
    }
  }, [selectedProject])

  const fetchProjects = async () => {
    try {
      const response = await apiClient.getProjects()
      setProjects(response || [])
      if (response?.length > 0 && !selectedProject) {
        setSelectedProject(response[0]._id)
      }
    } catch (err) {
      setError('Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  const fetchCronJobs = async () => {
    if (!selectedProject) return
    
    try {
      setError('')
      const response = await apiClient.getCronJobs(selectedProject)
      setCronjobs(response || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch cron jobs')
    }
  }

  const handleCreateCronJob = async () => {
    if (!name.trim() || !target.trim() || !selectedProject) return
    
    setCreating(true)
    try {
      setError('')
      const cronJobData = {
        name: name.trim(),
        schedule,
        target: target.trim(),
      }
      
      await apiClient.createCronJob(selectedProject, cronJobData)
      setSuccessMessage('Cron job created successfully!')
      setName("")
      setSchedule("0 0 * * *")
      setTarget("/api/cleanup")
      await fetchCronJobs()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to create cron job')
    } finally {
      setCreating(false)
    }
  }

  const handleRunCronJob = async (cronJobId) => {
    try {
      setError('')
      await apiClient.runCronJob(cronJobId)
      setSuccessMessage('Cron job executed successfully!')
      await fetchCronJobs()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to run cron job')
    }
  }

  const handleToggleCronJob = async (cronJobId, enabled) => {
    try {
      setError('')
      await apiClient.updateCronJob(cronJobId, { enabled: !enabled })
      setSuccessMessage(`Cron job ${enabled ? 'disabled' : 'enabled'} successfully!`)
      await fetchCronJobs()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to toggle cron job')
    }
  }

  const handleDeleteCronJob = async (cronJobId) => {
    if (!confirm('Are you sure you want to delete this cron job?')) return
    
    try {
      setError('')
      await apiClient.deleteCronJob(cronJobId)
      setSuccessMessage('Cron job deleted successfully!')
      await fetchCronJobs()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete cron job')
    }
  }

  const schedulePresets = {
    "0 0 * * *": "Daily at midnight UTC",
    "0 */6 * * *": "Every 6 hours",
    "0 0 * * 0": "Weekly on Sunday",
    "0 0 1 * *": "Monthly on the 1st",
    "*/5 * * * *": "Every 5 minutes",
    "0 9 * * 1-5": "Weekdays at 9 AM UTC",
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Cron Jobs</h1>
        <p className="text-muted-foreground">Schedule and manage background jobs</p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Project Selector */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Select Project</h3>
          <select
            className="border rounded-lg px-4 py-2 w-full bg-background"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Select a project...</option>
            {projects.map(project => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedProject && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Schedule Cron Job</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="text-sm font-medium">Job Name</label>
                <input
                  className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                  placeholder="cleanup"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Schedule</label>
                <select
                  className="border rounded-lg px-4 py-2 w-full mt-2 bg-background font-mono text-sm"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                >
                  {Object.entries(schedulePresets).map(([cron, desc]) => (
                    <option key={cron} value={cron}>
                      {desc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Target</label>
                <input
                  className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                  placeholder="/api/handler"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreateCronJob} disabled={creating || !selectedProject} className="w-full">
                  {creating ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {cronjobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No cron jobs scheduled</p>
              <p className="text-sm mt-2">Create a cron job to automate tasks</p>
            </CardContent>
          </Card>
        ) : (
          cronjobs.map((c) => (
            <Card key={c._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-muted rounded">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{c.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{schedulePresets[c.schedule] || c.schedule}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{c.target}</p>
                    </div>
                  </div>
                  <Badge variant={c.enabled ? "default" : "secondary"}>{c.enabled ? "Active" : "Inactive"}</Badge>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 py-3 border-y">
                  <div>
                    <div className="text-xs text-muted-foreground">Last Run</div>
                    <div className="text-sm font-semibold">
                      {c.lastRunAt ? new Date(c.lastRunAt).toLocaleString() : "Never"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="text-sm font-semibold">
                      {c.lastRunStatus ? c.lastRunStatus : "Not run"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Failures</div>
                    <div className="text-lg font-semibold text-red-600">{c.failureCount || 0}</div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => handleRunCronJob(c._id)} className="gap-1">
                    <Play className="w-4 h-4" />
                    Run Now
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleToggleCronJob(c._id, c.enabled)} className="gap-1">
                    <Power className="w-4 h-4" />
                    {c.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCronJob(c._id)} className="text-destructive hover:bg-destructive/10 ml-auto">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
