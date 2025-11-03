"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAppStore } from "@/store/use-app-store"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, AlertCircle, Clock, TrendingUp, Zap, Package, DatabaseIcon, GitBranch, Beaker, Book, Globe, Image, Cloud, Activity, Users, CreditCard, ArrowUpRight, Sparkles, BarChart3, PieChart, LineChart, Rocket, Shield, Server, Gauge, Eye, Plus, ExternalLink, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import apiClient from "@/lib/api-client"
import { QuickServicesWidget, ServiceHealthWidget, ServiceAnalyticsWidget } from "@/components/service-widgets"

export default function DashboardPage() {
  const { billing, user } = useAppStore();
  const { 
    loading,
    refreshing,
    deployments,
    projects,
    databases,
    functions,
    cronjobs,
    projectStats,
    systemHealth,
    recentActivity,
    metrics,
    refresh
  } = useDashboardData();

  const features = [
    {
      title: "Split Testing",
      description: "A/B test your deployments",
      icon: <Beaker className="w-6 h-6" />,
      href: "/split-testing",
      available: true,
    },
    {
      title: "Blueprint Templates", 
      description: "Infrastructure as code",
      icon: <Book className="w-6 h-6" />,
      href: "/blueprints",
      available: true,
    },
    {
      title: "ISR Configuration",
      description: "Incremental Static Regeneration", 
      icon: <Globe className="w-6 h-6" />,
      href: "/isr-config",
      available: true,
    },
    {
      title: "Edge Handlers",
      description: "Custom edge routing logic",
      icon: <Zap className="w-6 h-6" />,
      href: "/edge-handlers", 
      available: true,
    },
    {
      title: "Large Media CDN",
      description: "Global content delivery",
      icon: <Image className="w-6 h-6" />,
      href: "/media-cdn",
      available: true,
    },
    {
      title: "Multi-region",
      description: "Deploy to multiple regions",
      icon: <Cloud className="w-6 h-6" />,
      href: "/multi-region",
      available: true,
    },
  ]

  // Data fetching is now handled by the useDashboardData hook
  const refreshData = () => {
    refresh();
  }

  // Show loading state while data is being fetched
  if (loading && projects.length === 0 && deployments.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Loading Dashboard...</h2>
            <p className="text-muted-foreground">Fetching your project data</p>
          </div>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "Running":
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "Building":
        return <Clock className="w-4 h-4 text-blue-500" />
      case "Failed":
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 via-purple-500/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-400/10 via-emerald-500/10 to-blue-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: "1s"}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-violet-400/5 to-pink-400/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: "2s"}} />
      </div>
      
  <div className="relative p-4 md:p-6 space-y-6 md:space-y-8 max-w-7xl mx-auto z-10">
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
                    Welcome back{user?.name ? `, ${user.name}` : ""}! 👋
                  </h1>
                  <p className="text-muted-foreground text-base md:text-lg mt-1">Here's what's happening with your projects today.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button 
                variant="outline" 
                onClick={refreshData}
                disabled={refreshing}
                className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
              >
                <RefreshCw className={`w-4 h-4 group-hover:scale-110 transition-transform ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              <Button 
                asChild
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Link href="/deployments">
                  <Rocket className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  New Deployment
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <QuickActionChip icon={<Plus className="w-3 h-3" />} label="New Project" href="/projects" />
            <QuickActionChip icon={<GitBranch className="w-3 h-3" />} label="Deploy" href="/deployments" />
            <QuickActionChip icon={<DatabaseIcon className="w-3 h-3" />} label="Database" href="/databases" />
            <QuickActionChip icon={<Zap className="w-3 h-3" />} label="Function" href="/functions" />
            <QuickActionChip icon={<Globe className="w-3 h-3" />} label="Domain" href="/domains" />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg bg-gradient-to-br from-card via-card/95 to-card/80 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              title="Projects"
              value={projects.length}
              subtitle={`${projectStats?.activeFunctions || 0} active functions`}
              icon={<Package className="w-5 h-5" />}
              href="/projects"
              gradient="from-blue-500 to-cyan-500"
              trend="+12%"
              trendPositive={true}
            />
            <StatCard
              title="Deployments"
              value={deployments.length}
              subtitle={`${projectStats?.successRate || 94}% success rate`}
              icon={<Rocket className="w-5 h-5" />}
              href="/deployments"
              gradient="from-green-500 to-emerald-500"
              trend={`${projectStats?.successRate > 90 ? '+' : ''}${projectStats?.successRate - 90}%`}
              trendPositive={projectStats?.successRate > 90}
            />
            <StatCard
              title="Databases"
              value={databases.length}
              subtitle={`${cronjobs.length} scheduled jobs`}
              icon={<DatabaseIcon className="w-5 h-5" />}
              href="/databases"
              gradient="from-purple-500 to-pink-500"
              trend="+3%"
              trendPositive={true}
            />
            <StatCard
              title="System Health"
              value={`${projectStats?.uptime || 99.9}%`}
              subtitle="Uptime (30 days)"
              icon={<Shield className="w-5 h-5" />}
              href="/logs"
              gradient="from-orange-500 to-red-500"
              trend="+0.1%"
              trendPositive={true}
            />
          </div>
        )}

      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-4 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="deployments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
              <Rocket className="w-4 h-4 mr-2" />
              Deployments
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
              <Gauge className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="resources" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
              <Server className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
            <Eye className="w-4 h-4" />
            View All Metrics
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Service Widgets Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <QuickServicesWidget />
            <ServiceHealthWidget />
            <ServiceAnalyticsWidget />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-500">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  Deployment Trends
                  <Badge variant="secondary" className="ml-auto">7 Days</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto">
                      <LineChart className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Interactive Chart</p>
                      <p className="text-xs text-muted-foreground mt-1">Real-time deployment analytics</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  Recent Activity
                </CardTitle>
                <Button asChild variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-all duration-300 gap-2">
                  <Link href="/deployments">
                    View All
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl animate-pulse">
                        <div className="w-4 h-4 bg-muted rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                        <div className="w-16 h-6 bg-muted rounded"></div>
                      </div>
                    ))
                  ) : recentActivity.length > 0 ? (
                    recentActivity.slice(0, 5).map((activity, idx) => (
                      <div
                        key={activity.id || idx}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl hover:from-muted/50 hover:to-muted/30 hover:shadow-md transition-all duration-300 group cursor-pointer border border-border/30 hover:border-border/60"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="relative">
                            {getStatusIcon(activity.status)}
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-background rounded-full" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{activity.message}</div>
                            <div className="text-xs text-muted-foreground mt-1">{activity.when}</div>
                          </div>
                        </div>
                        <Badge 
                          variant={activity.status === 'Running' || activity.status === 'success' ? 'default' : activity.status === 'Building' ? 'secondary' : 'destructive'} 
                          className="ml-3 whitespace-nowrap group-hover:scale-105 transition-all duration-300 shadow-sm"
                        >
                          {activity.status || 'Active'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No recent activity</p>
                      <p className="text-xs mt-1">Deploy your first project to see activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <StatusBreakdownCard
              title="Successful"
              count={deployments.filter((d) => d.status === "Running" || d.status === "success").length}
              color="green"
              percentage={Math.round((deployments.filter((d) => d.status === "Running" || d.status === "success").length / Math.max(deployments.length, 1)) * 100)}
            />
            <StatusBreakdownCard
              title="Building"
              count={deployments.filter((d) => d.status === "Building").length}
              color="blue"
              percentage={Math.round((deployments.filter((d) => d.status === "Building").length / Math.max(deployments.length, 1)) * 100)}
            />
            <StatusBreakdownCard
              title="Failed"
              count={deployments.filter((d) => d.status === "Failed" || d.status === "failed").length}
              color="red"
              percentage={Math.round((deployments.filter((d) => d.status === "Failed" || d.status === "failed").length / Math.max(deployments.length, 1)) * 100)}
            />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card/95 to-card/80">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                    <Gauge className="w-4 h-4" />
                  </div>
                  Build Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto">
                      <PieChart className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Performance Metrics</p>
                      <p className="text-xs text-muted-foreground mt-1">Real-time build analytics</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <Card key={i} className="border-0 shadow-lg bg-gradient-to-br from-card via-card/95 to-card/80 animate-pulse">
                    <CardContent className="p-5">
                      <div className="h-4 bg-muted rounded mb-4"></div>
                      <div className="h-6 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <>
                  <MetricCard
                    title="Avg Build Time"
                    value={metrics?.buildTime?.value || '2m 34s'}
                    change={metrics?.buildTime?.change || '-12%'}
                    positive={metrics?.buildTime?.positive ?? true}
                    icon={<Clock className="w-4 h-4" />}
                  />
                  <MetricCard 
                    title="Cache Hit Rate" 
                    value={metrics?.cacheHitRate?.value || '78%'}
                    change={metrics?.cacheHitRate?.change || '+5%'}
                    positive={metrics?.cacheHitRate?.positive ?? true}
                    icon={<Zap className="w-4 h-4" />}
                  />
                  <MetricCard 
                    title="Deploy Success" 
                    value={`${projectStats?.successRate || 94}%`}
                    change={metrics?.deploySuccess?.change || '+2.1%'}
                    positive={metrics?.deploySuccess?.positive ?? true}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  />
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Available Features</h3>
              <Badge variant="secondary">6 Active</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, idx) => (
                <Link key={feature.title} href={feature.href}>
                  <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-500 cursor-pointer border-0 bg-gradient-to-br from-card via-card/95 to-card/80 group overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardContent className="p-5 relative">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                          {feature.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{feature.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant={feature.available ? "default" : "secondary"} className="text-xs">
                              {feature.available ? "Available" : "Coming Soon"}
                            </Badge>
                            <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card/95 to-card/80">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    <Server className="w-4 h-4" />
                  </div>
                  Active Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-lg"></div>
                        <div className="h-4 bg-muted rounded w-20"></div>
                      </div>
                      <div className="h-6 bg-muted rounded w-8"></div>
                    </div>
                  ))
                ) : (
                  <>
                    <ResourceItem icon={<Package className="w-4 h-4" />} label="Projects" value={projects.length} trend="+2" />
                    <ResourceItem icon={<GitBranch className="w-4 h-4" />} label="Deployments" value={deployments.length} trend="+5" />
                    <ResourceItem icon={<DatabaseIcon className="w-4 h-4" />} label="Databases" value={databases.length} trend="+1" />
                    <ResourceItem icon={<Zap className="w-4 h-4" />} label="Functions" value={functions.length} trend="+3" />
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card/95 to-card/80">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                    <Shield className="w-4 h-4" />
                  </div>
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl animate-pulse">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="flex items-center gap-3">
                        <div className="h-6 bg-muted rounded w-16"></div>
                        <div className="h-4 bg-muted rounded w-12"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  systemHealth.map((health, idx) => (
                    <HealthItem 
                      key={idx}
                      label={health.label} 
                      status={health.status} 
                      value={health.value} 
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, href, gradient, trend, trendPositive }) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full hover:shadow-xl hover:-translate-y-2 transition-all duration-500 cursor-pointer border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-sm overflow-hidden relative">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
        <CardContent className="p-5 md:p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">{title}</p>
                {trend && (
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    trendPositive 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    <TrendingUp className={`w-3 h-3 ${!trendPositive ? 'rotate-180' : ''}`} />
                    {trend}
                  </div>
                )}
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 mb-2">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {subtitle}
                </p>
              )}
            </div>
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
              {icon}
            </div>
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 group-hover:w-full`} style={{width: "60%"}} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function StatusBreakdownCard({ title, count, color, percentage }) {
  const colorClasses = {
    green: {
      bg: "bg-gradient-to-br from-green-500/20 to-green-600/10",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-200/50 dark:border-green-800/50",
      gradient: "from-green-500 to-green-600"
    },
    blue: {
      bg: "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-200/50 dark:border-blue-800/50",
      gradient: "from-blue-500 to-blue-600"
    },
    red: {
      bg: "bg-gradient-to-br from-red-500/20 to-red-600/10",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-200/50 dark:border-red-800/50",
      gradient: "from-red-500 to-red-600"
    },
  }

  const config = colorClasses[color]

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden relative">
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      <CardContent className="p-6 relative">
        <div className={`inline-flex items-center justify-center w-18 h-18 rounded-2xl ${config.bg} ${config.border} mb-4 border group-hover:scale-110 transition-transform duration-500`}>
          <span className={`text-2xl font-bold ${config.text}`}>{count}</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <Badge variant="secondary" className="text-xs">{percentage}%</Badge>
          </div>
          <p className="text-xs text-muted-foreground">deployments</p>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-1000 group-hover:animate-pulse`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCard({ title, value, change, positive, icon }) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card/95 to-card/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              {icon}
            </div>
            <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
            positive 
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-900/40" 
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/40"
          }`}>
            <TrendingUp className={`w-3 h-3 ${positive ? '' : 'rotate-180'}`} />
            {change}
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">{value}</p>
      </CardContent>
    </Card>
  )
}

function ResourceItem({ icon, label, value, trend }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-all duration-300 group cursor-pointer border border-border/20 hover:border-border/40">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:scale-110">
          {icon}
        </div>
        <span className="text-sm font-medium group-hover:text-primary transition-colors">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {trend && (
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {trend}
          </Badge>
        )}
        <span className="text-lg font-bold text-primary group-hover:scale-110 transition-transform">{value}</span>
      </div>
    </div>
  )
}

function HealthItem({ label, status, value }) {
  const statusConfig = status === "good" 
    ? { bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", icon: <CheckCircle2 className="w-3 h-3" /> }
    : { bg: "bg-yellow-100 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-400", icon: <AlertCircle className="w-3 h-3" /> }
    
  return (
    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-all duration-300 group border border-border/20 hover:border-border/40">
      <span className="text-sm font-medium group-hover:text-primary transition-colors">{label}</span>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-xs ${statusConfig.bg} ${statusConfig.text} group-hover:scale-105 transition-transform`}>
          {statusConfig.icon}
          <span className="capitalize">{status}</span>
        </div>
        <span className="text-sm text-muted-foreground font-medium">{value}</span>
      </div>
    </div>
  )
}

function QuickActionChip({ icon, label, href }) {
  return (
    <Link href={href}>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-full text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-300 cursor-pointer group border border-border/30 hover:border-border/60">
        <div className="group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        {label}
      </div>
    </Link>
  )
}