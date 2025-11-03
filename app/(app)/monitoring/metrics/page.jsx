"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, TrendingUp, TrendingDown, Zap, Server, Database, Globe, Clock, Users, BarChart3, LineChart, PieChart, RefreshCw } from "lucide-react"
import apiClient from "@/lib/api-client"

export default function MetricsPage() {
  const [metrics, setMetrics] = useState({})
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("24h")
  const [selectedProject, setSelectedProject] = useState("all")
  const [projects, setProjects] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadMetrics()
    loadProjects()
  }, [timeRange, selectedProject])

  const loadProjects = async () => {
    try {
      const data = await apiClient.get('/projects')
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Failed to load projects:', error)
      setProjects([
        { id: "proj_1", name: "clouddeck-web" },
        { id: "proj_2", name: "clouddeck-api" }
      ])
    }
  }

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const params = { timeRange, projectId: selectedProject !== "all" ? selectedProject : undefined }
      const data = await apiClient.get('/metrics', { params })
      setMetrics(data.metrics || {})
    } catch (error) {
      console.error('Failed to load metrics:', error)
      // Mock data fallback
      setMetrics({
        performance: {
          responseTime: { value: 245, change: -12, unit: "ms" },
          throughput: { value: 1250, change: 8, unit: "req/min" },
          errorRate: { value: 0.8, change: -0.3, unit: "%" },
          uptime: { value: 99.9, change: 0.1, unit: "%" }
        },
        resources: {
          cpuUsage: { value: 45, change: 5, unit: "%" },
          memoryUsage: { value: 68, change: -2, unit: "%" },
          diskUsage: { value: 32, change: 1, unit: "%" },
          networkIO: { value: 125, change: 15, unit: "MB/s" }
        },
        database: {
          connections: { value: 45, change: 3, unit: "" },
          queryTime: { value: 85, change: -8, unit: "ms" },
          cacheHitRate: { value: 94, change: 2, unit: "%" },
          diskIO: { value: 15, change: -5, unit: "MB/s" }
        },
        business: {
          activeUsers: { value: 1250, change: 120, unit: "" },
          pageViews: { value: 15600, change: 850, unit: "" },
          conversionRate: { value: 3.2, change: 0.4, unit: "%" },
          revenue: { value: 12500, change: 1200, unit: "$" }
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshMetrics = async () => {
    setRefreshing(true)
    await loadMetrics()
    setRefreshing(false)
  }

  const MetricCard = ({ title, value, change, unit, icon, color = "blue" }) => {
    const isPositive = change > 0
    const colorClasses = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      orange: "bg-orange-100 text-orange-600",
      purple: "bg-purple-100 text-purple-600"
    }

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              {icon}
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isPositive 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(change)}{unit}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}{unit}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ChartPlaceholder = ({ title, type, height = "300px" }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {type === "line" && <LineChart className="w-5 h-5" />}
          {type === "bar" && <BarChart3 className="w-5 h-5" />}
          {type === "pie" && <PieChart className="w-5 h-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted"
          style={{ height }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
              {type === "line" && <LineChart className="w-8 h-8 text-muted-foreground" />}
              {type === "bar" && <BarChart3 className="w-8 h-8 text-muted-foreground" />}
              {type === "pie" && <PieChart className="w-8 h-8 text-muted-foreground" />}
            </div>
            <p className="text-muted-foreground font-medium">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">Interactive chart will be displayed here</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Metrics</h1>
          <p className="text-muted-foreground">Monitor performance and resource utilization</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={refreshMetrics}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <MetricCard
                  title="Response Time"
                  value={metrics.performance?.responseTime?.value || 0}
                  change={metrics.performance?.responseTime?.change || 0}
                  unit={metrics.performance?.responseTime?.unit || "ms"}
                  icon={<Clock className="w-5 h-5" />}
                  color="blue"
                />
                <MetricCard
                  title="Throughput"
                  value={metrics.performance?.throughput?.value || 0}
                  change={metrics.performance?.throughput?.change || 0}
                  unit={metrics.performance?.throughput?.unit || "req/min"}
                  icon={<Activity className="w-5 h-5" />}
                  color="green"
                />
                <MetricCard
                  title="Error Rate"
                  value={metrics.performance?.errorRate?.value || 0}
                  change={metrics.performance?.errorRate?.change || 0}
                  unit={metrics.performance?.errorRate?.unit || "%"}
                  icon={<TrendingDown className="w-5 h-5" />}
                  color="orange"
                />
                <MetricCard
                  title="Uptime"
                  value={metrics.performance?.uptime?.value || 0}
                  change={metrics.performance?.uptime?.change || 0}
                  unit={metrics.performance?.uptime?.unit || "%"}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="purple"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <ChartPlaceholder title="Response Time Trend" type="line" />
            <ChartPlaceholder title="Request Volume" type="bar" />
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <MetricCard
                  title="CPU Usage"
                  value={metrics.resources?.cpuUsage?.value || 0}
                  change={metrics.resources?.cpuUsage?.change || 0}
                  unit={metrics.resources?.cpuUsage?.unit || "%"}
                  icon={<Server className="w-5 h-5" />}
                  color="blue"
                />
                <MetricCard
                  title="Memory Usage"
                  value={metrics.resources?.memoryUsage?.value || 0}
                  change={metrics.resources?.memoryUsage?.change || 0}
                  unit={metrics.resources?.memoryUsage?.unit || "%"}
                  icon={<Activity className="w-5 h-5" />}
                  color="green"
                />
                <MetricCard
                  title="Disk Usage"
                  value={metrics.resources?.diskUsage?.value || 0}
                  change={metrics.resources?.diskUsage?.change || 0}
                  unit={metrics.resources?.diskUsage?.unit || "%"}
                  icon={<Database className="w-5 h-5" />}
                  color="orange"
                />
                <MetricCard
                  title="Network I/O"
                  value={metrics.resources?.networkIO?.value || 0}
                  change={metrics.resources?.networkIO?.change || 0}
                  unit={metrics.resources?.networkIO?.unit || "MB/s"}
                  icon={<Globe className="w-5 h-5" />}
                  color="purple"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <ChartPlaceholder title="Resource Utilization" type="line" />
            <ChartPlaceholder title="Resource Distribution" type="pie" />
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <MetricCard
                  title="Active Connections"
                  value={metrics.database?.connections?.value || 0}
                  change={metrics.database?.connections?.change || 0}
                  unit={metrics.database?.connections?.unit || ""}
                  icon={<Users className="w-5 h-5" />}
                  color="blue"
                />
                <MetricCard
                  title="Query Time"
                  value={metrics.database?.queryTime?.value || 0}
                  change={metrics.database?.queryTime?.change || 0}
                  unit={metrics.database?.queryTime?.unit || "ms"}
                  icon={<Clock className="w-5 h-5" />}
                  color="green"
                />
                <MetricCard
                  title="Cache Hit Rate"
                  value={metrics.database?.cacheHitRate?.value || 0}
                  change={metrics.database?.cacheHitRate?.change || 0}
                  unit={metrics.database?.cacheHitRate?.unit || "%"}
                  icon={<Zap className="w-5 h-5" />}
                  color="orange"
                />
                <MetricCard
                  title="Disk I/O"
                  value={metrics.database?.diskIO?.value || 0}
                  change={metrics.database?.diskIO?.change || 0}
                  unit={metrics.database?.diskIO?.unit || "MB/s"}
                  icon={<Database className="w-5 h-5" />}
                  color="purple"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <ChartPlaceholder title="Database Performance" type="line" />
            <ChartPlaceholder title="Query Distribution" type="bar" />
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <MetricCard
                  title="Active Users"
                  value={metrics.business?.activeUsers?.value || 0}
                  change={metrics.business?.activeUsers?.change || 0}
                  unit={metrics.business?.activeUsers?.unit || ""}
                  icon={<Users className="w-5 h-5" />}
                  color="blue"
                />
                <MetricCard
                  title="Page Views"
                  value={metrics.business?.pageViews?.value || 0}
                  change={metrics.business?.pageViews?.change || 0}
                  unit={metrics.business?.pageViews?.unit || ""}
                  icon={<Activity className="w-5 h-5" />}
                  color="green"
                />
                <MetricCard
                  title="Conversion Rate"
                  value={metrics.business?.conversionRate?.value || 0}
                  change={metrics.business?.conversionRate?.change || 0}
                  unit={metrics.business?.conversionRate?.unit || "%"}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="orange"
                />
                <MetricCard
                  title="Revenue"
                  value={metrics.business?.revenue?.value || 0}
                  change={metrics.business?.revenue?.change || 0}
                  unit={metrics.business?.revenue?.unit || "$"}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="purple"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <ChartPlaceholder title="User Activity" type="line" />
            <ChartPlaceholder title="Revenue Breakdown" type="pie" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}