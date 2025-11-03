"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

export default function SSHAccessPage() {
  const [sshKeys, setSSHKeys] = useState([])
  const [newKey, setNewKey] = useState({ name: "", publicKey: "" })
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [terminal, setTerminal] = useState({ output: "", connected: false })

  useEffect(() => {
    fetchSSHKeys()
    fetchServices()
  }, [])

  const fetchSSHKeys = async () => {
    try {
      const response = await fetch("/api/ssh/keys")
      const data = await response.json()
      setSSHKeys(data)
    } catch (error) {
      console.error("Failed to fetch SSH keys:", error)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services")
      const data = await response.json()
      setServices(data)
    } catch (error) {
      console.error("Failed to fetch services:", error)
    }
  }

  const addSSHKey = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/ssh/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newKey),
      })
      if (response.ok) {
        setNewKey({ name: "", publicKey: "" })
        fetchSSHKeys()
      }
    } catch (error) {
      console.error("Failed to add SSH key:", error)
    }
  }

  const connectToService = async (serviceId) => {
    try {
      const response = await fetch(`/api/ssh/connect/${serviceId}`, {
        method: "POST",
      })
      const data = await response.json()
      setSelectedService(serviceId)
      setTerminal({ output: "Connected to service...\n", connected: true })
      // Set up WebSocket connection for real-time terminal output
      const ws = new WebSocket(data.wsUrl)
      ws.onmessage = (event) => {
        setTerminal(prev => ({
          ...prev,
          output: prev.output + event.data + "\n"
        }))
      }
    } catch (error) {
      console.error("Failed to connect to service:", error)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">SSH Keys</h2>
          <form onSubmit={addSSHKey} className="space-y-4 mb-6">
            <Input
              placeholder="Key name"
              value={newKey.name}
              onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
            />
            <Textarea
              placeholder="Public SSH key"
              value={newKey.publicKey}
              onChange={(e) => setNewKey({ ...newKey, publicKey: e.target.value })}
            />
            <Button type="submit">Add Key</Button>
          </form>
          
          <div className="space-y-2">
            {sshKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-2 border rounded">
                <span>{key.name}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteSSHKey(key.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Services</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="p-4">
                <h3 className="font-medium mb-2">{service.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{service.status}</p>
                <Button
                  onClick={() => connectToService(service.id)}
                  disabled={!sshKeys.length}
                >
                  Connect via SSH
                </Button>
              </Card>
            ))}
          </div>
        </Card>

        {selectedService && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Terminal</h2>
            <div className="bg-black text-green-400 p-4 rounded font-mono h-64 overflow-auto">
              <pre>{terminal.output}</pre>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}