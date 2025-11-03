"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function ISRConfigPage() {
  const [pages, setPages] = useState([])
  const [newPage, setNewPage] = useState({
    path: "",
    revalidateSeconds: 60,
    onDemand: false,
    fallback: true,
  })
  const [selectedPage, setSelectedPage] = useState(null)

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const response = await fetch("/api/isr/pages")
      const data = await response.json()
      setPages(data)
    } catch (error) {
      console.error("Failed to fetch pages:", error)
    }
  }

  const addPage = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/isr/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPage),
      })
      if (response.ok) {
        setNewPage({
          path: "",
          revalidateSeconds: 60,
          onDemand: false,
          fallback: true,
        })
        fetchPages()
      }
    } catch (error) {
      console.error("Failed to add page:", error)
    }
  }

  const updatePage = async (id, updates) => {
    try {
      await fetch(`/api/isr/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      fetchPages()
    } catch (error) {
      console.error("Failed to update page:", error)
    }
  }

  const revalidatePage = async (id) => {
    try {
      await fetch(`/api/isr/pages/${id}/revalidate`, {
        method: "POST",
      })
      fetchPages()
    } catch (error) {
      console.error("Failed to revalidate page:", error)
    }
  }

  const getLastRevalidatedTime = (timestamp) => {
    if (!timestamp) return "Never"
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Add ISR Page</h2>
          <form onSubmit={addPage} className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Page Path</label>
                <Input
                  placeholder="/blog/[slug]"
                  value={newPage.path}
                  onChange={(e) => setNewPage({ ...newPage, path: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Revalidation Interval (seconds)</label>
                <Input
                  type="number"
                  min="1"
                  value={newPage.revalidateSeconds}
                  onChange={(e) => setNewPage({ ...newPage, revalidateSeconds: parseInt(e.target.value, 10) })}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable On-Demand Revalidation</label>
                <Switch
                  checked={newPage.onDemand}
                  onCheckedChange={(checked) => setNewPage({ ...newPage, onDemand: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Fallback Page</label>
                <Switch
                  checked={newPage.fallback}
                  onCheckedChange={(checked) => setNewPage({ ...newPage, fallback: checked })}
                />
              </div>
            </div>

            <Button type="submit">Add Page</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">ISR Pages</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Path</TableCell>
                <TableCell>Revalidation</TableCell>
                <TableCell>Last Revalidated</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>{page.path}</TableCell>
                  <TableCell>
                    {page.onDemand ? (
                      <Badge>On Demand</Badge>
                    ) : (
                      `Every ${page.revalidateSeconds}s`
                    )}
                  </TableCell>
                  <TableCell>
                    {getLastRevalidatedTime(page.lastRevalidated)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={page.status === "active" ? "success" : "warning"}
                    >
                      {page.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        onClick={() => revalidatePage(page.id)}
                        disabled={!page.onDemand}
                      >
                        Revalidate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePage(page.id, { status: page.status === "active" ? "paused" : "active" })}
                      >
                        {page.status === "active" ? "Pause" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">ISR Analytics</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">Total Pages</h3>
              <p className="text-2xl font-bold">{pages.length}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">Active Pages</h3>
              <p className="text-2xl font-bold">
                {pages.filter(p => p.status === "active").length}
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">On-Demand Pages</h3>
              <p className="text-2xl font-bold">
                {pages.filter(p => p.onDemand).length}
              </p>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  )
}