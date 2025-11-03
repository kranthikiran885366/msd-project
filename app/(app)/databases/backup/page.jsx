"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Calendar, Database, Clock, RefreshCw, Trash2, AlertCircle, CheckCircle, Plus } from "lucide-react"
import apiClient from "@/lib/api-client"

export default function DatabaseBackupPage() {
  const searchParams = useSearchParams()
  const databaseId = searchParams.get('db')
  
  const [backups, setBackups] = useState([])
  const [databases, setDatabases] = useState([])
  const [selectedDatabase, setSelectedDatabase] = useState(databaseId || '')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchDatabases()
  }, [])

  useEffect(() => {
    if (selectedDatabase) {
      fetchBackups()
    }
  }, [selectedDatabase])

  const fetchDatabases = async () => {
    try {
      const response = await apiClient.getDatabases()
      setDatabases(response || [])
      if (response?.length > 0 && !selectedDatabase) {
        setSelectedDatabase(response[0]._id)
      }
    } catch (err) {
      setError('Failed to fetch databases')
    }
  }

  const fetchBackups = async () => {
    if (!selectedDatabase) return
    
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.getBackups(selectedDatabase)
      setBackups(response?.backups || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch backups')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    if (!selectedDatabase) return
    
    try {
      setCreating(true)
      setError('')
      await apiClient.createBackup(selectedDatabase)
      setSuccessMessage('Backup created successfully!')
      await fetchBackups()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to create backup')
    } finally {
      setCreating(false)
    }
  }

  const handleRestoreBackup = async (backupId) => {
    if (!confirm('Are you sure you want to restore this backup? This will overwrite current data.')) return
    
    try {
      setError('')
      await apiClient.restoreBackup(selectedDatabase, backupId)
      setSuccessMessage('Backup restore initiated!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to restore backup')
    }
  }

  const handleDeleteBackup = async (backupId) => {
    if (!confirm('Are you sure you want to delete this backup?')) return
    
    try {
      setError('')
      await apiClient.deleteBackup(selectedDatabase, backupId)
      setSuccessMessage('Backup deleted successfully!')
      await fetchBackups()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete backup')
    }
  }

  const formatDate = (date) => new Date(date).toLocaleString()
  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown'
    const mb = bytes / (1024 * 1024)
    return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`
  }

  const selectedDb = databases.find(db => db._id === selectedDatabase)
  const totalBackups = backups.length
  const totalSize = backups.reduce((sum, backup) => sum + (backup.size || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Database Backups</h1>
          <p className="text-muted-foreground">Manage automated and manual database backups</p>
        </div>
        <Button onClick={handleCreateBackup} disabled={creating || !selectedDatabase} className="gap-2">
          <Plus className="w-4 h-4" />
          {creating ? 'Creating...' : 'Create Backup'}
        </Button>
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

      {/* Database Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Database</label>
            <select
              className="w-full border rounded-lg px-4 py-2 bg-background"
              value={selectedDatabase}
              onChange={(e) => setSelectedDatabase(e.target.value)}
            >
              <option value="">Select a database...</option>
              {databases.map(db => (
                <option key={db._id} value={db._id}>
                  {db.name} ({db.type})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {selectedDatabase && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{totalBackups}</p>
                    <p className="text-sm text-muted-foreground">Total Backups</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{formatSize(totalSize)}</p>
                    <p className="text-sm text-muted-foreground">Storage Used</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{selectedDb?.backupSchedule || 'Daily'}</p>
                    <p className="text-sm text-muted-foreground">Backup Schedule</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Backups for {selectedDb?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No backups found</p>
                  <p className="text-sm mt-2">Create your first backup to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {backups.map((backup) => (
                    <div key={backup._id || backup.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Database className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{backup.name}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(backup.backupAt || backup.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatSize(backup.size)}</p>
                          <Badge variant={backup.isAutomatic ? 'default' : 'secondary'}>
                            {backup.isAutomatic ? 'automatic' : 'manual'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRestoreBackup(backup._id || backup.name)}
                            title="Restore backup"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => handleDeleteBackup(backup._id || backup.name)}
                            title="Delete backup"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}