'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Trash2, History, Clock, RotateCcw, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function RestorePage() {
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [restores, setRestores] = useState([]);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showRestoreForm, setShowRestoreForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    if (selectedDb) {
      fetchRestoreData();
    }
  }, [selectedDb]);

  const fetchDatabases = async () => {
    try {
      setError('');
      const response = await apiClient.getDatabases();
      setDatabases(response || []);
      if (response?.length > 0 && !selectedDb) {
        setSelectedDb(response[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch databases');
    }
  };

  const fetchRestoreData = async () => {
    if (!selectedDb) return;
    
    try {
      setError('');
      setLoading(true);

      const backupsRes = await apiClient.getBackups(selectedDb);
      setBackups(backupsRes?.backups || []);
      
      // Mock restore history for now since API doesn't have this endpoint
      setRestores([]);
    } catch (err) {
      setError(err.message || 'Failed to fetch restore data');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setError('');

      if (!selectedBackup) {
        setError('Please select a backup to restore');
        return;
      }

      setSaving(true);
      await apiClient.restoreBackup(selectedDb, selectedBackup);
      
      const newRestore = {
        id: Date.now(),
        backupName: backups.find(b => b._id === selectedBackup || b.name === selectedBackup)?.name || selectedBackup,
        databaseName: databases.find(d => d._id === selectedDb)?.name || 'Unknown',
        startedAt: new Date().toLocaleString(),
        completedAt: null,
        duration: 'In progress',
        status: 'in-progress'
      };
      
      setRestores([newRestore, ...restores]);
      setSelectedBackup(null);
      setShowRestoreForm(false);
      setSuccessMessage('Restore initiated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to restore database');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading restore data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Database Restore</h1>
          <p className="text-muted-foreground">
            Restore databases from backups
          </p>
        </div>
        <Button
          onClick={() => setShowRestoreForm(!showRestoreForm)}
          disabled={!selectedDb}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          New Restore
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

      {/* Database Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Database</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedDb}
            onChange={(e) => setSelectedDb(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="">Select a database...</option>
            {databases.map(db => (
              <option key={db._id} value={db._id}>
                {db.name} ({db.type})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Restore Form */}
      {showRestoreForm && selectedDb && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Restore from Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Select Backup</label>
              <select
                value={selectedBackup || ''}
                onChange={(e) => setSelectedBackup(e.target.value)}
                disabled={saving}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Choose a backup...</option>
                {backups.filter(b => b.status === 'completed').map(backup => (
                  <option key={backup._id || backup.name} value={backup._id || backup.name}>
                    {backup.name} ({new Date(backup.backupAt || backup.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900">
                Restoring will overwrite the current database. This action cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowRestoreForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRestore}
                disabled={saving || !selectedBackup}
                className="flex-1"
              >
                {saving ? 'Restoring...' : 'Start Restore'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Restore History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Restore History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {restores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No restores yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Backup Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Database</th>
                    <th className="text-left py-3 px-4 font-semibold">Started</th>
                    <th className="text-left py-3 px-4 font-semibold">Completed</th>
                    <th className="text-left py-3 px-4 font-semibold">Duration</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {restores.map((restore) => (
                    <tr key={restore.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-xs">{restore.backupName}</td>
                      <td className="py-3 px-4">{restore.databaseName}</td>
                      <td className="py-3 px-4">{restore.startedAt}</td>
                      <td className="py-3 px-4">{restore.completedAt || 'In progress'}</td>
                      <td className="py-3 px-4">{restore.duration}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getStatusColor(restore.status)}>
                          {restore.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Best Practices */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>Restore Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-blue-900">
          <p>• <strong>Test Restores:</strong> Regularly test restore procedures to ensure backups are valid</p>
          <p>• <strong>Point-in-Time Recovery:</strong> Use point-in-time recovery for precise data recovery</p>
          <p>• <strong>Backup Validation:</strong> Verify backup integrity before restoring to production</p>
          <p>• <strong>Maintain Replicas:</strong> Keep replicas updated for faster recovery</p>
          <p>• <strong>Document Procedures:</strong> Document all restore procedures and runbooks</p>
        </CardContent>
      </Card>
    </div>
  );
}
