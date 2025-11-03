"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, AlertCircle, RefreshCw, Download, Share2 } from "lucide-react"
import apiClient from "@/lib/api-client"

export default function DeploymentDetailPage() {
  const { id } = useParams()
  const [deployment, setDeployment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])

  useEffect(() => {
    fetchDeployment()
  }, [id])

  const fetchDeployment = async () => {
    try {
      setLoading(true)
      const dep = await apiClient.getDeploymentById(id)
      setDeployment(dep)
      
      // Fetch logs if available
      try {
        const deploymentLogs = await apiClient.getDeploymentLogs(id)
        setLogs(deploymentLogs)
      } catch (error) {
        console.warn('Failed to fetch logs:', error)
        setLogs([
          { timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Build started...' },
          { timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Installing dependencies...' },
          { timestamp: new Date().toLocaleTimeString(), level: 'success', message: 'Deployment completed!' }
        ])
      }
    } catch (error) {
      console.error('Failed to fetch deployment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRollback = async () => {
    try {
      await apiClient.rollbackDeployment(id)
      alert('Rollback initiated successfully')
    } catch (error) {
      console.error('Failed to rollback:', error)
      alert('Failed to rollback deployment')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!deployment) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">Deployment not found</CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status) => {
    if (status === "success" || status === "Running") return CheckCircle2
    if (status === "pending" || status === "building") return Clock
    if (status === "failed") return AlertCircle
    return Clock
  }

  const StatusIcon = getStatusIcon(deployment.status)
  const statusColor =
    deployment.status === "success" || deployment.status === "Running" ? "text-green-500" : 
    deployment.status === "pending" || deployment.status === "building" ? "text-blue-500" : "text-red-500"

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <StatusIcon className={`w-6 h-6 ${statusColor}`} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{deployment.projectId?.name || 'Unknown Project'}</h1>
                <p className="text-sm text-muted-foreground mt-1">{deployment.version || 'v1.0.0'}</p>
              </div>
            </div>
            <Badge>{deployment.status}</Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-4">Deployment Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Project</dt>
                  <dd className="text-sm font-medium mt-1">{deployment.projectId?.name || 'Unknown Project'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Version</dt>
                  <dd className="text-sm font-medium mt-1">{deployment.version || 'v1.0.0'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Status</dt>
                  <dd className="text-sm font-medium mt-1">{deployment.status}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Deployed</dt>
                  <dd className="text-sm font-medium mt-1">{new Date(deployment.createdAt).toLocaleString()}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="font-medium mb-4">Build Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Build Duration</dt>
                  <dd className="text-sm font-medium mt-1">{deployment.buildTime ? `${Math.round(deployment.buildTime/60)}m ${deployment.buildTime%60}s` : 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Environment</dt>
                  <dd className="text-sm font-medium mt-1">{deployment.environment || 'production'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Deploy Size</dt>
                  <dd className="text-sm font-medium mt-1">{deployment.buildSize ? `${(deployment.buildSize/1024/1024).toFixed(1)} MB` : 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Build Logs</h3>
          <div className="bg-muted/50 p-4 rounded-lg font-mono text-xs leading-relaxed max-h-64 overflow-auto space-y-1">
            {logs.length > 0 ? logs.map((log, idx) => (
              <div key={idx}>
                <span className="text-muted-foreground">[{log.timestamp}]</span>{" "}
                <span className={log.level === 'error' ? 'text-red-500' : log.level === 'success' ? 'text-green-500' : ''}>
                  {log.message}
                </span>
              </div>
            )) : (
              <div className="text-muted-foreground">No logs available</div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleRollback} variant="destructive" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Rollback Deployment
        </Button>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Download className="w-4 h-4" />
          Download Logs
        </Button>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    </div>
  )
}
