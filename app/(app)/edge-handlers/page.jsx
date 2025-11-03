"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { AlertCircle, CheckCircle, RefreshCw, Play, Upload, Trash2 } from "lucide-react"
import apiClient from "@/lib/api-client"

export default function EdgeHandlersPage() {
  const [handlers, setHandlers] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [newHandler, setNewHandler] = useState({
    name: "",
    pattern: "/*",
    code: `export default function handler(request) {
  // Your edge logic here
  return new Response("Hello from the edge!")
}`,
    type: "request",
    regions: ["all"],
  })
  const [selectedHandler, setSelectedHandler] = useState(null)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    fetchHandlers()
  }, [])

  const fetchHandlers = async () => {
    try {
      setError('')
      const response = await apiClient.request('/edge-handlers')
      setHandlers(response || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch edge handlers')
    } finally {
      setLoading(false)
    }
  }

  const createHandler = async (e) => {
    e.preventDefault()
    if (!newHandler.name.trim() || !newHandler.code.trim()) {
      setError('Name and code are required')
      return
    }

    setCreating(true)
    try {
      setError('')
      await apiClient.request('/edge-handlers', {
        method: 'POST',
        body: JSON.stringify(newHandler)
      })
      
      setSuccessMessage('Edge handler created successfully!')
      setNewHandler({
        name: "",
        pattern: "/*",
        code: `export default function handler(request) {
  // Your edge logic here
  return new Response("Hello from the edge!")
}`,
        type: "request",
        regions: ["all"],
      })
      await fetchHandlers()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to create edge handler')
    } finally {
      setCreating(false)
    }
  }

  const testHandler = async (id) => {
    try {
      setError('')
      const data = await apiClient.request(`/edge-handlers/${id}/test`, {
        method: 'POST',
        body: JSON.stringify({
          url: "https://example.com/test",
          method: "GET",
          headers: {},
        })
      })
      setTestResult(data)
      setSelectedHandler(id)
      setSuccessMessage('Handler tested successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to test handler')
    }
  }

  const deployHandler = async (id) => {
    try {
      setError('')
      await apiClient.request(`/edge-handlers/${id}/deploy`, {
        method: 'POST'
      })
      setSuccessMessage('Handler deployed successfully!')
      await fetchHandlers()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to deploy handler')
    }
  }

  const deleteHandler = async (id) => {
    if (!confirm('Are you sure you want to delete this edge handler?')) return
    
    try {
      setError('')
      await apiClient.request(`/edge-handlers/${id}`, {
        method: 'DELETE'
      })
      setSuccessMessage('Handler deleted successfully!')
      await fetchHandlers()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete handler')
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Edge Handlers</h1>
          <p className="text-muted-foreground">Deploy code to run at the edge for better performance</p>
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
        <Card>
          <CardHeader>
            <CardTitle>Create Edge Handler</CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={createHandler} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newHandler.name}
                onChange={(e) => setNewHandler({ ...newHandler, name: e.target.value })}
                placeholder="my-edge-handler"
              />
            </div>

            <div>
              <label className="text-sm font-medium">URL Pattern</label>
              <Input
                value={newHandler.pattern}
                onChange={(e) => setNewHandler({ ...newHandler, pattern: e.target.value })}
                placeholder="/*"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                value={newHandler.type}
                onChange={(e) => setNewHandler({ ...newHandler, type: e.target.value })}
              >
                <option value="request">Request Handler</option>
                <option value="response">Response Handler</option>
                <option value="middleware">Middleware</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Code</label>
              <Textarea
                value={newHandler.code}
                onChange={(e) => setNewHandler({ ...newHandler, code: e.target.value })}
                className="font-mono"
                rows={10}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Regions</label>
              <select
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                multiple
                value={newHandler.regions}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions)
                  setNewHandler({
                    ...newHandler,
                    regions: options.map(o => o.value),
                  })
                }}
              >
                <option value="all">All Regions</option>
                <option value="us-east">US East</option>
                <option value="us-west">US West</option>
                <option value="eu-central">EU Central</option>
                <option value="ap-south">Asia Pacific</option>
              </select>
            </div>

            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Handler'}
            </Button>
          </CardContent>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edge Handlers ({handlers.length})</CardTitle>
          </CardHeader>
          <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Pattern</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Regions</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {handlers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No edge handlers created yet
                  </TableCell>
                </TableRow>
              ) : (
                handlers.map((handler) => (
                  <TableRow key={handler._id}>
                    <TableCell>{handler.name}</TableCell>
                    <TableCell>{handler.pattern}</TableCell>
                    <TableCell>{handler.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={handler.status === "active" ? "default" : "secondary"}
                      >
                        {handler.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {handler.regions?.map(region => (
                        <Badge key={region} className="mr-1">
                          {region}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testHandler(handler._id)}
                          className="gap-1"
                        >
                          <Play className="w-4 h-4" />
                          Test
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => deployHandler(handler._id)}
                          className="gap-1"
                        >
                          <Upload className="w-4 h-4" />
                          Deploy
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteHandler(handler._id)}
                          className="gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </CardContent>
        </Card>

        {selectedHandler && testResult && (
          <Card>
            <CardHeader>
              <CardTitle>Test Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Response</h3>
                  <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
                
                {testResult.performance && (
                  <div>
                    <h3 className="font-medium mb-2">Performance</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Response Time</div>
                          <div className="text-xl font-bold">{testResult.performance.responseTime}ms</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Cold Start</div>
                          <div className="text-xl font-bold">{testResult.performance.coldStart}ms</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Memory Usage</div>
                          <div className="text-xl font-bold">{testResult.performance.memory}MB</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}