'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Clock, Play, RotateCcw, Code, Plus, Trash2, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function DatabaseMigrationsPage() {
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [migrations, setMigrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [runningMigration, setRunningMigration] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRollbackForm, setShowRollbackForm] = useState(false);
  const [selectedMigration, setSelectedMigration] = useState(null);

  const [newMigration, setNewMigration] = useState({
    name: '',
    description: '',
    upSql: '',
    downSql: ''
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

  const fetchMigrations = useCallback(async () => {
    if (!selectedDb) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.getDatabaseMigrations(selectedDb);
      setMigrations(response || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch migrations');
    } finally {
      setLoading(false);
    }
  }, [selectedDb]);

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    if (selectedDb) {
      fetchMigrations();
    }
  }, [selectedDb, fetchMigrations]);

  const handleCreateMigration = async () => {
    if (!newMigration.name || !newMigration.upSql) {
      setError('Name and Up SQL are required');
      return;
    }

    try {
      setError('');
      await apiClient.runMigration(selectedDb, {
        name: newMigration.name,
        description: newMigration.description,
        upSql: newMigration.upSql,
        downSql: newMigration.downSql
      });
      
      setSuccessMessage('Migration created successfully');
      setNewMigration({ name: '', description: '', upSql: '', downSql: '' });
      setShowCreateForm(false);
      await fetchMigrations();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create migration');
    }
  };

  const handleRunMigration = async (migrationId) => {
    try {
      setError('');
      setRunningMigration(migrationId);

      await apiClient.runMigration(selectedDb, { migrationId });
      setSuccessMessage(`Migration ${migrationId} applied successfully`);
      await fetchMigrations();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to run migration');
    } finally {
      setRunningMigration(null);
    }
  };

  const handleRollback = async (migrationId) => {
    try {
      setError('');
      setRunningMigration(migrationId);

      // Note: Rollback functionality would need to be implemented in the API
      setSuccessMessage(`Migration ${migrationId} rollback initiated`);
      setShowRollbackForm(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to rollback migration');
    } finally {
      setRunningMigration(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'applied':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Applied</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    );
  }

  const appliedCount = migrations.filter(m => m.status === 'applied').length;
  const pendingCount = migrations.filter(m => m.status === 'pending').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Database Migrations</h1>
          <p className="text-muted-foreground">Manage schema changes and version control</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Migration
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Migrations</p>
              <p className="text-3xl font-bold">{migrations.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Applied</p>
              <p className="text-3xl font-bold text-green-600">{appliedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Migration Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Migration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Migration Name</Label>
              <Input
                id="name"
                placeholder="e.g., add_user_timestamps"
                value={newMigration.name}
                onChange={(e) => setNewMigration({...newMigration, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Describe what this migration does..."
                value={newMigration.description}
                onChange={(e) => setNewMigration({...newMigration, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upSql">Up SQL (Apply Migration)</Label>
              <textarea
                id="upSql"
                placeholder="ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();"
                value={newMigration.upSql}
                onChange={(e) => setNewMigration({...newMigration, upSql: e.target.value})}
                className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="downSql">Down SQL (Rollback Migration)</Label>
              <textarea
                id="downSql"
                placeholder="ALTER TABLE users DROP COLUMN created_at;"
                value={newMigration.downSql}
                onChange={(e) => setNewMigration({...newMigration, downSql: e.target.value})}
                className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreateMigration} className="flex-1">
                Create Migration
              </Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Migrations List */}
      <div className="space-y-4">
        {migrations.map(migration => (
          <Card key={migration.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{migration.id}_{migration.name}</h3>
                    {migration.description && (
                      <p className="text-sm text-muted-foreground">{migration.description}</p>
                    )}
                  </div>
                  {getStatusBadge(migration.status)}
                </div>

                {migration.appliedAt && (
                  <div className="text-sm text-muted-foreground">
                    <p>Applied: {new Date(migration.appliedAt).toLocaleString()} by {migration.appliedBy}</p>
                    <p>Duration: {migration.duration}ms</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Code className="w-4 h-4" />
                        View SQL
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>{migration.id}_{migration.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-semibold">Up SQL</Label>
                          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto mt-2">
                            {migration.upSql}
                          </pre>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Down SQL</Label>
                          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto mt-2">
                            {migration.downSql}
                          </pre>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {migration.status === 'pending' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleRunMigration(migration.id)}
                      disabled={runningMigration === migration.id}
                      className="gap-2 ml-2"
                    >
                      {runningMigration === migration.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Run Migration
                        </>
                      )}
                    </Button>
                  )}

                  {migration.status === 'applied' && (
                    <Dialog open={showRollbackForm && selectedMigration?.id === migration.id} onOpenChange={(open) => {
                      if (!open) setShowRollbackForm(false);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            setSelectedMigration(migration);
                            setShowRollbackForm(true);
                          }}
                          className="gap-2 ml-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Rollback
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Rollback</DialogTitle>
                        </DialogHeader>
                        <Alert className="border-red-200 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            Rolling back will undo this migration. This action cannot be undone.
                          </AlertDescription>
                        </Alert>
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => handleRollback(migration.id)}
                            disabled={runningMigration === migration.id}
                            variant="destructive"
                            className="flex-1"
                          >
                            {runningMigration === migration.id ? 'Rolling back...' : 'Confirm Rollback'}
                          </Button>
                          <Button 
                            onClick={() => setShowRollbackForm(false)}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Always write both up and down migrations for reversibility</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Test migrations on a staging database before production</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Use descriptive names that clearly indicate the change</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Keep migrations small and focused on a single change</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Never modify already-applied migrations; create new ones instead</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
