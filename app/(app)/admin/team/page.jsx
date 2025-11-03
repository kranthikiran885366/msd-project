'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, ChevronRight, AlertCircle } from 'lucide-react';

export default function TeamPermissionsPage() {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/team', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch team data');
      }
      
      const data = await response.json();
      setTeamData(data);
    } catch (error) {
      console.error('Error fetching team data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error loading team data: {error}</p>
          <Button onClick={fetchTeamData}>Retry</Button>
        </div>
      </div>
    );
  }

  const { members = [], teams = [], invitations = [] } = teamData || {};

  // Fallback data
  const fallbackMembers = [
    { id: 1, name: 'Sarah Chen', email: 'sarah@company.com', role: 'Admin', status: 'active', joinedDate: '90 days ago' },
    { id: 2, name: 'Alex Rodriguez', email: 'alex@company.com', role: 'Developer', status: 'active', joinedDate: '60 days ago' },
    { id: 3, name: 'Jordan Kim', email: 'jordan@company.com', role: 'Viewer', status: 'active', joinedDate: '30 days ago' },
  ];

  const fallbackTeams = [
    { id: 1, name: 'Platform Engineers', members: 8, permissions: ['deploy', 'read:logs', 'read:projects'], created: '120 days ago' },
    { id: 2, name: 'DevOps Team', members: 5, permissions: ['deploy', 'read:logs', 'read:projects', 'write:projects', 'read:metrics'], created: '90 days ago' },
  ];

  const teamMembers = members.length > 0 ? members : fallbackMembers;
  const teamGroups = teams.length > 0 ? teams : fallbackTeams;

  const roles = [
    { value: 'admin', label: 'Admin', description: 'Full access to all features', permissions: ['deploy', 'read:logs', 'read:projects', 'write:projects', 'read:metrics', 'admin'] },
    { value: 'developer', label: 'Developer', description: 'Deploy and view logs', permissions: ['deploy', 'read:logs', 'read:projects'] },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access', permissions: ['read:logs', 'read:projects', 'read:metrics'] },
    { value: 'billing', label: 'Billing', description: 'Manage billing and subscriptions', permissions: ['read:billing', 'write:billing'] },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Team & Permissions</h1>
        <Button><Plus className="w-4 h-4 mr-2" /> Invite Member</Button>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>

        {/* Team Members */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members ({teamMembers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <Card key={member.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-xs text-gray-600">{member.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge>{member.role}</Badge>
                            <Badge variant="outline" className="text-green-700 border-green-300">Active</Badge>
                            <span className="text-xs text-gray-600">Joined {member.joinedDate}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { setSelectedMember(member); setShowDeleteDialog(true); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(invitations.length > 0 ? invitations : [
                  { email: 'newdev@company.com', role: 'Developer', invitedBy: 'Sarah Chen', invitedDate: '2 days ago' },
                  { email: 'qa@company.com', role: 'Viewer', invitedBy: 'Alex Rodriguez', invitedDate: '1 day ago' },
                ]).map((invite, idx) => (
                  <Card key={idx} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{invite.email}</p>
                          <p className="text-xs text-gray-600">Role: {invite.role} • Invited by {invite.invitedBy} • {invite.invitedDate}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Resend</Button>
                          <Button size="sm" variant="ghost" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams */}
        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teams ({teamGroups.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamGroups.map((team) => (
                  <Card key={team.id} className="border cursor-pointer hover:bg-gray-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{team.name}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>{team.members} members</span>
                            <span>Created {team.created}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {team.permissions.map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">{perm}</Badge>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Create New Team */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Team Name</label>
                <Input placeholder="e.g., Infrastructure Team" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Input placeholder="Team description" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Default Role</label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button>Create Team</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles & Permissions */}
        <TabsContent value="roles" className="space-y-4">
          {roles.map((role) => (
            <Card key={role.value}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{role.label}</CardTitle>
                  <Button size="sm" variant="ghost">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{role.description}</p>
                <div>
                  <p className="text-sm font-semibold mb-3">Permissions:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {role.permissions.map((perm) => (
                      <div key={perm} className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 rounded bg-green-100 border border-green-300 flex items-center justify-center">
                          <span className="text-green-700 font-bold text-xs">✓</span>
                        </div>
                        <span>{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Permission Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Permission Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { perm: 'deploy', desc: 'Create and manage deployments' },
                  { perm: 'read:logs', desc: 'View deployment logs' },
                  { perm: 'read:projects', desc: 'View projects and configurations' },
                  { perm: 'write:projects', desc: 'Create and modify projects' },
                  { perm: 'read:metrics', desc: 'View performance metrics and analytics' },
                  { perm: 'read:billing', desc: 'View billing information' },
                  { perm: 'write:billing', desc: 'Manage billing and subscriptions' },
                  { perm: 'admin', desc: 'Full administrative access' },
                ].map((item) => (
                  <div key={item.perm} className="flex gap-3 p-2 border-b last:border-0">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-shrink-0">{item.perm}</code>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedMember?.name} from the team? They will lose access to all projects and deployments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
