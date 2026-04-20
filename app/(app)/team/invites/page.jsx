'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Mail, RefreshCw, RotateCw, Clock, Calendar, X } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAppStore } from '@/store/use-app-store';

export default function InvitationsPage() {
  const { projects } = useAppStore();
  const projectId = projects[0]?.id || projects[0]?._id || '';
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const normalizeInvitation = (invitation) => ({
    id: invitation._id || invitation.id,
    email: invitation.email || invitation.inviteeEmail || '',
    role: invitation.role || 'member',
    status: invitation.status || 'pending',
    sentAt: invitation.createdAt || invitation.sentAt || new Date().toISOString(),
    expiresAt: invitation.expiresAt || invitation.inviteExpiresAt || null,
    sentBy: invitation.createdBy || invitation.sentBy || { name: 'System' },
    acceptedAt: invitation.acceptedAt || null,
    clickCount: invitation.clickCount || 0,
    lastClicked: invitation.lastClickedAt || invitation.lastClicked || null,
  });

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError('');

      if (!projectId) {
        setInvitations([]);
        return;
      }

      const response = await apiClient.getTeamInvitations(projectId);
      const records = response?.data || response || [];
      setInvitations(Array.isArray(records) ? records.map(normalizeInvitation) : []);
    } catch (err) {
      setError(err.message || 'Failed to load invitations');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const handleResendInvitation = async (invitationId) => {
    try {
      setError('');
      await apiClient.resendInvitation(invitationId);
      await loadInvitations();
      setSuccessMessage('Invitation resent successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      setError('');
      await apiClient.cancelInvitation(invitationId);
      setInvitations((current) => current.filter((invitation) => invitation.id !== invitationId));
      setSuccessMessage('Invitation cancelled successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to cancel invitation');
    }
  };

  const filteredInvitations = useMemo(() => {
    return filterStatus === 'all'
      ? invitations
      : invitations.filter((invitation) => invitation.status === filterStatus);
  }, [filterStatus, invitations]);

  const pendingCount = invitations.filter((invitation) => invitation.status === 'pending').length;
  const acceptedCount = invitations.filter((invitation) => invitation.status === 'accepted').length;
  const expiredCount = invitations.filter((invitation) => invitation.status === 'expired').length;

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

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false;
    const daysRemaining = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    return daysRemaining <= 2 && daysRemaining > 0;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Invitations</h1>
        <p className="text-muted-foreground">Manage pending member invitations</p>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="space-y-2"><p className="text-sm text-muted-foreground">Total Invitations</p><p className="text-3xl font-bold">{invitations.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="space-y-2"><p className="text-sm text-muted-foreground">Pending</p><p className="text-3xl font-bold text-orange-600">{pendingCount}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="space-y-2"><p className="text-sm text-muted-foreground">Accepted</p><p className="text-3xl font-bold text-green-600">{acceptedCount}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="space-y-2"><p className="text-sm text-muted-foreground">Expired</p><p className="text-3xl font-bold text-red-600">{expiredCount}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <span>Invitations</span>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="expired">Expired</option>
            </select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInvitations.length > 0 ? filteredInvitations.map((invitation) => (
              <div key={invitation.id} className={`p-4 border rounded-lg ${roleColors[invitation.role] || ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <p className="font-semibold break-all">{invitation.email}</p>
                      <Badge className={statusColors[invitation.status] || statusColors.pending}>{invitation.status}</Badge>
                      <Badge variant="outline">{invitation.role}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Sent {new Date(invitation.sentAt).toLocaleString()}</p>
                      {invitation.expiresAt && (
                        <p className={`flex items-center gap-2 ${isExpiringSoon(invitation.expiresAt) ? 'text-orange-600' : ''}`}>
                          <Clock className="w-4 h-4" /> Expires {new Date(invitation.expiresAt).toLocaleString()}
                        </p>
                      )}
                      <p>Sent by {invitation.sentBy?.name || 'System'}</p>
                      <p>Clicks: {invitation.clickCount}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {invitation.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => handleResendInvitation(invitation.id)} className="gap-1">
                        <RotateCw className="w-4 h-4" />
                        Resend
                      </Button>
                    )}
                    {invitation.status === 'pending' && (
                      <Button size="sm" variant="ghost" onClick={() => handleCancelInvitation(invitation.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-muted-foreground">No invitations found for the selected filter.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
