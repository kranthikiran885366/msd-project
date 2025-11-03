"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Alert } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

export default function MultiRegionPage() {
  const [regions, setRegions] = useState([])
  const [newRegion, setNewRegion] = useState({
    name: "",
    provider: "aws",
    location: "us-east-1",
    isActive: true,
    configuration: {
      instanceType: "t3.micro",
      scalingMin: 1,
      scalingMax: 5,
      backupEnabled: true,
      monitoring: true,
    },
  })
  const [deployments, setDeployments] = useState([])
  const [healthChecks, setHealthChecks] = useState({})
  const [trafficDistribution, setTrafficDistribution] = useState({})

  useEffect(() => {
    fetchRegions()
    fetchDeployments()
    const interval = setInterval(fetchHealthChecks, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchRegions = async () => {
    try {
      const response = await fetch("/api/multi-region/regions")
      const data = await response.json()
      setRegions(data)
    } catch (error) {
      console.error("Failed to fetch regions:", error)
    }
  }

  const fetchDeployments = async () => {
    try {
      const response = await fetch("/api/multi-region/deployments")
      const data = await response.json()
      setDeployments(data)
    } catch (error) {
      console.error("Failed to fetch deployments:", error)
    }
  }

  const fetchHealthChecks = async () => {
    try {
      const response = await fetch("/api/multi-region/health")
      const data = await response.json()
      setHealthChecks(data)
    } catch (error) {
      console.error("Failed to fetch health checks:", error)
    }
  }

  const addRegion = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/multi-region/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRegion),
      })
      if (response.ok) {
        setNewRegion({
          name: "",
          provider: "aws",
          location: "us-east-1",
          isActive: true,
          configuration: {
            instanceType: "t3.micro",
            scalingMin: 1,
            scalingMax: 5,
            backupEnabled: true,
            monitoring: true,
          },
        })
        fetchRegions()
      }
    } catch (error) {
      console.error("Failed to add region:", error)
    }
  }

  const updateTrafficDistribution = async (regionId, percentage) => {
    try {
      await fetch(`/api/multi-region/traffic/${regionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percentage }),
      })
      const response = await fetch("/api/multi-region/traffic")
      const data = await response.json()
      setTrafficDistribution(data)
    } catch (error) {
      console.error("Failed to update traffic distribution:", error)
    }
  }

  const toggleRegion = async (regionId) => {
    try {
      await fetch(`/api/multi-region/regions/${regionId}/toggle`, {
        method: "POST",
      })
      fetchRegions()
    } catch (error) {
      console.error("Failed to toggle region:", error)
    }
  }

  const deployToRegion = async (regionId, deploymentId) => {
    try {
      await fetch(`/api/multi-region/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionId,
          deploymentId,
        }),
      })
      fetchDeployments()
    } catch (error) {
      console.error("Failed to deploy:", error)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Add Region</h2>
          <form onSubmit={addRegion} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newRegion.name}
                  onChange={(e) => setNewRegion({
                    ...newRegion,
                    name: e.target.value,
                  })}
                  placeholder="us-east"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Provider</label>
                <Select
                  value={newRegion.provider}
                  onChange={(e) => setNewRegion({
                    ...newRegion,
                    provider: e.target.value,
                  })}
                >
                  <option value="aws">AWS</option>
                  <option value="gcp">Google Cloud</option>
                  <option value="azure">Azure</option>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={newRegion.location}
                  onChange={(e) => setNewRegion({
                    ...newRegion,
                    location: e.target.value,
                  })}
                  placeholder="us-east-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Instance Type</label>
                <Input
                  value={newRegion.configuration.instanceType}
                  onChange={(e) => setNewRegion({
                    ...newRegion,
                    configuration: {
                      ...newRegion.configuration,
                      instanceType: e.target.value,
                    },
                  })}
                  placeholder="t3.micro"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Min Instances</label>
                <Input
                  type="number"
                  value={newRegion.configuration.scalingMin}
                  onChange={(e) => setNewRegion({
                    ...newRegion,
                    configuration: {
                      ...newRegion.configuration,
                      scalingMin: parseInt(e.target.value),
                    },
                  })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Max Instances</label>
                <Input
                  type="number"
                  value={newRegion.configuration.scalingMax}
                  onChange={(e) => setNewRegion({
                    ...newRegion,
                    configuration: {
                      ...newRegion.configuration,
                      scalingMax: parseInt(e.target.value),
                    },
                  })}
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <Switch
                  checked={newRegion.configuration.backupEnabled}
                  onCheckedChange={(checked) => setNewRegion({
                    ...newRegion,
                    configuration: {
                      ...newRegion.configuration,
                      backupEnabled: checked,
                    },
                  })}
                />
                <span>Enable Backups</span>
              </label>

              <label className="flex items-center space-x-2">
                <Switch
                  checked={newRegion.configuration.monitoring}
                  onCheckedChange={(checked) => setNewRegion({
                    ...newRegion,
                    configuration: {
                      ...newRegion.configuration,
                      monitoring: checked,
                    },
                  })}
                />
                <span>Enable Monitoring</span>
              </label>
            </div>

            <Button type="submit">Add Region</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Regions</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Health</TableCell>
                <TableCell>Traffic %</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((region) => (
                <TableRow key={region.id}>
                  <TableCell>{region.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{region.provider}</Badge>
                  </TableCell>
                  <TableCell>{region.location}</TableCell>
                  <TableCell>
                    <Badge
                      variant={region.isActive ? "success" : "warning"}
                    >
                      {region.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {healthChecks[region.id] ? (
                      <div className="space-y-1">
                        <Progress
                          value={healthChecks[region.id].health * 100}
                          className="w-24"
                        />
                        <div className="text-xs text-gray-500">
                          {healthChecks[region.id].latency}ms
                        </div>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={trafficDistribution[region.id] || 0}
                      onChange={(e) => updateTrafficDistribution(
                        region.id,
                        parseInt(e.target.value)
                      )}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        variant={region.isActive ? "outline" : "default"}
                        onClick={() => toggleRegion(region.id)}
                      >
                        {region.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Select
                        value=""
                        onChange={(e) => deployToRegion(region.id, e.target.value)}
                      >
                        <option value="">Deploy...</option>
                        {deployments.map((dep) => (
                          <option key={dep.id} value={dep.id}>
                            {dep.name} ({dep.version})
                          </option>
                        ))}
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Active Deployments</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Region</TableCell>
                <TableCell>Deployment</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Deployed At</TableCell>
                <TableCell>Health</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployments.map((deployment) => (
                deployment.regions.map((region) => (
                  <TableRow key={`${deployment.id}-${region.id}`}>
                    <TableCell>{region.name}</TableCell>
                    <TableCell>{deployment.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{deployment.version}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          region.status === "running" ? "success" :
                          region.status === "deploying" ? "warning" :
                          "error"
                        }
                      >
                        {region.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(region.deployedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {healthChecks[region.id] ? (
                        <Progress
                          value={healthChecks[region.id].health * 100}
                          className="w-24"
                        />
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}