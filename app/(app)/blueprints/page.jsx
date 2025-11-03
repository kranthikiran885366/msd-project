"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert } from "@/components/ui/alert"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"

export default function BlueprintsPage() {
  const [templates, setTemplates] = useState([])
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    type: "application",
    config: {
      resources: [],
      environment: {},
      scaling: {},
    }
  })
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [deploymentConfig, setDeploymentConfig] = useState(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/blueprints")
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    }
  }

  const createTemplate = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/blueprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      })
      if (response.ok) {
        setNewTemplate({
          name: "",
          description: "",
          type: "application",
          config: {
            resources: [],
            environment: {},
            scaling: {},
          }
        })
        fetchTemplates()
      }
    } catch (error) {
      console.error("Failed to create template:", error)
    }
  }

  const generateDeploymentConfig = async (templateId) => {
    try {
      const response = await fetch(`/api/blueprints/${templateId}/generate`)
      const data = await response.json()
      setDeploymentConfig(data)
      setSelectedTemplate(templateId)
    } catch (error) {
      console.error("Failed to generate config:", error)
    }
  }

  const deployTemplate = async (templateId, config) => {
    try {
      const response = await fetch(`/api/blueprints/${templateId}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (response.ok) {
        // Redirect to deployments page
        window.location.href = "/deployments"
      }
    } catch (error) {
      console.error("Failed to deploy template:", error)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create Blueprint Template</h2>
          <form onSubmit={createTemplate} className="space-y-4">
            <Input
              placeholder="Template name"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
            />
            <Select
              value={newTemplate.type}
              onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
            >
              <option value="application">Application</option>
              <option value="database">Database</option>
              <option value="storage">Storage</option>
              <option value="network">Network</option>
            </Select>

            <div className="space-y-4">
              <h3 className="font-medium">Resources</h3>
              {newTemplate.config.resources.map((resource, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Resource type"
                      value={resource.type}
                      onChange={(e) => {
                        const resources = [...newTemplate.config.resources]
                        resources[index].type = e.target.value
                        setNewTemplate({
                          ...newTemplate,
                          config: { ...newTemplate.config, resources }
                        })
                      }}
                    />
                    <Input
                      placeholder="Size/Tier"
                      value={resource.size}
                      onChange={(e) => {
                        const resources = [...newTemplate.config.resources]
                        resources[index].size = e.target.value
                        setNewTemplate({
                          ...newTemplate,
                          config: { ...newTemplate.config, resources }
                        })
                      }}
                    />
                  </div>
                </Card>
              ))}
              <Button
                type="button"
                onClick={() => setNewTemplate({
                  ...newTemplate,
                  config: {
                    ...newTemplate.config,
                    resources: [...newTemplate.config.resources, { type: "", size: "" }]
                  }
                })}
              >
                Add Resource
              </Button>
            </div>

            <Button type="submit">Create Template</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Available Templates</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="p-4">
                <h3 className="font-medium">{template.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{template.description}</p>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Type:</span> {template.type}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Resources:</span>{" "}
                    {template.config.resources.length}
                  </div>
                </div>
                <div className="mt-4 space-x-2">
                  <Button onClick={() => generateDeploymentConfig(template.id)}>
                    Configure
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = `/blueprints/${template.id}/edit`}>
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {selectedTemplate && deploymentConfig && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Deployment Configuration</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Resources</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Region</TableCell>
                      <TableCell>Cost</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deploymentConfig.resources.map((resource, index) => (
                      <TableRow key={index}>
                        <TableCell>{resource.type}</TableCell>
                        <TableCell>{resource.size}</TableCell>
                        <TableCell>
                          <Select
                            value={resource.region}
                            onChange={(e) => {
                              const config = { ...deploymentConfig }
                              config.resources[index].region = e.target.value
                              setDeploymentConfig(config)
                            }}
                          >
                            <option value="us-east">US East</option>
                            <option value="us-west">US West</option>
                            <option value="eu-central">EU Central</option>
                          </Select>
                        </TableCell>
                        <TableCell>${resource.cost}/mo</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="font-medium mb-2">Environment Variables</h3>
                {Object.entries(deploymentConfig.environment).map(([key, value]) => (
                  <div key={key} className="flex gap-2 mb-2">
                    <Input value={key} disabled />
                    <Input
                      value={value}
                      onChange={(e) => {
                        const config = { ...deploymentConfig }
                        config.environment[key] = e.target.value
                        setDeploymentConfig(config)
                      }}
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={() => deployTemplate(selectedTemplate, deploymentConfig)}
                className="w-full"
              >
                Deploy Template
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}