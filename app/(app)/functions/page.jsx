"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Power, Copy, Trash2, Code, Clock, Zap, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import apiClient from "@/lib/api-client"

export default function FunctionsPage() {
  const [functions, setFunctions] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [name, setName] = useState("")
  const [path, setPath] = useState("/api/hello")
  const [runtime, setRuntime] = useState("node20")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchFunctions()
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

  const fetchFunctions = async () => {
    if (!selectedProject) return
    
    try {
      setError('')
      const response = await apiClient.getFunctions(selectedProject)
      setFunctions(response || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch functions')
    }
  }

  const handleCreateFunction = async () {
    if (!name.trim() || !path.trim() || !selectedProject) return
    
    setCreating(true)
    try {
      setError('')
      const functionData = {
        name: name.trim(),
        path: path.trim(),
        runtime,
        handler: 'index.handler',
        code: `exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello from ${name}!' })
  }
}`,
        memory: 256,
        timeout: 30,
        enabled: true
      }
      
      await apiClient.createFunction(selectedProject, functionData)
      setSuccessMessage('Function created successfully!')
      setName("")
      setPath("/api/hello")
      await fetchFunctions()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to create function')
    } finally {
      setCreating(false)
    }
  }

  const handleInvokeFunction = async (functionId) => {
    try {
      setError('')
      await apiClient.invokeFunction(functionId)
      setSuccessMessage('Function invoked successfully!')
      await fetchFunctions()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to invoke function')
    }
  }

  const handleToggleFunction = async (functionId, enabled) => {
    try {
      setError('')
      await apiClient.toggleFunction(functionId, !enabled)
      setSuccessMessage(`Function ${enabled ? 'disabled' : 'enabled'} successfully!`)
      await fetchFunctions()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to toggle function')
    }
  }

  const handleDeleteFunction = async (functionId) => {
    if (!confirm('Are you sure you want to delete this function?')) return
    
    try {
      setError('')
      await apiClient.deleteFunction(functionId)
      setSuccessMessage('Function deleted successfully!')
      await fetchFunctions()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete function')
    }
  }

  const runtimeConfig = {
    node18: { label: "Node.js", version: "18.x", color: "bg-green-500" },
    node20: { label: "Node.js", version: "20.x", color: "bg-green-600" },
    python39: { label: "Python", version: "3.9", color: "bg-blue-500" },
    python311: { label: "Python", version: "3.11", color: "bg-blue-600" },
    "go1.21": { label: "Go", version: "1.21", color: "bg-cyan-500" },
    "ruby3.2": { label: "Ruby", version: "3.2", color: "bg-red-500" },
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
        <h1 className="text-3xl font-bold mb-2">Serverless Functions</h1>
        <p className="text-muted-foreground">Deploy and manage serverless functions</p>
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
            <h3 className="font-semibold mb-4">Deploy Serverless Function</h3>
            <div className="grid gap-4 sm:grid-cols-5">
              <div>
                <label className="text-sm font-medium">Function Name</label>
                <input
                  className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                  placeholder="my-function"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Path</label>
                <input
                  className="border rounded-lg px-4 py-2 w-full mt-2 bg-background font-mono text-sm"
                  placeholder="/api/handler"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Runtime</label>
                <select
                  className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                  value={runtime}
                  onChange={(e) => setRuntime(e.target.value)}
                >
                  <option value="node20">Node.js 20.x</option>
                  <option value="node18">Node.js 18.x</option>
                  <option value="python311">Python 3.11</option>
                  <option value="python39">Python 3.9</option>
                  <option value="go1.21">Go 1.21</option>
                  <option value="ruby3.2">Ruby 3.2</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreateFunction} disabled={creating || !selectedProject} className="w-full">
                  {creating ? "Deploying..." : "Deploy"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {functions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Code className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No functions deployed yet</p>
              <p className="text-sm mt-2">Deploy a serverless function to get started</p>
            </CardContent>
          </Card>
        ) : (
          functions.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-muted rounded">
                      <Code className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{f.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{f.path}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={f.enabled ? "default" : "secondary"}>{f.enabled ? "Enabled" : "Disabled"}</Badge>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 py-3 border-y">
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Invocations
                    </div>
                    <div className="text-lg font-semibold">{f.invocations || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Avg Duration
                    </div>
                    <div className="text-lg font-semibold">{f.averageExecutionTime || 0}ms</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Last Run</div>
                    <div className="text-sm font-semibold">
                      {f.lastRunAt ? new Date(f.lastRunAt).toLocaleTimeString() : "Never"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => handleInvokeFunction(f._id)} className="gap-1">
                    <Play className="w-4 h-4" />
                    Invoke
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleToggleFunction(f._id, f.enabled)} className="gap-1">
                    <Power className="w-4 h-4" />
                    {f.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                    <Copy className="w-4 h-4" />
                    Logs
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteFunction(f._id)} className="text-destructive hover:bg-destructive/10 ml-auto">
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
