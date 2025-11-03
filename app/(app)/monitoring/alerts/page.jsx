"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertTriangle, AlertCircle, CheckCircle, Bell, BellOff, Plus, Search, Filter, Clock, Zap, Server, Database, Globe, Activity, Settings, Trash2, Edit, Eye, MoreHorizontal } from "lucide-react"
import { useAppStore } from "@/store/use-app-store"

export default function AlertsPage() {
  const { projects } = useAppStore()
  const [alerts, setAlerts] = useState([])
  const [alertRules, setAlertRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newRule, setNewRule] = useState({
    name: "",
    metric: "response_time",
    condition: "greater_than",
    threshold: "",
    severity: "warning",
    enabled: true,
    projectId: "",
    channels: []
  })

  const alertMetrics = [
    { value: "response_time", label: "Response Time", unit: "ms" },
    { value: "error_rate", label: "Error Rate", unit: "%" },
    { value: "cpu_usage", label: "CPU Usage", unit: "%" },
    { value: "memory_usage", label: "Memory Usage", unit: "%" },
    { value: "disk_usage", label: "Disk Usage", unit: "%" },
    { value: "bandwidth", label: "Bandwidth", unit: "MB/s" },
    { value: "uptime", label: "Uptime", unit: "%" },
    { value: "request_count", label: "Request Count", unit: "req/min" }
  ]

  const conditions = [
    { value: "greater_than", label: "Greater than" },
    { value: "less_than", label: "Less than" },
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not equals" }
  ]

  const severityLevels = [
    { value: "critical", label: "Critical", color: "bg-red-500" },
    { value: "warning", label: "Warning", color: "bg-yellow-500" },
    { value: "info", label: "Info", color: "bg-blue-500" }
  ]

  const notificationChannels = [
    { value: "email", label: "Email", icon: <Bell className="w-4 h-4" /> },
    { value: "slack", label: "Slack", icon: <Zap className="w-4 h-4" /> },
    { value: "webhook", label: "Webhook", icon: <Globe className="w-4 h-4" /> },
    { value: "sms", label: "SMS", icon: <AlertCircle className="w-4 h-4" /> }
  ]

  useEffect(() => {
    loadAlertsData()
  }, [])

  const loadAlertsData = async () => {
    setLoading(true)
    
    // Simulate API calls
    setTimeout(() => {
      const mockAlerts = [
        {
          id: "alert_1",
          ruleId: "rule_1",
          ruleName: "High Response Time",
          severity: "warning",
          status: "active",
          message: "Response time exceeded 500ms threshold",
          value: 750,
          threshold: 500,
          metric: "response_time",
          projectId: projects[0]?.id || "proj_1",
          projectName: projects[0]?.name || "clouddeck-web",
          triggeredAt: new Date(Date.now() - 15 * 60 * 1000),
          acknowledgedAt: null,
          resolvedAt: null
        },
        {
          id: "alert_2",
          ruleId: "rule_2",
          ruleName: "High Error Rate",
          severity: "critical",
          status: "acknowledged",
          message: "Error rate exceeded 5% threshold",
          value: 8.5,
          threshold: 5,
          metric: "error_rate",
          projectId: projects[1]?.id || "proj_2",
          projectName: projects[1]?.name || "clouddeck-api",
          triggeredAt: new Date(Date.now() - 45 * 60 * 1000),
          acknowledgedAt: new Date(Date.now() - 30 * 60 * 1000),
          resolvedAt: null
        },
        {
          id: "alert_3",
          ruleId: "rule_3",
          ruleName: "Low Disk Space",
          severity: "warning",
          status: "resolved",
          message: "Disk usage exceeded 80% threshold",
          value: 85,
          threshold: 80,
          metric: "disk_usage",
          projectId: projects[0]?.id || "proj_1",
          projectName: projects[0]?.name || "clouddeck-web",
          triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          acknowledgedAt: new Date(Date.now() - 90 * 60 * 1000),
          resolvedAt: new Date(Date.now() - 30 * 60 * 1000)
        }
      ]

      const mockRules = [
        {
          id: "rule_1",
          name: "High Response Time",
          metric: "response_time",
          condition: "greater_than",
          threshold: 500,
          severity: "warning",
          enabled: true,
          projectId: projects[0]?.id || "proj_1",
          channels: ["email", "slack"],
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lastTriggered: new Date(Date.now() - 15 * 60 * 1000)
        },
        {
          id: "rule_2",
          name: "High Error Rate",
          metric: "error_rate",
          condition: "greater_than",
          threshold: 5,
          severity: "critical",
          enabled: true,
          projectId: projects[1]?.id || "proj_2",
          channels: ["email", "slack", "sms"],
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          lastTriggered: new Date(Date.now() - 45 * 60 * 1000)
        },
        {
          id: "rule_3",
          name: "Low Disk Space",
          metric: "disk_usage",
          condition: "greater_than",
          threshold: 80,
          severity: "warning",
          enabled: false,
          projectId: projects[0]?.id || "proj_1",
          channels: ["email"],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ]

      setAlerts(mockAlerts)
      setAlertRules(mockRules)
      setLoading(false)
    }, 1000)
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || alert.status === filterStatus
    const matchesSeverity = filterSeverity === "all" || alert.severity === filterSeverity
    return matchesSearch && matchesStatus && matchesSeverity
  })

  const getAlertIcon = (severity) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case "info":
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      active: "destructive",
      acknowledged: "secondary",
      resolved: "default"
    }
    return <Badge variant={variants[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.threshold || !newRule.projectId) return

    const rule = {
      id: `rule_${Date.now()}`,
      ...newRule,
      threshold: parseFloat(newRule.threshold),
      createdAt: new Date(),
      lastTriggered: null
    }

    setAlertRules(prev => [rule, ...prev])
    setNewRule({
      name: "",
      metric: "response_time",
      condition: "greater_than",
      threshold: "",
      severity: "warning",
      enabled: true,
      projectId: "",
      channels: []
    })
    setShowCreateDialog(false)
  }

  const toggleRule = (ruleId) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ))
  }

  const acknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: "acknowledged", acknowledgedAt: new Date() } : alert
    ))
  }

  const resolveAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: "resolved", resolvedAt: new Date() } : alert
    ))
  }

  const deleteRule = (ruleId) => {
    setAlertRules(prev => prev.filter(rule => rule.id !== ruleId))
  }

  const alertStats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === "active").length,
    acknowledged: alerts.filter(a => a.status === "acknowledged").length,
    resolved: alerts.filter(a => a.status === "resolved").length
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alert Management</h1>
          <p className="text-muted-foreground">Monitor and manage system alerts and notification rules</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Alert Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Alert Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Rule Name</label>
                  <Input
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="High CPU Usage"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Project</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newRule.projectId}
                    onChange={(e) => setNewRule(prev => ({ ...prev, projectId: e.target.value }))}
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Metric</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newRule.metric}
                    onChange={(e) => setNewRule(prev => ({ ...prev, metric: e.target.value }))}
                  >
                    {alertMetrics.map(metric => (
                      <option key={metric.value} value={metric.value}>{metric.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Condition</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newRule.condition}
                    onChange={(e) => setNewRule(prev => ({ ...prev, condition: e.target.value }))}
                  >
                    {conditions.map(condition => (
                      <option key={condition.value} value={condition.value}>{condition.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Threshold</label>
                  <Input
                    type="number"
                    value={newRule.threshold}
                    onChange={(e) => setNewRule(prev => ({ ...prev, threshold: e.target.value }))}
                    placeholder="500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newRule.severity}
                    onChange={(e) => setNewRule(prev => ({ ...prev, severity: e.target.value }))}
                  >
                    {severityLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Notification Channels</label>
                  <div className="flex gap-2 mt-1">
                    {notificationChannels.map(channel => (
                      <Button
                        key={channel.value}
                        variant={newRule.channels.includes(channel.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const channels = newRule.channels.includes(channel.value)
                            ? newRule.channels.filter(c => c !== channel.value)
                            : [...newRule.channels, channel.value]
                          setNewRule(prev => ({ ...prev, channels }))
                        }}
                      >
                        {channel.icon}
                        {channel.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newRule.enabled}
                  onCheckedChange={(enabled) => setNewRule(prev => ({ ...prev, enabled }))}
                />
                <label className="text-sm font-medium">Enable rule</label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateRule}>Create Rule</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{alertStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-red-600">{alertStats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acknowledged</p>
                <p className="text-2xl font-bold text-yellow-600">{alertStats.acknowledged}</p>
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
                <p className="text-2xl font-bold text-green-600">{alertStats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search alerts..."
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
                  <option value="active">Active</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="resolved">Resolved</option>
                </select>
                <select
                  className="p-2 border rounded-md"
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                >
                  <option value="all">All Severity</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <div className="space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))
            ) : filteredAlerts.length > 0 ? (
              filteredAlerts.map(alert => (
                <Card key={alert.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {getAlertIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{alert.ruleName}</h3>
                            {getStatusBadge(alert.status)}
                            <Badge variant="outline">{alert.projectName}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Value: {alert.value}{alertMetrics.find(m => m.value === alert.metric)?.unit}</span>
                            <span>Threshold: {alert.threshold}{alertMetrics.find(m => m.value === alert.metric)?.unit}</span>
                            <span>Triggered: {alert.triggeredAt.toLocaleString()}</span>
                            {alert.acknowledgedAt && (
                              <span>Acknowledged: {alert.acknowledgedAt.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {alert.status === "active" && (
                          <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                            Acknowledge
                          </Button>
                        )}
                        {alert.status !== "resolved" && (
                          <Button size="sm" onClick={() => resolveAlert(alert.id)}>
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
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No alerts found</h3>
                  <p className="text-muted-foreground">No alerts match your current filters.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="space-y-3">
            {alertRules.map(rule => (
              <Card key={rule.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                        {rule.enabled ? (
                          <Bell className="w-4 h-4 text-green-500" />
                        ) : (
                          <BellOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <Badge variant={rule.severity === "critical" ? "destructive" : rule.severity === "warning" ? "secondary" : "default"}>
                            {rule.severity}
                          </Badge>
                          <Badge variant="outline">
                            {projects.find(p => p.id === rule.projectId)?.name || "Unknown Project"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alertMetrics.find(m => m.value === rule.metric)?.label} {conditions.find(c => c.value === rule.condition)?.label.toLowerCase()} {rule.threshold}{alertMetrics.find(m => m.value === rule.metric)?.unit}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Channels: {rule.channels.join(", ")}</span>
                          <span>Created: {rule.createdAt.toLocaleDateString()}</span>
                          {rule.lastTriggered && (
                            <span>Last triggered: {rule.lastTriggered.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteRule(rule.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.severity)}
                      <div>
                        <p className="font-medium">{alert.ruleName}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(alert.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.triggeredAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}