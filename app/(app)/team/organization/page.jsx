'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Save, RefreshCw, Upload, Mail, MapPin, Globe } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function OrganizationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [orgData, setOrgData] = useState({
    name: 'Acme Corporation',
    website: 'https://acme-corp.com',
    industry: 'Technology',
    size: 'enterprise',
    country: 'United States',
    timezone: 'America/New_York',
    phone: '+1-555-123-4567',
    email: 'contact@acme-corp.com',
    description: 'Leading enterprise software solution provider'
  });

  const [branding, setBranding] = useState({
    logoUrl: 'https://images.unsplash.com/photo-1611532736050-d1c3fb1df8bf?w=400',
    brandColor: '#3B82F6',
    theme: 'auto'
  });

  const [contact, setContact] = useState({
    billingEmail: 'billing@acme-corp.com',
    supportEmail: 'support@acme-corp.com',
    emergencyContact: 'security@acme-corp.com',
    address: '123 Tech Street, San Francisco, CA 94105',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105'
  });

  const [tabs, setTabs] = useState('general');

  useEffect(() => {
    // Simulate loading
    setLoading(false);
  }, []);

  const handleOrgChange = (field, value) => {
    setOrgData({...orgData, [field]: value});
  };

  const handleBrandingChange = (field, value) => {
    setBranding({...branding, [field]: value});
  };

  const handleContactChange = (field, value) => {
    setContact({...contact, [field]: value});
  };

  const handleSaveOrgSettings = async () => {
    try {
      setError('');
      const response = await apiClient.updateOrgSettings(orgData);

      if (response.success) {
        setSuccessMessage('Organization settings saved successfully');
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to save settings');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleSaveBranding = async () => {
    try {
      setError('');
      const response = await apiClient.updateBrandingSettings(branding);

      if (response.success) {
        setSuccessMessage('Branding settings saved successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to save branding');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleSaveContactInfo = async () => {
    try {
      setError('');
      const response = await apiClient.updateContactInfo(contact);

      if (response.success) {
        setSuccessMessage('Contact information saved successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to save contact info');
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization's profile, branding, and settings</p>
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

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b">
        {['general', 'branding', 'contact'].map(tab => (
          <button
            key={tab}
            onClick={() => setTabs(tab)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
              tabs === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* General Settings Tab */}
      {tabs === 'general' && (
        <div className="space-y-6">
          {/* Organization Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Organization Information</span>
                <Button
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? 'default' : 'outline'}
                >
                  {isEditing ? 'Done' : 'Edit'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={orgData.name}
                      onChange={(e) => handleOrgChange('name', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded">{orgData.name}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  {isEditing ? (
                    <Input
                      id="website"
                      value={orgData.website}
                      onChange={(e) => handleOrgChange('website', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded text-blue-600">
                      <a href={orgData.website} target="_blank" rel="noopener noreferrer">
                        {orgData.website}
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  {isEditing ? (
                    <Input
                      id="industry"
                      value={orgData.industry}
                      onChange={(e) => handleOrgChange('industry', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded">{orgData.industry}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Organization Size</Label>
                  {isEditing ? (
                    <select
                      id="size"
                      value={orgData.size}
                      onChange={(e) => handleOrgChange('size', e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="startup">Startup (1-50)</option>
                      <option value="small">Small (51-200)</option>
                      <option value="medium">Medium (201-1000)</option>
                      <option value="enterprise">Enterprise (1000+)</option>
                    </select>
                  ) : (
                    <div className="p-2 bg-muted rounded">{orgData.size}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  {isEditing ? (
                    <Input
                      id="country"
                      value={orgData.country}
                      onChange={(e) => handleOrgChange('country', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {orgData.country}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  {isEditing ? (
                    <select
                      id="timezone"
                      value={orgData.timezone}
                      onChange={(e) => handleOrgChange('timezone', e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Chicago">America/Chicago (CST)</option>
                      <option value="America/Denver">America/Denver (MST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Europe/Paris">Europe/Paris (CET)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
                    </select>
                  ) : (
                    <div className="p-2 bg-muted rounded">{orgData.timezone}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={orgData.phone}
                      onChange={(e) => handleOrgChange('phone', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded">{orgData.phone}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={orgData.email}
                      onChange={(e) => handleOrgChange('email', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {orgData.email}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={orgData.description}
                    onChange={(e) => handleOrgChange('description', e.target.value)}
                    rows={4}
                  />
                ) : (
                  <div className="p-2 bg-muted rounded min-h-20">{orgData.description}</div>
                )}
              </div>

              {isEditing && (
                <Button onClick={handleSaveOrgSettings} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Branding Tab */}
      {tabs === 'branding' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Preview */}
              <div className="space-y-3">
                <Label>Organization Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </Button>
                </div>
              </div>

              {/* Brand Color */}
              <div className="space-y-3">
                <Label htmlFor="color">Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="color"
                    type="color"
                    value={branding.brandColor}
                    onChange={(e) => handleBrandingChange('brandColor', e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={branding.brandColor}
                    onChange={(e) => handleBrandingChange('brandColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B'].map(color => (
                    <button
                      key={color}
                      onClick={() => handleBrandingChange('brandColor', color)}
                      className="w-8 h-8 rounded border-2 transition"
                      style={{
                        backgroundColor: color,
                        borderColor: branding.brandColor === color ? '#000' : '#ddd'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div className="space-y-3">
                <Label htmlFor="theme">Theme Preference</Label>
                <select
                  id="theme"
                  value={branding.theme}
                  onChange={(e) => handleBrandingChange('theme', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="auto">Auto (System)</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <Button onClick={handleSaveBranding} className="gap-2">
                <Save className="w-4 h-4" />
                Save Branding
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact Tab */}
      {tabs === 'contact' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billing-email">Billing Email</Label>
                  <Input
                    id="billing-email"
                    type="email"
                    value={contact.billingEmail}
                    onChange={(e) => handleContactChange('billingEmail', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={contact.supportEmail}
                    onChange={(e) => handleContactChange('supportEmail', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency-email">Emergency Contact Email</Label>
                  <Input
                    id="emergency-email"
                    type="email"
                    value={contact.emergencyContact}
                    onChange={(e) => handleContactChange('emergencyContact', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={contact.address}
                    onChange={(e) => handleContactChange('address', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={contact.city}
                    onChange={(e) => handleContactChange('city', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={contact.state}
                    onChange={(e) => handleContactChange('state', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP/Postal Code</Label>
                  <Input
                    id="zip"
                    value={contact.zipCode}
                    onChange={(e) => handleContactChange('zipCode', e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleSaveContactInfo} className="gap-2">
                <Save className="w-4 h-4" />
                Save Contact Info
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Member Count</p>
              <p className="text-3xl font-bold">24</p>
              <Badge variant="outline">Active</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Teams</p>
              <p className="text-3xl font-bold">5</p>
              <p className="text-xs text-muted-foreground">Engineering, DevOps, Product, Sales, Support</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Subscription Tier</p>
              <p className="text-3xl font-bold">Enterprise</p>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
