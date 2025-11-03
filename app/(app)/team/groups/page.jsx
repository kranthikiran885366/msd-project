'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Plus, Edit2, Trash2, Users, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function TeamGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentGroup: null
  });

  // Mock team groups
  const mockGroups = [
    {
      id: 'group-1',
      name: 'Engineering',
      description: 'All engineering team members',
      memberCount: 12,
      subGroups: 2,
      parentGroup: null,
      createdAt: '2024-01-10T09:00:00Z',
      members: [
        { id: 'user-1', name: 'John Doe', email: 'john@company.com', role: 'manager' },
        { id: 'user-2', name: 'Sarah Lee', email: 'sarah@company.com', role: 'member' },
        { id: 'user-3', name: 'Mike Johnson', email: 'mike@company.com', role: 'member' }
      ]
    },
    {
      id: 'group-2',
      name: 'Frontend Team',
      description: 'Frontend development team',
      memberCount: 5,
      subGroups: 0,
      parentGroup: 'group-1',
      createdAt: '2024-02-15T14:30:00Z',
      members: [
        { id: 'user-4', name: 'Jane Smith', email: 'jane@company.com', role: 'lead' },
        { id: 'user-5', name: 'Tom Williams', email: 'tom@company.com', role: 'member' }
      ]
    },
    {
      id: 'group-3',
      name: 'Backend Team',
      description: 'Backend development team',
      memberCount: 7,
      subGroups: 0,
      parentGroup: 'group-1',
      createdAt: '2024-02-15T14:35:00Z',
      members: [
        { id: 'user-6', name: 'Emily Davis', email: 'emily@company.com', role: 'lead' }
      ]
    },
    {
      id: 'group-4',
      name: 'DevOps',
      description: 'Infrastructure and DevOps team',
      memberCount: 4,
      subGroups: 0,
      parentGroup: null,
      createdAt: '2024-01-20T11:00:00Z',
      members: [
        { id: 'user-7', name: 'Chris Brown', email: 'chris@company.com', role: 'manager' }
      ]
    },
    {
      id: 'group-5',
      name: 'Product',
      description: 'Product management team',
      memberCount: 3,
      subGroups: 0,
      parentGroup: null,
      createdAt: '2024-03-01T10:15:00Z',
      members: [
        { id: 'user-8', name: 'Lisa Anderson', email: 'lisa@company.com', role: 'manager' }
      ]
    }
  ];

  useEffect(() => {
    setGroups(mockGroups);
    setLoading(false);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setError('');
      const response = await apiClient.createGroup(formData);

      if (response.success) {
        const newGroup = {
          id: `group-${groups.length + 1}`,
          name: formData.name,
          description: formData.description,
          memberCount: 0,
          subGroups: 0,
          parentGroup: formData.parentGroup,
          createdAt: new Date().toISOString(),
          members: []
        };
        setGroups([...groups, newGroup]);
        setSuccessMessage('Group created successfully');
        setFormData({ name: '', description: '', parentGroup: null });
        setShowCreateForm(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to create group');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      const response = await apiClient.deleteGroup(groupId);

      if (response.success) {
        setGroups(groups.filter(g => g.id !== groupId));
        setSuccessMessage('Group deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete group');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleUpdateGroup = async (groupId, updates) => {
    try {
      setError('');
      const response = await apiClient.updateGroup(groupId, updates);

      if (response.success) {
        setGroups(groups.map(g => 
          g.id === groupId ? {...g, ...updates} : g
        ));
        setSuccessMessage('Group updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to update group');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleAddMember = async (groupId, memberId) => {
    try {
      setError('');
      const response = await apiClient.addGroupMember(groupId, memberId);

      if (response.success) {
        setSuccessMessage('Member added to group');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to add member');
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

  const topLevelGroups = groups.filter(g => !g.parentGroup);
  const totalMembers = groups.reduce((sum, g) => sum + g.memberCount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Team Groups</h1>
          <p className="text-muted-foreground">Organize team members into groups and departments</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Group
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Groups</p>
              <p className="text-3xl font-bold">{groups.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Top-level Groups</p>
              <p className="text-3xl font-bold">{topLevelGroups.length}</p>
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
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Engineering, Sales, Support"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of the group"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Parent Group (Optional)</Label>
              <select
                id="parent"
                value={formData.parentGroup || ''}
                onChange={(e) => handleInputChange('parentGroup', e.target.value || null)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">None (Top-level group)</option>
                {topLevelGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreateGroup} className="flex-1">Create Group</Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Groups List */}
      <div className="space-y-4">
        {topLevelGroups.map(group => (
          <Card key={group.id} className="hover:shadow-md transition">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                {/* Group Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold">{group.name}</h3>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </div>
                  </div>

                  {/* Group Stats */}
                  <div className="mt-4 flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{group.memberCount}</span>
                      <span className="text-muted-foreground">members</span>
                    </div>
                    {group.subGroups > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{group.subGroups}</span>
                        <span className="text-muted-foreground">sub-groups</span>
                      </div>
                    )}
                    <div className="text-muted-foreground">
                      Created {new Date(group.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Members Preview */}
                  {group.members.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-semibold mb-2">Members:</p>
                      <div className="flex flex-wrap gap-2">
                        {group.members.map(member => (
                          <Badge key={member.id} variant="secondary">
                            {member.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowMembersDialog(true);
                    }}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sub-groups Section */}
      {groups.filter(g => g.parentGroup).length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Sub-Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.filter(g => g.parentGroup).map(group => (
              <Card key={group.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">{group.name}</h4>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <Badge variant="outline">{group.memberCount} members</Badge>
                      <Badge variant="outline">
                        Parent: {groups.find(g => g.id === group.parentGroup)?.name}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedGroup(group);
                        setShowMembersDialog(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Members Dialog */}
      {showMembersDialog && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-96 overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{selectedGroup.name} - Members</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMembersDialog(false)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent>
              {selectedGroup.members.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No members in this group yet</p>
              ) : (
                <div className="space-y-3">
                  {selectedGroup.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge>{member.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
