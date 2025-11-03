'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { AlertCircle, CheckCircle, Shield, Lock, Eye } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function PasswordPolicyPage() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    maxAttempts: 5,
    lockoutDuration: 15,
    passwordExpiry: 90,
    passwordHistory: 5,
    requirePasswordChange: false,
    allowCommonPasswords: false,
    allowUserInfoInPassword: false,
    requireMFAAfterChange: false,
    enforcePolicy: true,
  });

  // Fetch password policy
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setError('');
        const response = await apiClient.getPasswordPolicy();
        
        if (response.success && response.data) {
          setPolicy(response.data);
          setFormData({
            minLength: response.data.minLength || 8,
            maxLength: response.data.maxLength || 128,
            requireUppercase: response.data.requireUppercase !== false,
            requireLowercase: response.data.requireLowercase !== false,
            requireNumbers: response.data.requireNumbers !== false,
            requireSpecialChars: response.data.requireSpecialChars !== false,
            specialChars: response.data.specialChars || '!@#$%^&*()_+-=[]{}|;:,.<>?',
            maxAttempts: response.data.maxAttempts || 5,
            lockoutDuration: response.data.lockoutDuration || 15,
            passwordExpiry: response.data.passwordExpiry || 90,
            passwordHistory: response.data.passwordHistory || 5,
            requirePasswordChange: response.data.requirePasswordChange === true,
            allowCommonPasswords: response.data.allowCommonPasswords === true,
            allowUserInfoInPassword: response.data.allowUserInfoInPassword === true,
            requireMFAAfterChange: response.data.requireMFAAfterChange === true,
            enforcePolicy: response.data.enforcePolicy !== false,
          });
        }
      } catch (err) {
        console.error('Failed to fetch password policy:', err);
        setError('Failed to load password policy');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle toggle change
  const handleToggleChange = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle slider change
  const handleSliderChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value[0]
    }));
  };

  // Save password policy
  const handleSavePolicy = async () => {
    try {
      setError('');
      if (formData.minLength < 4) {
        setError('Minimum password length must be at least 4 characters');
        return;
      }
      if (formData.minLength > formData.maxLength) {
        setError('Minimum length cannot be greater than maximum length');
        return;
      }

      setSaving(true);
      const response = await apiClient.updatePasswordPolicy(formData);

      if (response.success) {
        setPolicy(response.data);
        setSuccessMessage('Password policy updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to save policy');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Get password strength requirement status
  const getStrengthStatus = () => {
    const requirements = [];
    if (formData.requireUppercase) requirements.push('A-Z');
    if (formData.requireLowercase) requirements.push('a-z');
    if (formData.requireNumbers) requirements.push('0-9');
    if (formData.requireSpecialChars) requirements.push('!@#$...');
    return requirements;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading password policy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Password Policy</h1>
        <p className="text-muted-foreground">
          Configure password requirements and security policies for your organization
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

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Policy Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enforce Policy</p>
              <p className="text-sm text-muted-foreground">Require users to follow password requirements</p>
            </div>
            <Switch
              checked={formData.enforcePolicy}
              onCheckedChange={() => handleToggleChange('enforcePolicy')}
              disabled={saving}
            />
          </div>
          {formData.enforcePolicy && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
              Password policy is currently <strong>enforced</strong> for all users
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Complexity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Password Complexity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Length */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="minLength">Minimum Length</Label>
                <p className="text-xs text-muted-foreground">Currently: {formData.minLength} characters</p>
              </div>
              <Slider
                value={[formData.minLength]}
                onValueChange={(value) => handleSliderChange('minLength', value)}
                min={4}
                max={20}
                step={1}
                disabled={saving}
              />
              <Input
                type="number"
                min="4"
                max="128"
                value={formData.minLength}
                onChange={(e) => handleInputChange('minLength', parseInt(e.target.value) || 8)}
                disabled={saving}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="maxLength">Maximum Length</Label>
                <p className="text-xs text-muted-foreground">Currently: {formData.maxLength} characters</p>
              </div>
              <Slider
                value={[formData.maxLength]}
                onValueChange={(value) => handleSliderChange('maxLength', value)}
                min={20}
                max={256}
                step={1}
                disabled={saving}
              />
              <Input
                type="number"
                min="8"
                max="256"
                value={formData.maxLength}
                onChange={(e) => handleInputChange('maxLength', parseInt(e.target.value) || 128)}
                disabled={saving}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Character Requirements */}
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <p className="font-semibold text-sm">Required Characters</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="requireUppercase" className="font-normal text-sm cursor-pointer">
                  Uppercase letters (A-Z)
                </Label>
                <Switch
                  id="requireUppercase"
                  checked={formData.requireUppercase}
                  onCheckedChange={() => handleToggleChange('requireUppercase')}
                  disabled={saving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requireLowercase" className="font-normal text-sm cursor-pointer">
                  Lowercase letters (a-z)
                </Label>
                <Switch
                  id="requireLowercase"
                  checked={formData.requireLowercase}
                  onCheckedChange={() => handleToggleChange('requireLowercase')}
                  disabled={saving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requireNumbers" className="font-normal text-sm cursor-pointer">
                  Numbers (0-9)
                </Label>
                <Switch
                  id="requireNumbers"
                  checked={formData.requireNumbers}
                  onCheckedChange={() => handleToggleChange('requireNumbers')}
                  disabled={saving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requireSpecialChars" className="font-normal text-sm cursor-pointer">
                  Special characters
                </Label>
                <Switch
                  id="requireSpecialChars"
                  checked={formData.requireSpecialChars}
                  onCheckedChange={() => handleToggleChange('requireSpecialChars')}
                  disabled={saving}
                />
              </div>
            </div>

            {formData.requireSpecialChars && (
              <div className="pt-3 border-t">
                <Label htmlFor="specialChars" className="text-xs">Allowed Special Characters</Label>
                <Input
                  id="specialChars"
                  value={formData.specialChars}
                  onChange={(e) => handleInputChange('specialChars', e.target.value)}
                  disabled={saving}
                  className="h-8 text-sm font-mono mt-1"
                />
              </div>
            )}
          </div>

          {/* Current Strength Requirements */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-2">Current Requirements:</p>
            <div className="flex flex-wrap gap-2">
              {getStrengthStatus().map((req, idx) => (
                <Badge key={idx} variant="outline" className="bg-blue-100">{req}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Security Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 p-3 bg-muted rounded-lg">
              <div>
                <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                <p className="text-xs text-muted-foreground">0 = never expires</p>
              </div>
              <Slider
                value={[formData.passwordExpiry]}
                onValueChange={(value) => handleSliderChange('passwordExpiry', value)}
                min={0}
                max={365}
                step={1}
                disabled={saving}
              />
              <Input
                type="number"
                min="0"
                value={formData.passwordExpiry}
                onChange={(e) => handleInputChange('passwordExpiry', parseInt(e.target.value) || 0)}
                disabled={saving}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-3 p-3 bg-muted rounded-lg">
              <div>
                <Label htmlFor="passwordHistory">Password History (count)</Label>
                <p className="text-xs text-muted-foreground">Prevent reusing recent passwords</p>
              </div>
              <Slider
                value={[formData.passwordHistory]}
                onValueChange={(value) => handleSliderChange('passwordHistory', value)}
                min={0}
                max={24}
                step={1}
                disabled={saving}
              />
              <Input
                type="number"
                min="0"
                value={formData.passwordHistory}
                onChange={(e) => handleInputChange('passwordHistory', parseInt(e.target.value) || 0)}
                disabled={saving}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3 p-3 bg-muted rounded-lg">
            <div>
              <Label htmlFor="maxAttempts">Maximum Login Attempts</Label>
              <p className="text-xs text-muted-foreground">Before account lockout</p>
            </div>
            <Slider
              value={[formData.maxAttempts]}
              onValueChange={(value) => handleSliderChange('maxAttempts', value)}
              min={3}
              max={10}
              step={1}
              disabled={saving}
            />
            <Input
              type="number"
              min="3"
              value={formData.maxAttempts}
              onChange={(e) => handleInputChange('maxAttempts', parseInt(e.target.value) || 5)}
              disabled={saving}
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-3 p-3 bg-muted rounded-lg">
            <div>
              <Label htmlFor="lockoutDuration">Account Lockout Duration (minutes)</Label>
              <p className="text-xs text-muted-foreground">After maximum attempts exceeded</p>
            </div>
            <Slider
              value={[formData.lockoutDuration]}
              onValueChange={(value) => handleSliderChange('lockoutDuration', value)}
              min={5}
              max={240}
              step={5}
              disabled={saving}
            />
            <Input
              type="number"
              min="5"
              value={formData.lockoutDuration}
              onChange={(e) => handleInputChange('lockoutDuration', parseInt(e.target.value) || 15)}
              disabled={saving}
              className="h-8 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="allowCommonPasswords" className="font-normal cursor-pointer">
              Allow common passwords
            </Label>
            <Switch
              id="allowCommonPasswords"
              checked={formData.allowCommonPasswords}
              onCheckedChange={() => handleToggleChange('allowCommonPasswords')}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allowUserInfoInPassword" className="font-normal cursor-pointer">
              Allow user info in password (email, name)
            </Label>
            <Switch
              id="allowUserInfoInPassword"
              checked={formData.allowUserInfoInPassword}
              onCheckedChange={() => handleToggleChange('allowUserInfoInPassword')}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requirePasswordChange" className="font-normal cursor-pointer">
              Require password change on next login
            </Label>
            <Switch
              id="requirePasswordChange"
              checked={formData.requirePasswordChange}
              onCheckedChange={() => handleToggleChange('requirePasswordChange')}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requireMFAAfterChange" className="font-normal cursor-pointer">
              Require MFA after password change
            </Label>
            <Switch
              id="requireMFAAfterChange"
              checked={formData.requireMFAAfterChange}
              onCheckedChange={() => handleToggleChange('requireMFAAfterChange')}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSavePolicy}
          disabled={saving}
          className="flex-1"
        >
          {saving ? 'Saving...' : 'Save Password Policy'}
        </Button>
      </div>

      {/* Information */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-base text-yellow-900">Policy Application</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-yellow-800">
          <p>• Policy changes apply to all new password changes and user registrations</p>
          <p>• Existing passwords won't be updated until users change them</p>
          <p>• Password expiry will force users to change their password after the specified days</p>
          <p>• Password history prevents users from reusing recently used passwords</p>
          <p>• Failed login attempts will lock the account for the specified duration</p>
        </CardContent>
      </Card>
    </div>
  );
}
