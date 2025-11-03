"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, AlertCircle, CheckCircle, Clock, Plus, Search, Eye, MessageSquare, Users, Activity, TrendingUp, Calendar, Filter } from "lucide-react"
import apiClient from "@/lib/api-client"

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    severity: "medium",
    status: "investigating",
    affectedServices: []
  })

  useEffect(() => {
    loadIncidents()
  }, [])

  const loadIncidents = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get('/incidents')
      setIncidents(data.incidents || [])
    } catch (error) {
      console.error('Failed to load incidents:', error)
      // Mock data fallback
      setIncidents([
        {
          id: "inc_1",
          title: "Database Connection Issues",
          description: "Users experiencing intermittent connection timeouts",
          severity: "high",
          status: "investigating",
          affectedServices: ["Database", "API"],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000),
          resolvedAt: null,
          assignedTo: "DevOps Team",
          updates: [
            {
              id: "upd_1",
              message: "Initial investigation started",
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
              author: "System"
            }
          ]
        },
        {
          id: "inc_2",
          title: "High Response Times",
          description: "API response times elevated across all endpoints",
          severity: "medium",
          status: "monitoring",
          affectedServices: ["API", "Frontend"],
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          resolvedAt: null,
          assignedTo: "Backend Team",
          updates: [
            {
              id: "upd_2",
              message: "Scaling up backend instances",
              timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
              author: "DevOps"
            }
          ]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const createIncident = async () => {
    try {
      const incident = {
        ...newIncident,
        id: `inc_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        updates: []
      }
      
      await apiClient.post('/incidents', incident)
      setIncidents(prev => [incident, ...prev])
      setNewIncident({
        title: "",
        description: "",
        severity: "medium",
        status: "investigating",
        affectedServices: []
      })
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to create incident:', error)
    }
  }

  const updateIncidentStatus = async (incidentId, status) => {
    try {
      await apiClient.patch(`/incidents/${incidentId}`, { status })
      setIncidents(prev => prev.map(inc => 
        inc.id === incidentId 
          ? { ...inc, status, updatedAt: new Date(), resolvedAt: status === 'resolved' ? new Date() : null }
          : inc
      ))
    } catch (error) {
      console.error('Failed to update incident:', error)
    }
  }

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || incident.status === filterStatus
    const matchesSeverity = filterSeverity === "all" || incident.severity === filterSeverity
    return matchesSearch && matchesStatus && matchesSeverity
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case "investigating":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "monitoring":
        return <Eye className="w-4 h-4 text-yellow-500" />
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const incidentStats = {
    total: incidents.length,
    active: incidents.filter(i => i.status !== "resolved").length,
    investigating: incidents.filter(i => i.status === "investigating").length,
    resolved: incidents.filter(i => i.status === "resolved").length
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Incident Management</h1>
          <p className="text-muted-foreground">Track and manage system incidents</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newIncident.title}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the incident"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newIncident.description}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the incident"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, severity: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newIncident.status}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="investigating">Investigating</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={createIncident}>Create Incident</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Incidents</p>
                <p className="text-2xl font-bold">{incidentStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-orange-600">{incidentStats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investigating</p>
                <p className="text-2xl font-bold text-red-600">{incidentStats.investigating}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{incidentStats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              className="p-2 border rounded-md"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="investigating">Investigating</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              className="p-2 border rounded-md"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-4"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredIncidents.length > 0 ? (
          filteredIncidents.map(incident => (
            <Card key={incident.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {getStatusIcon(incident.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{incident.title}</h3>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge variant="outline">{incident.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{incident.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {incident.createdAt.toLocaleString()}</span>
                        <span>Updated: {incident.updatedAt.toLocaleString()}</span>
                        {incident.assignedTo && <span>Assigned: {incident.assignedTo}</span>}
                        {incident.affectedServices.length > 0 && (
                          <span>Services: {incident.affectedServices.join(", ")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {incident.status === "investigating" && (
                      <Button size="sm" variant="outline" onClick={() => updateIncidentStatus(incident.id, "monitoring")}>
                        Monitor
                      </Button>
                    )}
                    {incident.status !== "resolved" && (
                      <Button size="sm" onClick={() => updateIncidentStatus(incident.id, "resolved")}>
                        Resolve
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No incidents found</h3>
              <p className="text-muted-foreground">No incidents match your current filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}