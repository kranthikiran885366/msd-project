"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAppStore } from "@/store/use-app-store"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  FolderOpen, 
  Rocket, 
  Database, 
  Zap, 
  Clock, 
  Globe, 
  TestTube, 
  Layers, 
  Settings, 
  Users, 
  CreditCard, 
  FileText, 
  Activity,
  Image,
  MapPin,
  Menu,
  X,
  User,
  LogOut,
  Bell,
  Shield,
  BarChart3,
  GitBranch,
  Puzzle,
  HelpCircle,
  Server,
  Lock,
  Gauge,
  Box,
  Code2
} from "lucide-react"

const navSections = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/projects", label: "Projects", icon: FolderOpen },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/status", label: "Status", icon: Server },
    ]
  },
  {
    title: "Deploy & Build",
    items: [
      { href: "/deployments", label: "Deployments", icon: Rocket },
      { href: "/functions", label: "Functions", icon: Zap },
      { href: "/cronjobs", label: "Cron Jobs", icon: Clock },
      { href: "/builds", label: "Builds", icon: GitBranch },
      { href: "/ci-cd", label: "CI/CD", icon: GitBranch },
    ]
  },
  {
    title: "Data & Storage",
    items: [
      { href: "/databases", label: "Databases", icon: Database },
      { href: "/media-cdn", label: "Media CDN", icon: Image },
      { href: "/forms", label: "Forms", icon: Box },
    ]
  },
  {
    title: "Configuration",
    items: [
      { href: "/domains", label: "Domains", icon: Globe },
      { href: "/env", label: "Environment", icon: Settings },
      { href: "/multi-region", label: "Multi-region", icon: MapPin },
      { href: "/providers", label: "Providers", icon: Puzzle },
    ]
  },
  {
    title: "Advanced",
    items: [
      { href: "/split-testing", label: "Split Testing", icon: TestTube },
      { href: "/blueprints", label: "Blueprints", icon: Layers },
      { href: "/isr-config", label: "ISR Config", icon: Settings },
      { href: "/edge-handlers", label: "Edge Handlers", icon: Zap },
      { href: "/api-graph", label: "API Graph", icon: Code2 },
    ]
  },
  {
    title: "Integrations",
    items: [
      { href: "/integrations", label: "All Integrations", icon: Puzzle },
      { href: "/integrations/git", label: "Git Integration", icon: GitBranch },
      { href: "/integrations/webhooks", label: "Webhooks", icon: Activity },
      { href: "/integrations/grafana", label: "Grafana", icon: BarChart3 },
      { href: "/integrations/prometheus", label: "Prometheus", icon: BarChart3 },
      { href: "/integrations/datadog", label: "Datadog", icon: Activity },
      { href: "/integrations/newrelic", label: "New Relic", icon: BarChart3 },
      { href: "/integrations/custom", label: "Custom", icon: Puzzle },
    ]
  },
  {
    title: "Security & Access",
    items: [
      { href: "/auth/ldap", label: "LDAP", icon: Lock },
      { href: "/auth/saml", label: "SAML", icon: Lock },
      { href: "/auth/sso", label: "SSO", icon: Lock },
      { href: "/auth/webauthn", label: "WebAuthn", icon: Lock },
      { href: "/auth/mfa-setup", label: "MFA Setup", icon: Lock },
      { href: "/ssh-access", label: "SSH Access", icon: Lock },
      { href: "/team/roles", label: "Roles", icon: Shield },
    ]
  },
  {
    title: "Monitoring & Alerts",
    items: [
      { href: "/logs", label: "Logs", icon: FileText },
      { href: "/monitoring/alerts", label: "Alerts", icon: Activity },
      { href: "/deployments/alerts", label: "Deployment Alerts", icon: Rocket },
      { href: "/deployments/incidents", label: "Incidents", icon: Activity },
      { href: "/deployments/uptime", label: "Uptime", icon: Gauge },
    ]
  },
  {
    title: "Admin",
    items: [
      { href: "/admin", label: "Admin Panel", icon: Shield },
      { href: "/admin/monitoring", label: "System Health", icon: Server },
      { href: "/admin/team", label: "Admin Team", icon: Users },
      { href: "/admin/audit", label: "Audit Logs", icon: FileText },
      { href: "/admin/settings", label: "Admin Settings", icon: Settings },
      { href: "/admin/security", label: "Security", icon: Lock },
      { href: "/admin/compliance", label: "Compliance", icon: Shield },
      { href: "/admin/costs", label: "Costs", icon: CreditCard },
    ]
  },
  {
    title: "Team & Billing",
    items: [
      { href: "/team", label: "Team", icon: Users },
      { href: "/team/members", label: "Members", icon: Users },
      { href: "/team/invitations", label: "Invitations", icon: Users },
      { href: "/team/groups", label: "Groups", icon: Users },
      { href: "/team/organization", label: "Organization", icon: Users },
      { href: "/team/sso", label: "Team SSO", icon: Lock },
      { href: "/team/api-keys", label: "API Keys", icon: Code2 },
      { href: "/billing", label: "Billing", icon: CreditCard },
      { href: "/billing/invoices", label: "Invoices", icon: FileText },
      { href: "/billing/payment-methods", label: "Payment Methods", icon: CreditCard },
      { href: "/billing/plans", label: "Plans", icon: CreditCard },
      { href: "/billing/usage", label: "Usage", icon: Gauge },
    ]
  },
  {
    title: "Settings & Support",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/settings/profile", label: "Profile", icon: User },
      { href: "/settings/appearance", label: "Appearance", icon: Gauge },
      { href: "/settings/notifications", label: "Notifications", icon: Bell },
      { href: "/settings/security", label: "Security", icon: Lock },
      { href: "/help", label: "Help", icon: HelpCircle },
    ]
  }
]

export default function AppLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, user, loadInitialData, logout } = useAppStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    // Redirect to login if not authenticated after a brief delay to allow data loading
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.push("/login")
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [isAuthenticated, router])

  return (
    <div className="min-h-svh bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-card border-r transform transition-transform duration-200 ease-in-out z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/" className="font-bold text-xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              ⚡ CloudDeck
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {navSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
          
          {/* User section */}
          <div className="p-4 border-t">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="size-4 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.name || "User"}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    logout()
                    window.location.href = "/login"
                  }}
                  title="Logout"
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                Not authenticated
              </div>
            )}
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="md:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="size-4" />
              </Button>
              <div className="hidden md:block">
                <h1 className="font-semibold text-lg">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Unified Cloud Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                <Bell className="size-4" />
              </Button>
              <Link href="/" className="text-sm text-primary hover:underline">
                View Site
              </Link>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
