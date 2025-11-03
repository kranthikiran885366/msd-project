"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { Select } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { Chart } from "@/components/ui/chart"

export default function SplitTestingPage() {
  const [tests, setTests] = useState([])
  const [newTest, setNewTest] = useState({
    name: "",
    description: "",
    variants: [
      { name: "A", path: "", weight: 50 },
      { name: "B", path: "", weight: 50 }
    ]
  })
  const [selectedTest, setSelectedTest] = useState(null)
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      const response = await fetch("/api/split-tests")
      const data = await response.json()
      setTests(data)
    } catch (error) {
      console.error("Failed to fetch tests:", error)
    }
  }

  const createTest = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/split-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTest),
      })
      if (response.ok) {
        setNewTest({
          name: "",
          description: "",
          variants: [
            { name: "A", path: "", weight: 50 },
            { name: "B", path: "", weight: 50 }
          ]
        })
        fetchTests()
      }
    } catch (error) {
      console.error("Failed to create test:", error)
    }
  }

  const fetchTestMetrics = async (testId) => {
    try {
      const response = await fetch(`/api/split-tests/${testId}/metrics`)
      const data = await response.json()
      setMetrics(data)
      setSelectedTest(testId)
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
    }
  }

  const updateVariantWeight = async (testId, variantName, weight) => {
    try {
      await fetch(`/api/split-tests/${testId}/variants/${variantName}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight }),
      })
      fetchTests()
    } catch (error) {
      console.error("Failed to update weight:", error)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create Split Test</h2>
          <form onSubmit={createTest} className="space-y-4">
            <Input
              placeholder="Test name"
              value={newTest.name}
              onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
            />
            <Input
              placeholder="Description"
              value={newTest.description}
              onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
            />
            
            <div className="space-y-4">
              {newTest.variants.map((variant, index) => (
                <div key={index} className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Variant name"
                    value={variant.name}
                    onChange={(e) => {
                      const variants = [...newTest.variants]
                      variants[index].name = e.target.value
                      setNewTest({ ...newTest, variants })
                    }}
                  />
                  <Input
                    placeholder="Path"
                    value={variant.path}
                    onChange={(e) => {
                      const variants = [...newTest.variants]
                      variants[index].path = e.target.value
                      setNewTest({ ...newTest, variants })
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Weight %"
                    value={variant.weight}
                    onChange={(e) => {
                      const variants = [...newTest.variants]
                      variants[index].weight = parseInt(e.target.value, 10)
                      setNewTest({ ...newTest, variants })
                    }}
                  />
                </div>
              ))}
            </div>
            
            <Button 
              type="button" 
              onClick={() => setNewTest({
                ...newTest,
                variants: [...newTest.variants, { name: "", path: "", weight: 0 }]
              })}
            >
              Add Variant
            </Button>
            <Button type="submit">Create Test</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Active Tests</h2>
          <div className="space-y-4">
            {tests.map((test) => (
              <Card key={test.id} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium">{test.name}</h3>
                    <p className="text-sm text-gray-500">{test.description}</p>
                  </div>
                  <Button onClick={() => fetchTestMetrics(test.id)}>
                    View Metrics
                  </Button>
                </div>

                <div className="space-y-2">
                  {test.variants.map((variant) => (
                    <div key={variant.name} className="flex items-center gap-4">
                      <span className="w-24">{variant.name}</span>
                      <div className="flex-1">
                        <Slider
                          value={[variant.weight]}
                          max={100}
                          step={1}
                          onValueChange={(value) => updateVariantWeight(test.id, variant.name, value[0])}
                        />
                      </div>
                      <span className="w-16 text-right">{variant.weight}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {selectedTest && metrics && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Metrics</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Conversion Rates</h3>
                <Chart
                  type="bar"
                  data={{
                    labels: metrics.variants.map(v => v.name),
                    datasets: [{
                      label: "Conversion Rate",
                      data: metrics.variants.map(v => v.conversionRate),
                    }]
                  }}
                />
              </div>
              <div>
                <h3 className="font-medium mb-2">Traffic Distribution</h3>
                <Chart
                  type="pie"
                  data={{
                    labels: metrics.variants.map(v => v.name),
                    datasets: [{
                      data: metrics.variants.map(v => v.traffic),
                    }]
                  }}
                />
              </div>
            </div>

            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableCell>Variant</TableCell>
                  <TableCell>Visitors</TableCell>
                  <TableCell>Conversions</TableCell>
                  <TableCell>Rate</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.variants.map((variant) => (
                  <TableRow key={variant.name}>
                    <TableCell>{variant.name}</TableCell>
                    <TableCell>{variant.visitors}</TableCell>
                    <TableCell>{variant.conversions}</TableCell>
                    <TableCell>{variant.conversionRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  )
}