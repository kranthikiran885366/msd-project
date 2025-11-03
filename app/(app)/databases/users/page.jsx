'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2, Key, Shield, AlertCircle, CheckCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function DatabaseUsersPage() {
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    permissions: ['SELECT'],
    description: ''
  });

  const permissionOptions = [
    { value: 'SELECT', label: 'Read (SELECT)', description: 'Can read data from tables' },
    { value: 'INSERT', label: 'Insert (INSERT)', description: 'Can add new records' },
    { value: 'UPDATE', label: 'Update (UPDATE)', description: 'Can modify existing records' },
    { value: 'DELETE', label: 'Delete (DELETE)', description: 'Can remove records' },
    { value: 'CREATE', label: 'Create (CREATE)', description: 'Can create tables and indexes' },
    { value: 'DROP', label: 'Drop (DROP)', description: 'Can delete tables and indexes' },
    { value: 'ALL', label: 'All Privileges', description: 'Full database access' }
  ];

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    if (selectedDb) {
      fetchUsers();
    }
  }, [selectedDb]);

  const fetchDatabases = async () => {
    try {
      setError('');
      const response = await apiClient.getDatabases();
      if (response && Array.isArray(response)) {
        setDatabases(response);
        if (response.length > 0 && !selectedDb) {
          setSelectedDb(response[0]._id);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch databases');
    }
  };

  const fetchUsers = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await apiClient.getDatabaseUsers(selectedDb);
      if (response && Array.isArray(response)) {
        setUsers(response);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch database users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.username.trim() || !userForm.password.trim()) {
      setError('Username and password are required');
      return;
    }

    setCreating(true);
    try {
      setError('');
      const response = await apiClient.createDatabaseUser(selectedDb, userForm);
      
      if (response) {
        setSuccessMessage('Database user created successfully!');
        setUserForm({ username: '', password: '', permissions: ['SELECT'], description: '' });
        setShowCreateDialog(false);
        await fetchUsers();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create database user');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setError('');
      await apiClient.deleteDatabaseUser(selectedDb, userId);
      setSuccessMessage('Database user deleted successfully!');
      setDeleteConfirm(null);
      await fetchUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete database user');
    }
  };

  const handlePermissionChange = (permission) => {
    if (permission === 'ALL') {
      setUserForm({
        ...userForm,
        permissions: userForm.permissions.includes('ALL') ? [] : ['ALL']
      });
    } else {
      const newPermissions = userForm.permissions.includes(permission)
        ? userForm.permissions.filter(p => p !== permission && p !== 'ALL')
        : [...userForm.permissions.filter(p => p !== 'ALL'), permission];
      
      setUserForm({
        ...userForm,
        permissions: newPermissions
      });
    }
  };

  const getPermissionBadge = (permissions) => {
    if (permissions.includes('ALL')) {
      return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
    } else if (permissions.length > 3) {
      return <Badge className="bg-orange-100 text-orange-800">Power User</Badge>;
    } else if (permissions.includes('SELECT') && permissions.length === 1) {
      return <Badge className="bg-green-100 text-green-800">Read Only</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Limited</Badge>;
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserForm({ ...userForm, password });
  };

  if (loading && !selectedDb) {
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
          <h1 className="text-3xl font-bold">Database Users</h1>
          <p className="text-muted-foreground">Manage database users and their permissions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={!selectedDb}>
              <Plus className="w-4 h-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Database User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    placeholder="db_user"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={userForm.password}
                        onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                        placeholder="Enter password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button type="button" variant="outline" onClick={generatePassword}>
                      <Key className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {permissionOptions.map(option => (
                    <label key={option.value} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={userForm.permissions.includes(option.value)}
                        onChange={() => handlePermissionChange(option.value)}
                        className="w-4 h-4 mt-0.5"
                      />
                      <div>
                        <p className="font-semibold text-sm">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  value={userForm.description}
                  onChange={(e) => setUserForm({...userForm, description: e.target.value})}
                  placeholder="User description or notes..."
                  className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateUser} disabled={creating} className="flex-1">
                  {creating ? 'Creating...' : 'Create User'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

      {/* Users List */}
      {selectedDb && (
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <div className="animate-spin mx-auto mb-4"><RefreshCw className="w-8 h-8" /></div>
                <p className="text-muted-foreground">Loading database users...</p>
              </CardContent>
            </Card>
          ) : users.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No database users found</p>
                <p className="text-sm text-muted-foreground mt-2">Create a user to get started</p>
              </CardContent>
            </Card>
          ) : (
            users.map(user => (
              <Card key={user.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{user.username}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {getPermissionBadge(user.permissions)}
                            <Badge variant="outline" className={user.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                              {user.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Created: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                          {user.lastLogin && (
                            <p className="text-sm text-muted-foreground">
                              Last login: {new Date(user.lastLogin).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => setDeleteConfirm(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Permissions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {user.permissions.map(permission => (
                          <Badge key={permission} variant="secondary">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {deleteConfirm === user.id && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          <p className="mb-2">Delete user "{user.username}" permanently?</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
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
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Use strong, unique passwords for each database user</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Apply the principle of least privilege - grant only necessary permissions</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Regularly review and audit user permissions</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Remove or disable unused database accounts</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Monitor database access logs for suspicious activity</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}