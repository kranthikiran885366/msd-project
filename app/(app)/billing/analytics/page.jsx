"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { CreditCard, BarChart, Shield, Zap, Check } from "lucide-react"

export default function BillingAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [subscriptionId, setSubscriptionId] = useState(null)
  const [timeframe, setTimeframe] = useState("7d")
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/billing/subscription/${subscriptionId}/usage?timeframe=${timeframe}`)
      const data = await response.json()
      setAnalytics(data)
      processChartData(data)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    }
  }

  const processChartData = (data) => {
    if (!data?.breakdown) return

    const bandwidthData = Object.entries(data.breakdown.bandwidth.timeline).map(([date, value]) => ({
      date,
      bandwidth: value,
    }))

    const functionData = Object.entries(data.breakdown.functions.timeline).map(([date, value]) => ({
      date,
      functions: value,
    }))

    const storageData = Object.entries(data.breakdown.storage.timeline).map(([date, value]) => ({
      date,
      storage: value,
    }))

    // Merge all data points
    const merged = bandwidthData.map(item => ({
      ...item,
      ...functionData.find(f => f.date === item.date),
      ...storageData.find(s => s.date === item.date),
    }))

    setChartData(merged)
  }

  if (!analytics) return null

  const { current, estimated, limits } = analytics

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Usage & Analytics</h1>
        <p className="text-muted-foreground">Monitor your resource usage and costs</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Estimated Bill</p>
                <p className="text-2xl font-bold">${estimated.total.toFixed(2)}</p>
              </div>
              <BarChart className="w-8 h-8 text-primary" />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Plan</span>
                <span>${estimated.base.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-yellow-600">
                <span>Overages</span>
                <span>${estimated.overage.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Add-ons</span>
                <span>${estimated.addons.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">Bandwidth</p>
                <p className="text-2xl font-bold">{current.bandwidth.used.toFixed(1)} GB</p>
              </div>
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <Progress
              value={(current.bandwidth.percentage)}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {current.bandwidth.limit} GB limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">Function Time</p>
                <p className="text-2xl font-bold">{(current.functions.used / 1000).toFixed(1)}k ms</p>
              </div>
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <Progress
              value={current.functions.percentage}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {(limits.functions.executionTime / 1000).toFixed(1)}k ms limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">Storage</p>
                <p className="text-2xl font-bold">{current.storage.used.toFixed(1)} GB</p>
              </div>
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <Progress
              value={current.storage.percentage}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {current.storage.limit} GB limit
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">Usage Trends</h3>
            <div className="space-x-2">
              <Button
                variant={timeframe === "24h" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe("24h")}
              >
                24h
              </Button>
              <Button
                variant={timeframe === "7d" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe("7d")}
              >
                7d
              </Button>
              <Button
                variant={timeframe === "30d" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe("30d")}
              >
                30d
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Resources</TabsTrigger>
              <TabsTrigger value="bandwidth">Bandwidth</TabsTrigger>
              <TabsTrigger value="functions">Functions</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="pt-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="bandwidth"
                      stroke="#3b82f6"
                      name="Bandwidth (GB)"
                    />
                    <Line
                      type="monotone"
                      dataKey="functions"
                      stroke="#10b981"
                      name="Functions (ms)"
                    />
                    <Line
                      type="monotone"
                      dataKey="storage"
                      stroke="#6366f1"
                      name="Storage (GB)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="bandwidth" className="pt-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="bandwidth"
                      stroke="#3b82f6"
                      name="Bandwidth (GB)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="functions" className="pt-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="functions"
                      stroke="#10b981"
                      name="Functions (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="storage" className="pt-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="storage"
                      stroke="#6366f1"
                      name="Storage (GB)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Usage Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Bandwidth</span>
                  <span className="text-sm">
                    {current.bandwidth.used.toFixed(1)}/{current.bandwidth.limit} GB
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, current.bandwidth.percentage)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Function Execution</span>
                  <span className="text-sm">
                    {(current.functions.used / 1000).toFixed(1)}k/{(current.functions.limit / 1000).toFixed(1)}k ms
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, current.functions.percentage)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Storage</span>
                  <span className="text-sm">
                    {current.storage.used.toFixed(1)}/{current.storage.limit} GB
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, current.storage.percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Current Limits</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">API Rate Limit</p>
                  <p className="text-sm text-muted-foreground">
                    {limits.apiRateLimit.requestsPerSecond} req/sec
                  </p>
                </div>
                <Badge>
                  {limits.apiRateLimit.burstLimit} burst
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Team Members</p>
                  <p className="text-sm text-muted-foreground">
                    {limits.teamMembers.count === -1 ? "Unlimited" : limits.teamMembers.count} members
                  </p>
                </div>
                {limits.teamMembers.overage > 0 && (
                  <Badge variant="outline">
                    ${limits.teamMembers.overage}/extra
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Deployments</p>
                  <p className="text-sm text-muted-foreground">
                    {limits.deployments.perMonth} per month
                  </p>
                </div>
                {limits.deployments.overage > 0 && (
                  <Badge variant="outline">
                    ${limits.deployments.overage}/extra
                  </Badge>
                )}
              </div>

              {Object.entries(limits.customLimits || {}).map(([name, value]) => (
                <div key={name} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">
                      {value === -1 ? "Unlimited" : value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}