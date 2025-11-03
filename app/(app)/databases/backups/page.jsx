'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Database, Download, Calendar, Clock, AlertCircle, CheckCircle, RefreshCw, Trash2, Plus, HardDrive } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function DatabaseBackupsPage() {
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    frequency: 'daily',
    retentionDays: 30,
    time: '03:00'
  });



  const fetchDatabases = useCallback(async () => {
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
  }, [selectedDb]);

  const fetchBackups = useCallback(async () => {
    if (!selectedDb) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.getBackups(selectedDb);
      setBackups(response?.backups || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch backups');
    } finally {
      setLoading(false);
    }
  }, [selectedDb]);

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    if (selectedDb) {
      fetchBackups();
    }
  }, [selectedDb, fetchBackups]);

  const handleCreateBackup = async () => {
    try {
      setError('');
      setCreating(true);

      await apiClient.createBackup(selectedDb);
      setSuccessMessage('Backup started successfully');
      await fetchBackups();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    try {
      setError('');
      await apiClient.deleteBackup(selectedDb, backupId);
      setSuccessMessage('Backup deleted successfully');
      setDeleteConfirm(null);
      await fetchBackups();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete backup');
    }
  };

  const handleDownloadBackup = (backupId) => {
    const backup = backups.find(b => b._id === backupId || b.name === backupId);
    if (backup) {
      setSuccessMessage(`Downloading backup from ${new Date(backup.backupAt || backup.createdAt).toLocaleDateString()}...`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleRestoreBackup = async (backupId) => {
    try {
      setError('');
      await apiClient.restoreBackup(selectedDb, backupId);
      setSuccessMessage('Backup restore initiated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to restore backup');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />In Progress</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const totalBackups = backups.length;
  const completedBackups = backups.filter(b => b.status === 'completed').length;
  const formatSize = (bytes) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
  };
  
  const totalSize = backups.reduce((sum, b) => sum + (b.size || 0), 0);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Database Backups</h1>
          <p className="text-muted-foreground">Manage and monitor database backups with retention policies</p>
        </div>
        <Button 
          onClick={handleCreateBackup} 
          disabled={!selectedDb || creating}
          className="gap-2"
        >
          {creating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Create Backup
            </>
          )}
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Backups</p>
              <p className="text-3xl font-bold">{totalBackups}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold text-green-600">{completedBackups}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Size</p>
              <p className="text-3xl font-bold">{formatSize(totalSize)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Last Backup</p>
              <p className="text-3xl font-bold">
                {backups.length > 0 ? new Date(backups[0].backupAt || backups[0].createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup Schedule Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <select
                id="frequency"
                value={scheduleForm.frequency}
                onChange={(e) => setScheduleForm({...scheduleForm, frequency: e.target.value})}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Backup Time</Label>
              <Input
                id="time"
                type="time"
                value={scheduleForm.time}
                onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention">Retention (Days)</Label>
              <Input
                id="retention"
                type="number"
                value={scheduleForm.retentionDays}
                onChange={(e) => setScheduleForm({...scheduleForm, retentionDays: parseInt(e.target.value)})}
                min="1"
                max="365"
              />
            </div>
          </div>
          <Button>Update Schedule</Button>
        </CardContent>
      </Card>

      {/* Backups List */}
      <div className="space-y-4">
        {backups.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No backups found for this database</p>
            </CardContent>
          </Card>
        ) : (
          backups.map(backup => (
            <Card key={backup._id || backup.name}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <Database className="w-8 h-8 text-blue-600 mt-1" />
                      <div>
                        <p className="font-semibold text-lg">{backup.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(backup.backupAt || backup.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(backup.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted rounded text-sm">
                    <div>
                      <p className="text-muted-foreground">Size</p>
                      <p className="font-semibold">{formatSize(backup.size)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-semibold">{backup.isAutomatic ? 'Automatic' : 'Manual'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Retention</p>
                      <p className="font-semibold">{backup.retentionDays || 30} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-semibold capitalize">{backup.status}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {backup.status === 'completed' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadBackup(backup._id || backup.name)}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRestoreBackup(backup._id || backup.name)}
                          className="gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Restore
                        </Button>
                      </>
                    )}
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => setDeleteConfirm(backup._id || backup.name)}
                      className="gap-2 ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>

                    {deleteConfirm === (backup._id || backup.name) && (
                      <Alert className="col-span-full border-red-200 bg-red-50 mt-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          <p className="mb-2">Delete this backup permanently?</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteBackup(backup._id || backup.name)}
                            >
                              Delete
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Set appropriate backup frequency based on your RPO (Recovery Point Objective)</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Maintain sufficient retention periods for disaster recovery</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Test backup restoration regularly to ensure data integrity</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Store backups in geographically diverse locations</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Monitor backup storage costs and optimize retention policies</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
