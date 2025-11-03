"use client"

import { useState } from "react"
import { useAppStore } from "@/store/use-app-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Eye, EyeOff, Trash2, Key } from "lucide-react"

export default function EnvPage() {
  const { envVars, addEnv, deleteEnv } = useAppStore()
  const [name, setName] = useState("")
  const [value, setValue] = useState("")
  const [scope, setScope] = useState("prod")
  const [loading, setLoading] = useState(false)
  const [showValue, setShowValue] = useState({})

  async function add() {
    if (!name.trim() || !value.trim()) return
    setLoading(true)
    try {
      addEnv({ name, value, scope })
      setName("")
      setValue("")
    } finally {
      setLoading(false)
    }
  }

  async function copy(val) {
    try {
      await navigator.clipboard.writeText(val)
      alert("Copied!")
    } catch (err) {
      console.error("Copy failed:", err)
    }
  }

  const scopeConfig = {
    prod: { color: "bg-red-500", icon: "🔴", label: "Production" },
    staging: { color: "bg-yellow-500", icon: "🟡", label: "Staging" },
    dev: { color: "bg-blue-500", icon: "🔵", label: "Development" },
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Environment Variables</h1>
        <p className="text-muted-foreground">Manage secrets and configuration across environments</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Add Environment Variable</h3>
          <div className="grid gap-4 sm:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background font-mono"
                placeholder="API_KEY"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Value</label>
              <input
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                placeholder="your-secret-value"
                type="password"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Scope</label>
              <select
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              >
                <option value="prod">Production</option>
                <option value="staging">Staging</option>
                <option value="dev">Development</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={add} disabled={loading} className="w-full">
                {loading ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {envVars.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No environment variables set</p>
              <p className="text-sm mt-2">Add variables to configure your applications</p>
            </CardContent>
          </Card>
        ) : (
          envVars.map((e) => {
            const config = scopeConfig[e.scope]
            const isShown = showValue[e.id]
            return (
              <Card key={e.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge className={`${config.color} text-white whitespace-nowrap`}>{config.label}</Badge>
                      <div className="min-w-0">
                        <div className="font-mono font-semibold text-sm">{e.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Created {new Date(e.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowValue({ ...showValue, [e.id]: !isShown })}
                        title={isShown ? "Hide value" : "Show value"}
                      >
                        {isShown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => copy(e.value)} title="Copy value">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEnv(e.id)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {isShown && (
                    <div className="mt-3 p-2 bg-muted/50 rounded font-mono text-xs break-all text-muted-foreground">
                      {e.value}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
