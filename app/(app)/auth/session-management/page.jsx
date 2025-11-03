'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle, Smartphone, Globe, Trash2, MapPin, Clock, Shield } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function SessionManagementPage() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [terminatingId, setTerminatingId] = useState(null);

  // Fetch sessions on load
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setError('');
        const response = await apiClient.getSessions();
        
        if (response.success) {
          setSessions(response.data || []);
          
          // Set current session (the one with isCurrentSession flag)
          const current = response.data?.find(s => s.isCurrentSession);
          if (current) setCurrentSession(current);
        } else {
          setError(response.error || 'Failed to fetch sessions');
        }
      } catch (err) {
        setError(err.message || 'An error occurred');
        console.error('Failed to fetch sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Terminate session
  const handleTerminateSession = async (sessionId) => {
    if (!confirm('Are you sure you want to terminate this session? The user will be logged out.')) {
      return;
    }

    try {
      setError('');
      setTerminatingId(sessionId);
      
      const response = await apiClient.terminateSession(sessionId);
      
      if (response.success) {
        setSuccessMessage('Session terminated successfully');
        setSessions(sessions.filter(s => s.id !== sessionId));
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to terminate session');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Failed to terminate session:', err);
    } finally {
      setTerminatingId(null);
    }
  };

  // Terminate all other sessions
  const handleTerminateAllOther = async () => {
    if (!confirm('This will log out all other sessions. Are you sure?')) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      const response = await apiClient.terminateAllOtherSessions();
      
      if (response.success) {
        setSuccessMessage('All other sessions terminated');
        setSessions(sessions.filter(s => s.isCurrentSession));
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to terminate sessions');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Failed to terminate sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get device icon
  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'desktop':
        return <Globe className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get time ago
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  const otherSessions = sessions.filter(s => !s.isCurrentSession);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Session Management</h1>
        <p className="text-muted-foreground">
          View and manage all your active sessions across devices
        </p>
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

      {/* Security Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          If you see any unfamiliar sessions, terminate them immediately and change your password.
        </AlertDescription>
      </Alert>

      {/* Current Session */}
      {currentSession && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Current Session</CardTitle>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Active
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center">
                  {getDeviceIcon(currentSession.deviceType)}
                </div>
                <div>
                  <p className="font-medium">{currentSession.deviceName}</p>
                  <p className="text-sm text-muted-foreground">{currentSession.browser}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {currentSession.location}
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Last active: {getTimeAgo(currentSession.lastActivityAt)}
                </p>
              </div>

              <div className="md:col-span-2 text-xs text-muted-foreground">
                <p>Created: {formatDate(currentSession.createdAt)}</p>
                <p>IP Address: {currentSession.ipAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Other Sessions</h2>
          {otherSessions.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleTerminateAllOther}
              disabled={loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Terminate All
            </Button>
          )}
        </div>

        {otherSessions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No other active sessions</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {otherSessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left side */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted border flex items-center justify-center">
                          {getDeviceIcon(session.deviceType)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{session.deviceName}</p>
                          <p className="text-sm text-muted-foreground">{session.browser}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>{session.location}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>Last active: {getTimeAgo(session.lastActivityAt)}</span>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="space-y-3">
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <p>Created: {formatDate(session.createdAt)}</p>
                        <p>IP Address: {session.ipAddress}</p>
                        <p>OS: {session.osName} {session.osVersion}</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTerminateSession(session.id)}
                          disabled={terminatingId === session.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {terminatingId === session.id ? 'Terminating...' : 'Terminate'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Session Details Table */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(session.deviceType)}
                          {session.deviceName}
                        </div>
                      </TableCell>
                      <TableCell>{session.browser}</TableCell>
                      <TableCell>{session.location}</TableCell>
                      <TableCell className="font-mono text-sm">{session.ipAddress}</TableCell>
                      <TableCell>{getTimeAgo(session.lastActivityAt)}</TableCell>
                      <TableCell>
                        {session.isCurrentSession ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Current</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">About Sessions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>• Sessions are automatically created when you log in to your account</p>
          <p>• Each session is uniquely identified by a token stored in your browser</p>
          <p>• Terminating a session will log you out on that device</p>
          <p>• Inactive sessions are automatically terminated after 30 days</p>
          <p>• For security, consider terminating sessions you don't recognize</p>
        </CardContent>
      </Card>
    </div>
  );
}
