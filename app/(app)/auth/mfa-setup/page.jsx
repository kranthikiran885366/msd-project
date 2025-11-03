'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Copy, RefreshCw, Smartphone, Mail, MessageSquare } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function MFASetupPage() {
  const [mfaMethods, setMfaMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('totp');
  const [setupStep, setSetupStep] = useState('list'); // 'list', 'setup', 'verify'
  const [selectedMethod, setSelectedMethod] = useState(null);
  
  // TOTP state
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQR, setTotpQR] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpName, setTotpName] = useState('CloudDeck');
  
  // Email state
  const [emailVerifyCode, setEmailVerifyCode] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  
  // SMS state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsVerifyCode, setSmsVerifyCode] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  
  // Backup codes state
  const [backupCodes, setBackupCodes] = useState([]);
  const [copied, setCopied] = useState(false);
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch MFA methods on load
  useEffect(() => {
    const fetchMFAMethods = async () => {
      try {
        const response = await apiClient.getMFAMethods();
        if (response.success) {
          setMfaMethods(response.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch MFA methods:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMFAMethods();
  }, []);

  // TOTP Setup
  const handleTOTPSetup = async () => {
    try {
      setError('');
      const response = await apiClient.generateTOTPSecret(totpName);
      
      if (response.success) {
        setTotpSecret(response.secret);
        setTotpQR(response.qrCode);
        setSetupStep('verify');
      } else {
        setError(response.error || 'Failed to generate TOTP secret');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleTOTPVerify = async () => {
    try {
      setError('');
      if (!totpCode || totpCode.length !== 6) {
        setError('Please enter a valid 6-digit code');
        return;
      }

      setLoading(true);
      const response = await apiClient.verifyAndEnableTOTP(totpSecret, totpCode, totpName);
      
      if (response.success) {
        setSuccessMessage('TOTP authentication enabled successfully');
        setBackupCodes(response.backupCodes || []);
        setSetupStep('list');
        setTotpSecret('');
        setTotpQR('');
        setTotpCode('');
        
        // Refresh MFA methods
        const updated = await apiClient.getMFAMethods();
        if (updated.success) setMfaMethods(updated.data || []);
      } else {
        setError(response.error || 'Invalid verification code');
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Email MFA Setup
  const handleEmailSetup = async () => {
    try {
      setError('');
      setEmailLoading(true);
      const response = await apiClient.setupEmailMFA();
      
      if (response.success) {
        setSuccessMessage('Verification code sent to your email');
        setSetupStep('verify');
        setSelectedMethod('email');
      } else {
        setError(response.error || 'Failed to setup email MFA');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailVerify = async () => {
    try {
      setError('');
      if (!emailVerifyCode) {
        setError('Please enter the verification code');
        return;
      }

      setLoading(true);
      const response = await apiClient.verifyAndEnableEmailMFA(emailVerifyCode);
      
      if (response.success) {
        setSuccessMessage('Email authentication enabled successfully');
        setBackupCodes(response.backupCodes || []);
        setSetupStep('list');
        setEmailVerifyCode('');
        
        // Refresh MFA methods
        const updated = await apiClient.getMFAMethods();
        if (updated.success) setMfaMethods(updated.data || []);
      } else {
        setError(response.error || 'Invalid verification code');
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // SMS MFA Setup
  const handleSMSSetup = async () => {
    try {
      setError('');
      if (!phoneNumber) {
        setError('Please enter a phone number');
        return;
      }

      setSmsLoading(true);
      const response = await apiClient.setupSMSMFA(phoneNumber);
      
      if (response.success) {
        setSuccessMessage('Verification code sent via SMS');
        setSetupStep('verify');
        setSelectedMethod('sms');
      } else {
        setError(response.error || 'Failed to setup SMS MFA');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleSMSVerify = async () => {
    try {
      setError('');
      if (!smsVerifyCode) {
        setError('Please enter the verification code');
        return;
      }

      setLoading(true);
      const response = await apiClient.verifyAndEnableSMSMFA(smsVerifyCode);
      
      if (response.success) {
        setSuccessMessage('SMS authentication enabled successfully');
        setBackupCodes(response.backupCodes || []);
        setSetupStep('list');
        setSmsVerifyCode('');
        setPhoneNumber('');
        
        // Refresh MFA methods
        const updated = await apiClient.getMFAMethods();
        if (updated.success) setMfaMethods(updated.data || []);
      } else {
        setError(response.error || 'Invalid verification code');
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Remove MFA method
  const handleRemoveMFA = async (methodId) => {
    if (!confirm('Are you sure? This will disable this authentication method.')) return;
    
    try {
      setError('');
      const response = await apiClient.disableMFA(methodId);
      
      if (response.success) {
        setSuccessMessage('Authentication method removed');
        const updated = await apiClient.getMFAMethods();
        if (updated.success) setMfaMethods(updated.data || []);
      } else {
        setError(response.error || 'Failed to remove method');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  // Copy backup codes
  const handleCopyBackupCodes = () => {
    const codes = backupCodes.join('\n');
    navigator.clipboard.writeText(codes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && setupStep === 'list') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
        <p className="text-muted-foreground">Secure your account with additional authentication methods</p>
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

      {backupCodes.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-1 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <h3 className="font-semibold text-yellow-900">Save your backup codes</h3>
                <p className="text-sm text-yellow-800">Store these codes in a safe place. You can use them if you lose access to your authentication method.</p>
                <div className="bg-white p-3 rounded border border-yellow-200 font-mono text-sm space-y-1 max-h-40 overflow-y-auto">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="text-yellow-900">{code}</div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyBackupCodes}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy codes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {setupStep === 'list' ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="totp">Authenticator App</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
          </TabsList>

          {/* Active Methods */}
          {mfaMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mfaMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {method.type === 'totp' && <Smartphone className="w-5 h-5 text-primary" />}
                      {method.type === 'email' && <Mail className="w-5 h-5 text-primary" />}
                      {method.type === 'sms' && <MessageSquare className="w-5 h-5 text-primary" />}
                      <div>
                        <p className="font-medium capitalize">{method.type} Authentication</p>
                        <p className="text-sm text-muted-foreground">{method.value || 'Configured'}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRemoveMFA(method.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* TOTP Tab */}
          <TabsContent value="totp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Authenticator App</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator to generate time-based codes.
                </p>
                {!mfaMethods.some(m => m.type === 'totp') && (
                  <Button onClick={handleTOTPSetup} className="w-full">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Setup Authenticator App
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Receive verification codes via email for each login.
                </p>
                {!mfaMethods.some(m => m.type === 'email') && (
                  <Button 
                    onClick={handleEmailSetup} 
                    disabled={emailLoading}
                    className="w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {emailLoading ? 'Setting up...' : 'Setup Email Authentication'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SMS Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Receive verification codes via SMS for each login.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={smsLoading}
                  />
                </div>
                {!mfaMethods.some(m => m.type === 'sms') && (
                  <Button 
                    onClick={handleSMSSetup}
                    disabled={smsLoading || !phoneNumber}
                    className="w-full"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {smsLoading ? 'Sending...' : 'Setup SMS Authentication'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Verify {selectedMethod === 'totp' ? 'Authenticator Code' : 'Verification Code'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMethod === 'totp' && totpQR && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Scan this QR code with your authenticator app:</p>
                  <img src={totpQR} alt="TOTP QR Code" className="w-48 h-48 border rounded" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Or enter this code manually:</p>
                  <code className="bg-muted p-3 rounded block text-sm font-mono break-all">{totpSecret}</code>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                placeholder="000000"
                maxLength="6"
                value={selectedMethod === 'totp' ? totpCode : selectedMethod === 'email' ? emailVerifyCode : smsVerifyCode}
                onChange={(e) => {
                  if (selectedMethod === 'totp') setTotpCode(e.target.value);
                  else if (selectedMethod === 'email') setEmailVerifyCode(e.target.value);
                  else setSmsVerifyCode(e.target.value);
                }}
                disabled={loading}
              />
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setSetupStep('list');
                  setTotpSecret('');
                  setTotpQR('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedMethod === 'totp') handleTOTPVerify();
                  else if (selectedMethod === 'email') handleEmailVerify();
                  else handleSMSVerify();
                }}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
