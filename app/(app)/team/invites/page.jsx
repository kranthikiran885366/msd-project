'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Mail, Trash2, RefreshCw, RotateCw, Clock, Calendar } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock invitations
  const mockInvitations = [
    {
      id: 'inv-1',
      email: 'dev1@example.com',
      role: 'member',
      status: 'pending',
      sentAt: '2024-12-18T14:30:00Z',
      expiresAt: '2024-12-25T14:30:00Z',
      sentBy: { id: 'user-1', name: 'John Doe' },
      acceptedAt: null,
      clickCount: 2,
      lastClicked: '2024-12-20T10:15:00Z'
    },
    {
      id: 'inv-2',
      email: 'lead@example.com',
      role: 'manager',
      status: 'accepted',
      sentAt: '2024-12-10T09:00:00Z',
      expiresAt: '2024-12-17T09:00:00Z',
      sentBy: { id: 'user-1', name: 'John Doe' },
      acceptedAt: '2024-12-12T16:45:00Z',
      clickCount: 1,
      lastClicked: '2024-12-12T16:45:00Z'
    },
    {
      id: 'inv-3',
      email: 'contractor@example.com',
      role: 'viewer',
      status: 'pending',
      sentAt: '2024-12-19T11:20:00Z',
      expiresAt: '2024-12-26T11:20:00Z',
      sentBy: { id: 'user-2', name: 'Sarah Lee' },
      acceptedAt: null,
      clickCount: 0,
      lastClicked: null
    },
    {
      id: 'inv-4',
      email: 'partner@external.com',
      role: 'member',
      status: 'expired',
      sentAt: '2024-11-15T08:00:00Z',
      expiresAt: '2024-11-22T08:00:00Z',
      sentBy: { id: 'user-1', name: 'John Doe' },
      acceptedAt: null,
      clickCount: 0,
      lastClicked: null
    },
    {
      id: 'inv-5',
      email: 'analyst@example.com',
      role: 'member',
      status: 'pending',
      sentAt: '2024-12-17T15:30:00Z',
      expiresAt: '2024-12-24T15:30:00Z',
      sentBy: { id: 'user-2', name: 'Sarah Lee' },
      acceptedAt: null,
      clickCount: 3,
      lastClicked: '2024-12-20T09:00:00Z'
    },
    {
      id: 'inv-6',
      email: 'designer@example.com',
      role: 'member',
      status: 'accepted',
      sentAt: '2024-12-05T10:00:00Z',
      expiresAt: '2024-12-12T10:00:00Z',
      sentBy: { id: 'user-1', name: 'John Doe' },
      acceptedAt: '2024-12-06T14:20:00Z',
      clickCount: 1,
      lastClicked: '2024-12-06T14:20:00Z'
    }
  ];

  useEffect(() => {
    setInvitations(mockInvitations);
    setLoading(false);
  }, []);

  const handleResendInvitation = async (invitationId) => {
    try {
      setError('');
      const response = await apiClient.resendInvitation(invitationId);

      if (response.success) {
        setInvitations(invitations.map(inv =>
          inv.id === invitationId
            ? {...inv, sentAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}
            : inv
        ));
        setSuccessMessage('Invitation resent successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to resend invitation');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      setError('');
      const response = await apiClient.cancelInvitation(invitationId);

      if (response.success) {
        setInvitations(invitations.filter(inv => inv.id !== invitationId));
        setSuccessMessage('Invitation cancelled successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to cancel invitation');
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

  const filteredInvitations = filterStatus === 'all'
    ? invitations
    : invitations.filter(inv => inv.status === filterStatus);

  const pendingCount = invitations.filter(inv => inv.status === 'pending').length;
  const acceptedCount = invitations.filter(inv => inv.status === 'accepted').length;
  const expiredCount = invitations.filter(inv => inv.status === 'expired').length;

  const statusColors = {
    pending: 'bg-orange-100 text-orange-800',
    accepted: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800'
  };

  const roleColors = {
    admin: 'bg-red-50',
    manager: 'bg-blue-50',
    member: 'bg-green-50',
    viewer: 'bg-gray-50'
  };

  const daysDiff = (date1, date2) => {
    const diff = (new Date(date2) - new Date(date1)) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  };

  const isExpiringSoon = (expiresAt) => {
    const days = daysDiff(new Date(), expiresAt);
    return days <= 2 && days > 0;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Team Invitations</h1>
        <p className="text-muted-foreground">Manage pending member invitations</p>
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
              <p className="text-sm text-muted-foreground">Total Invitations</p>
              <p className="text-3xl font-bold">{invitations.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Accepted</p>
              <p className="text-3xl font-bold text-green-600">{acceptedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Expired</p>
              <p className="text-3xl font-bold text-red-600">{expiredCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {['all', 'pending', 'accepted', 'expired'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
              filterStatus === status
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === 'all' && ` (${invitations.length})`}
            {status === 'pending' && ` (${pendingCount})`}
            {status === 'accepted' && ` (${acceptedCount})`}
            {status === 'expired' && ` (${expiredCount})`}
          </button>
        ))}
      </div>

      {/* Invitations List */}
      <div className="space-y-3">
        {filteredInvitations.map(invitation => (
          <Card key={invitation.id} className={`hover:shadow-md transition ${roleColors[invitation.role]}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                {/* Invitation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-semibold text-sm">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold break-all">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">Invited by {invitation.sentBy.name}</p>
                    </div>
                  </div>

                  {/* Status and Role */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={statusColors[invitation.status]}>
                      {invitation.status}
                    </Badge>
                    <Badge variant="outline">{invitation.role}</Badge>
                    {isExpiringSoon(invitation.expiresAt) && invitation.status === 'pending' && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires soon
                      </Badge>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t text-xs">
                    <div>
                      <p className="text-muted-foreground">Sent</p>
                      <p className="font-semibold">{new Date(invitation.sentAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expires</p>
                      <p className={`font-semibold ${isExpiringSoon(invitation.expiresAt) && invitation.status === 'pending' ? 'text-red-600' : ''}`}>
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Link Clicks</p>
                      <p className="font-semibold">{invitation.clickCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Activity</p>
                      <p className="font-semibold">
                        {invitation.lastClicked ? new Date(invitation.lastClicked).toLocaleDateString() : 'None'}
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {invitation.status === 'accepted' && invitation.acceptedAt && (
                    <div className="mt-2 pt-2 border-t text-xs">
                      <p className="text-muted-foreground">Accepted on {new Date(invitation.acceptedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {invitation.status === 'pending' && (
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResendInvitation(invitation.id)}
                      className="gap-1"
                    >
                      <RotateCw className="w-4 h-4" />
                      Resend
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {invitation.status !== 'pending' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCancelInvitation(invitation.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInvitations.length === 0 && (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-muted-foreground">No invitations found with status: {filterStatus}</p>
          </CardContent>
        </Card>
      )}

      {/* Invitation Management Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Invitation Management Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold mb-1">Track Engagement</p>
            <p className="text-muted-foreground">Monitor link clicks and last activity to ensure recipients receive and view your invitations.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Expiration Policy</p>
            <p className="text-muted-foreground">Invitations expire after 7 days. Resend expiring invitations to extend the deadline.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Best Practices</p>
            <p className="text-muted-foreground">Send invitations from the organization email address and include a welcome message with next steps in your email provider.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
