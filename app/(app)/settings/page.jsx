"use client"

import { useAppStore } from "@/store/use-app-store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Lock, Zap, Trash2, Webhook as Webhooks, Database, GitBranch } from "lucide-react"

export default function SettingsPage() {
  const { settings, setSetting } = useAppStore()

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure your account and preferences</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Deployment Settings</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-3 -mx-3 rounded transition">
              <input
                type="checkbox"
                checked={settings.autoDeploy}
                onChange={(e) => setSetting("autoDeploy", e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm flex-1">
                <span className="font-medium block">Auto Deploy</span>
                <span className="text-muted-foreground text-xs">Automatically deploy on git push</span>
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-3 -mx-3 rounded transition">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm flex-1">
                <span className="font-medium block">Preview Deploys</span>
                <span className="text-muted-foreground text-xs">Generate preview URLs for pull requests</span>
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-3 -mx-3 rounded transition">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm flex-1">
                <span className="font-medium block">Deploy Locks</span>
                <span className="text-muted-foreground text-xs">Require approval before deployments</span>
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">Notifications</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-3 -mx-3 rounded transition">
              <input
                type="checkbox"
                checked={settings.notifySlack}
                onChange={(e) => setSetting("notifySlack", e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm flex-1">
                <span className="font-medium block">Slack Notifications</span>
                <span className="text-muted-foreground text-xs">Get deployment updates in Slack</span>
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-3 -mx-3 rounded transition">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm flex-1">
                <span className="font-medium block">Email Notifications</span>
                <span className="text-muted-foreground text-xs">Receive emails for deployments and errors</span>
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-3 -mx-3 rounded transition">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm flex-1">
                <span className="font-medium block">Webhook Notifications</span>
                <span className="text-muted-foreground text-xs">Send events to external services</span>
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Webhooks className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">Integrations</h3>
          </div>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start bg-transparent gap-2">
              <GitBranch className="w-4 h-4" />
              Connect GitHub Repository
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent gap-2">
              <Database className="w-4 h-4" />
              Connect Database
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold">Security</h3>
          </div>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              Two-Factor Authentication
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              API Keys & Tokens
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Account Information</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Type</span>
              <Badge>Personal</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Login</span>
              <span className="font-medium">Just now</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Storage Used</span>
              <span className="font-medium">245 MB</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 text-destructive">Danger Zone</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive bg-transparent"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
            <p className="text-xs text-muted-foreground">
              This action cannot be undone. All data will be permanently deleted.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
