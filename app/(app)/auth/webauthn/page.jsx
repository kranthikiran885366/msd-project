'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Key, Smartphone, Trash2, Plus, Shield, Fingerprint } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function WebAuthnPage() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [credentialName, setCredentialName] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Fetch WebAuthn credentials
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        setError('');
        const response = await apiClient.getWebAuthnCredentials();
        
        if (response.success) {
          setCredentials(response.data || []);
        } else {
          setError(response.error || 'Failed to fetch credentials');
        }
      } catch (err) {
        setError(err.message || 'An error occurred');
        console.error('Failed to fetch WebAuthn credentials:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, []);

  // Initiate WebAuthn registration
  const handleStartRegistration = async () => {
    try {
      setError('');
      if (!credentialName) {
        setError('Please enter a name for this passkey');
        return;
      }

      setRegistering(true);

      // Get registration challenge
      const response = await apiClient.initializeWebAuthnRegistration(credentialName);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to initialize registration');
      }

      const publicKey = response.data;

      // Convert challenge and userId to Uint8Array
      if (typeof publicKey.challenge === 'string') {
        publicKey.challenge = Uint8Array.from(
          atob(publicKey.challenge),
          c => c.charCodeAt(0)
        );
      }

      if (publicKey.user && typeof publicKey.user.id === 'string') {
        publicKey.user.id = Uint8Array.from(
          atob(publicKey.user.id),
          c => c.charCodeAt(0)
        );
      }

      // Call WebAuthn registration
      const attestationResponse = await navigator.credentials.create({
        publicKey
      });

      if (!attestationResponse) {
        throw new Error('Registration cancelled');
      }

      // Complete registration
      const completeResponse = await apiClient.completeWebAuthnRegistration(
        credentialName,
        attestationResponse
      );

      if (completeResponse.success) {
        setSuccessMessage('Passkey registered successfully');
        setCredentialName('');
        const updated = await apiClient.getWebAuthnCredentials();
        if (updated.success) setCredentials(updated.data || []);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(completeResponse.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      console.error('WebAuthn registration error:', err);
    } finally {
      setRegistering(false);
    }
  };

  // Delete WebAuthn credential
  const handleDeleteCredential = async (credentialId) => {
    if (!confirm('Are you sure you want to remove this passkey?')) {
      return;
    }

    try {
      setError('');
      setDeletingId(credentialId);

      const response = await apiClient.deleteWebAuthnCredential(credentialId);

      if (response.success) {
        setSuccessMessage('Passkey removed successfully');
        setCredentials(credentials.filter(c => c.id !== credentialId));
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete passkey');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading passkeys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Passkeys</h1>
        <p className="text-muted-foreground">
          Use biometric or hardware security keys for secure, passwordless authentication
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

      {/* Benefits Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Why use passkeys?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>✓ <strong>Phishing resistant</strong> - Keys are tied to your account and never shared</p>
          <p>✓ <strong>Biometric or PIN protected</strong> - Use fingerprint, face, or device PIN</p>
          <p>✓ <strong>Synced across devices</strong> - Your passkeys sync with your device</p>
          <p>✓ <strong>Works offline</strong> - No network needed for authentication</p>
        </CardContent>
      </Card>

      {/* Register New Passkey */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Passkey
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="credentialName">Passkey Name</Label>
            <Input
              id="credentialName"
              placeholder="e.g., My iPhone, Laptop, YubiKey"
              value={credentialName}
              onChange={(e) => setCredentialName(e.target.value)}
              disabled={registering}
            />
            <p className="text-xs text-muted-foreground">
              Give your passkey a descriptive name to identify it later
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              You'll be prompted to scan your fingerprint, face, or use your device PIN
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleStartRegistration}
            disabled={registering || !credentialName}
            className="w-full"
          >
            {registering ? 'Registering...' : 'Register Passkey'}
          </Button>
        </CardContent>
      </Card>

      {/* Registered Passkeys */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Your Passkeys</h2>

        {credentials.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Fingerprint className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No passkeys registered yet</p>
              <p className="text-sm">Add your first passkey above to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {credentials.map((credential) => (
              <Card key={credential.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {credential.transports?.includes('internal') ? (
                            <Fingerprint className="w-5 h-5 text-primary" />
                          ) : (
                            <Key className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{credential.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {credential.type === 'platform' ? 'Biometric' : 'Security Key'}
                          </p>
                        </div>
                      </div>

                      <div className="ml-12 space-y-1 text-xs text-muted-foreground">
                        <p>Created: {new Date(credential.createdAt).toLocaleDateString()}</p>
                        <p>Last used: {credential.lastUsedAt ? new Date(credential.lastUsedAt).toLocaleDateString() : 'Never'}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{credential.aaguid?.substring(0, 8)}...</Badge>
                          <Badge variant="outline">Backup: {credential.transports?.join(', ') || 'N/A'}</Badge>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCredential(credential.id)}
                      disabled={deletingId === credential.id || credentials.length === 1}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                    >
                      {deletingId === credential.id ? (
                        <span className="text-xs">Deleting...</span>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Supported Devices */}
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-base">Supported Devices</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">iOS/iPadOS</p>
                <p className="text-xs text-muted-foreground">Face ID, Touch ID</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Android</p>
                <p className="text-xs text-muted-foreground">Biometric, PIN</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Key className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Hardware Security Keys</p>
                <p className="text-xs text-muted-foreground">YubiKey, Titan</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Key className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Windows Hello</p>
                <p className="text-xs text-muted-foreground">Face, Fingerprint, PIN</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-base text-yellow-900">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-yellow-800">
          <p>• Keep at least one passkey as backup in case you lose access to your primary key</p>
          <p>• If using a hardware security key, keep it in a safe place</p>
          <p>• You can remove a passkey anytime, but you'll need another authentication method</p>
          <p>• For support with specific devices, visit the manufacturer's website</p>
        </CardContent>
      </Card>
    </div>
  );
}
