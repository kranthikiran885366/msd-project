'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, Plus, Edit2, Trash2, Shield } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  // Permission categories
  const permissionCategories = [
    {
      category: 'Projects',
      permissions: [
        { id: 'projects.view', name: 'View Projects' },
        { id: 'projects.create', name: 'Create Projects' },
        { id: 'projects.edit', name: 'Edit Projects' },
        { id: 'projects.delete', name: 'Delete Projects' }
      ]
    },
    {
      category: 'Deployments',
      permissions: [
        { id: 'deployments.view', name: 'View Deployments' },
        { id: 'deployments.create', name: 'Create Deployments' },
        { id: 'deployments.rollback', name: 'Rollback Deployments' },
        { id: 'deployments.delete', name: 'Delete Deployments' }
      ]
    },
    {
      category: 'Databases',
      permissions: [
        { id: 'databases.view', name: 'View Databases' },
        { id: 'databases.create', name: 'Create Databases' },
        { id: 'databases.query', name: 'Query Databases' },
        { id: 'databases.backup', name: 'Backup Databases' },
        { id: 'databases.delete', name: 'Delete Databases' }
      ]
    },
    {
      category: 'Team Management',
      permissions: [
        { id: 'team.view', name: 'View Team' },
        { id: 'team.invite', name: 'Invite Members' },
        { id: 'team.manage_roles', name: 'Manage Roles' },
        { id: 'team.remove_members', name: 'Remove Members' }
      ]
    },
    {
      category: 'Billing & Settings',
      permissions: [
        { id: 'billing.view', name: 'View Billing' },
        { id: 'billing.manage', name: 'Manage Billing' },
        { id: 'settings.view', name: 'View Settings' },
        { id: 'settings.manage', name: 'Manage Settings' }
      ]
    }
  ];

  // Mock roles with default and custom
  const mockRoles = [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full access to all features and settings',
      type: 'default',
      memberCount: 2,
      permissions: permissionCategories.flatMap(cat => cat.permissions).map(p => p.id),
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'manager',
      name: 'Manager',
      description: 'Can manage projects, deployments, and team members',
      type: 'default',
      memberCount: 5,
      permissions: [
        'projects.view', 'projects.create', 'projects.edit',
        'deployments.view', 'deployments.create', 'deployments.rollback',
        'databases.view', 'databases.backup',
        'team.view', 'team.invite',
        'billing.view'
      ],
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'member',
      name: 'Member',
      description: 'Can view and contribute to projects and deployments',
      type: 'default',
      memberCount: 12,
      permissions: [
        'projects.view', 'projects.edit',
        'deployments.view', 'deployments.create',
        'databases.view', 'databases.query',
        'team.view',
        'billing.view'
      ],
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'viewer',
      name: 'Viewer',
      description: 'Read-only access to projects and deployments',
      type: 'default',
      memberCount: 8,
      permissions: [
        'projects.view',
        'deployments.view',
        'databases.view',
        'team.view',
        'billing.view'
      ],
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'custom-1',
      name: 'Deployment Engineer',
      description: 'Focused on deployments and infrastructure',
      type: 'custom',
      memberCount: 3,
      permissions: [
        'projects.view', 'projects.edit',
        'deployments.view', 'deployments.create', 'deployments.rollback',
        'databases.view', 'databases.backup', 'databases.delete',
        'team.view'
      ],
      createdAt: '2024-10-20T14:30:00Z'
    }
  ];

  useEffect(() => {
    setRoles(mockRoles);
    setLoading(false);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleCreateRole = async () => {
    if (!formData.name) {
      setError('Role name is required');
      return;
    }

    try {
      setError('');
      const response = await apiClient.createRole(formData);

      if (response.success) {
        const newRole = {
          id: `custom-${roles.length}`,
          ...formData,
          type: 'custom',
          memberCount: 0,
          createdAt: new Date().toISOString()
        };
        setRoles([...roles, newRole]);
        setSuccessMessage('Role created successfully');
        setFormData({
          name: '',
          description: '',
          permissions: []
        });
        setShowCreateForm(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to create role');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      setError('');
      const response = await apiClient.deleteRole(roleId);

      if (response.success) {
        setRoles(roles.filter(r => r.id !== roleId));
        setSuccessMessage('Role deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete role');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    );
  }

  const customRoles = roles.filter(r => r.type === 'custom').length;
  const totalMembers = roles.reduce((sum, r) => sum + r.memberCount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage team roles and access control</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Role
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Roles</p>
              <p className="text-3xl font-bold">{roles.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Custom Roles</p>
              <p className="text-3xl font-bold text-blue-600">{customRoles}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-3xl font-bold">{totalMembers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Default Roles</p>
              <p className="text-3xl font-bold">{roles.length - customRoles}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Role Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                placeholder="e.g., DevOps Engineer"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Describe the purpose of this role..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              {permissionCategories.map((category, idx) => (
                <div key={idx} className="space-y-2">
                  <p className="font-semibold text-sm text-muted-foreground">{category.category}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {category.permissions.map(perm => (
                      <label key={perm.id} className="flex items-center gap-2 p-2 border rounded hover:bg-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm.id)}
                          onChange={() => handlePermissionToggle(perm.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{perm.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreateRole} className="flex-1">
                Create Role
              </Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles List */}
      <div className="space-y-4">
        {roles.map(role => (
          <Card key={role.id} className="cursor-pointer hover:shadow-md transition" onClick={() => setSelectedRole(role)}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{role.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                  </div>
                  <Badge className={role.type === 'default' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                    {role.type === 'default' ? 'Default' : 'Custom'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted rounded text-sm">
                  <div>
                    <p className="text-muted-foreground">Members</p>
                    <p className="font-semibold">{role.memberCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Permissions</p>
                    <p className="font-semibold">{role.permissions.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-semibold capitalize">{role.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-semibold">{new Date(role.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Permission Tags */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Assigned Permissions:</p>
                  <div className="flex gap-2 flex-wrap">
                    {role.permissions.slice(0, 6).map(perm => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {perm.split('.').pop()}
                      </Badge>
                    ))}
                    {role.permissions.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>

                {role.type === 'custom' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role.id);
                      }}
                      className="gap-2 ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Matrix */}
      {selectedRole && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {selectedRole.name} - Permission Matrix
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRole(null)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {permissionCategories.map((category, idx) => (
                <div key={idx}>
                  <h4 className="font-semibold mb-2 text-sm">{category.category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {category.permissions.map(perm => (
                      <div key={perm.id} className="flex items-center gap-2 p-2 border rounded">
                        <div className={`w-4 h-4 rounded ${selectedRole.permissions.includes(perm.id) ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">{perm.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
