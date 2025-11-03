'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Mail, Send, Copy, Trash2, Check, Clock, X } from 'lucide-react';

export default function TeamInvitationsPage() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [inviteProjects, setInviteProjects] = useState([]);

  const [pendingInvitations, setPendingInvitations] = useState([
    {
      id: 1,
      email: 'john@example.com',
      role: 'developer',
      sentBy: 'you@example.com',
      sentAt: '2024-11-15T10:30:00',
      expiresAt: '2024-11-22T10:30:00',
      status: 'pending'
    },
    {
      id: 2,
      email: 'sarah@example.com',
      role: 'admin',
      sentBy: 'you@example.com',
      sentAt: '2024-11-14T14:20:00',
      expiresAt: '2024-11-21T14:20:00',
      status: 'pending'
    },
    {
      id: 3,
      email: 'mike@example.com',
      role: 'viewer',
      sentBy: 'team-lead@example.com',
      sentAt: '2024-11-13T09:15:00',
      expiresAt: '2024-11-20T09:15:00',
      status: 'accepted'
    },
  ]);

  const [teamMembers] = useState([
    {
      id: 1,
      name: 'You',
      email: 'you@example.com',
      role: 'Owner',
      joinedAt: '2024-01-15',
      status: 'active',
      avatar: '👤'
    },
    {
      id: 2,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'Admin',
      joinedAt: '2024-02-20',
      status: 'active',
      avatar: '👩'
    },
    {
      id: 3,
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'Developer',
      joinedAt: '2024-03-10',
      status: 'active',
      avatar: '👨'
    },
  ]);

  const [invitationLink, setInvitationLink] = useState('https://deployer.dev/invite/team_abc123xyz789');
  const [linkExpiry, setLinkExpiry] = useState('30 days');

  const roles = [
    { value: 'owner', label: 'Owner', description: 'Full access to all settings' },
    { value: 'admin', label: 'Admin', description: 'Manage team and projects' },
    { value: 'developer', label: 'Developer', description: 'Deploy and manage projects' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
  ];

  const projects = [
    { id: 1, name: 'API Server' },
    { id: 2, name: 'Web Dashboard' },
    { id: 3, name: 'Mobile App' },
    { id: 4, name: 'Database Migration' },
  ];

  const handleSendInvite = () => {
    if (inviteEmail) {
      const newInvite = {
        id: Math.max(...pendingInvitations.map(i => i.id), 0) + 1,
        email: inviteEmail,
        role: inviteRole,
        sentBy: 'you@example.com',
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      };
      setPendingInvitations([...pendingInvitations, newInvite]);
      setInviteEmail('');
      setInviteRole('developer');
      setInviteProjects([]);
    }
  };

  const handleCancelInvite = (id) => {
    setPendingInvitations(pendingInvitations.filter(inv => inv.id !== id));
  };

  const handleResendInvite = (id) => {
    // Resend logic here
    alert('Invitation resent to ' + pendingInvitations.find(i => i.id === id).email);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink);
    alert('Invitation link copied to clipboard!');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Team Management</h1>
        <p className="text-gray-600">Invite team members and manage their roles and permissions</p>
      </div>

      <Tabs defaultValue="invite" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="invite">Send Invite</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingInvitations.filter(i => i.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="members">Members ({teamMembers.length})</TabsTrigger>
          <TabsTrigger value="link">Invite Link</TabsTrigger>
        </TabsList>

        {/* Send Invite Tab */}
        <TabsContent value="invite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" /> Send Team Invitation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium block mb-2">Email Address</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-3">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => (
                    <div
                      key={role.value}
                      onClick={() => setInviteRole(role.value)}
                      className={`p-3 border rounded-lg cursor-pointer transition ${
                        inviteRole === role.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium">{role.label}</p>
                      <p className="text-xs text-gray-600">{role.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-3">Project Access (Optional)</label>
                <p className="text-sm text-gray-600 mb-3">Leave empty to grant access to all projects</p>
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`project-${project.id}`}
                        checked={inviteProjects.includes(project.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setInviteProjects([...inviteProjects, project.id]);
                          } else {
                            setInviteProjects(inviteProjects.filter(p => p !== project.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`project-${project.id}`} className="text-sm">{project.name}</label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSendInvite} className="w-full" size="lg">
                <Mail className="w-4 h-4 mr-2" /> Send Invitation
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm">
                <span className="font-medium">Tip:</span> Invitations expire after 7 days. The invited user will receive an email with a secure link to accept the invitation.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Invitations Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingInvitations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No pending invitations
              </CardContent>
            </Card>
          ) : (
            pendingInvitations.map((invite) => (
              <Card key={invite.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{invite.email}</p>
                          <p className="text-sm text-gray-600">
                            Sent {new Date(invite.sentAt).toLocaleDateString()} by {invite.sentBy}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Badge className="bg-blue-100 text-blue-800">
                          {roles.find(r => r.value === invite.role)?.label}
                        </Badge>
                        {invite.status === 'accepted' ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" /> Accepted
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Expires {new Date(invite.expiresAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {invite.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendInvite(invite.id)}
                          >
                            Resend
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will cancel the invitation to {invite.email}. They won't be able to join with this link.
                              </AlertDialogDescription>
                              <div className="flex gap-3">
                                <AlertDialogCancel>Keep</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelInvite(invite.id)} className="bg-red-600">
                                  Cancel Invitation
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="members" className="space-y-4">
          {teamMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{member.avatar}</div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-xs text-gray-500 mt-1">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge>
                      {member.role}
                    </Badge>
                    <Badge className={member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {member.status === 'active' ? '● Active' : '● Inactive'}
                    </Badge>
                    {member.id !== 1 && (
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Invite Link Tab */}
        <TabsContent value="link" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" /> Team Invitation Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium block mb-2">Shareable Link</label>
                <div className="flex gap-2">
                  <Input
                    value={invitationLink}
                    readOnly
                    className="bg-gray-50"
                  />
                  <Button onClick={copyToClipboard} size="icon">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2">Anyone with this link can join the team as a Developer. Link expires in {linkExpiry}.</p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Default Role for Link</label>
                <select className="w-full px-3 py-2 border rounded">
                  <option>Developer</option>
                  <option>Viewer</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Link Expiry</label>
                <select
                  value={linkExpiry}
                  onChange={(e) => setLinkExpiry(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option>7 days</option>
                  <option>30 days</option>
                  <option>90 days</option>
                  <option>Never expires</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">Generate New Link</Button>
                <Button className="flex-1" variant="outline">Disable Link</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm">
                <span className="font-medium">Security Note:</span> Regenerating the link will invalidate the old one. Only share this link with people you trust.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
