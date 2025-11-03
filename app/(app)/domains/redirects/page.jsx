'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Plus, Trash2, Edit2, ExternalLink, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function DomainRedirectsPage() {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [redirects, setRedirects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    sourceUrl: '',
    destinationUrl: '',
    redirectType: '301',
    enabled: true
  });

  // Mock redirect data
  const mockRedirects = [
    {
      id: 1,
      domain: 'old-domain.com',
      sourceUrl: '/old-page',
      destinationUrl: 'https://new-domain.com/new-page',
      redirectType: '301',
      enabled: true,
      hits: 1250,
      lastHit: '2024-12-20T14:32:00Z',
      created: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      domain: 'old-domain.com',
      sourceUrl: '/about',
      destinationUrl: 'https://new-domain.com/company/about',
      redirectType: '301',
      enabled: true,
      hits: 450,
      lastHit: '2024-12-20T12:15:00Z',
      created: '2024-01-20T14:30:00Z'
    },
    {
      id: 3,
      domain: 'legacy.example.com',
      sourceUrl: '/',
      destinationUrl: 'https://example.com',
      redirectType: '301',
      enabled: true,
      hits: 5200,
      lastHit: '2024-12-20T15:45:00Z',
      created: '2023-06-10T08:45:00Z'
    },
    {
      id: 4,
      domain: 'staging.example.com',
      sourceUrl: '/api/*',
      destinationUrl: 'https://api.example.com',
      redirectType: '307',
      enabled: false,
      hits: 0,
      lastHit: null,
      created: '2024-03-05T11:20:00Z'
    },
    {
      id: 5,
      domain: 'example.com',
      sourceUrl: '/blog/*',
      destinationUrl: 'https://blog.example.com',
      redirectType: '302',
      enabled: true,
      hits: 850,
      lastHit: '2024-12-20T13:22:00Z',
      created: '2024-02-28T09:15:00Z'
    },
    {
      id: 6,
      domain: 'example.com',
      sourceUrl: '/images/*',
      destinationUrl: 'https://cdn.example.com/images',
      redirectType: '301',
      enabled: true,
      hits: 12500,
      lastHit: '2024-12-20T15:59:00Z',
      created: '2023-11-12T16:40:00Z'
    }
  ];

  const fetchDomains = useCallback(async () => {
    try {
      setError('');
      const response = await apiClient.getDomains();
      if (response.success) {
        setDomains(response.data || []);
        if (response.data?.length > 0 && !selectedDomain) {
          setSelectedDomain(response.data[0].id);
        }
      } else {
        setError(response.error || 'Failed to fetch domains');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  }, [selectedDomain]);

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      const domainName = domains.find(d => d.id === selectedDomain)?.name;
      setRedirects(mockRedirects.filter(r => r.domain === domainName));
    }
    setLoading(false);
  }, [selectedDomain, domains]);

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const handleSaveRedirect = async () => {
    if (!formData.sourceUrl || !formData.destinationUrl) {
      setError('Source and destination URLs are required');
      return;
    }

    try {
      setError('');
      const domainName = domains.find(d => d.id === selectedDomain)?.name;

      if (editingId) {
        // Update
        const response = await apiClient.updateDomainRedirect(editingId, formData);
        if (response.success) {
          setRedirects(redirects.map(r => r.id === editingId ? {...r, ...formData} : r));
          setSuccessMessage('Redirect updated successfully');
          setEditingId(null);
        } else {
          setError(response.error || 'Failed to update redirect');
        }
      } else {
        // Create
        const response = await apiClient.addDomainRedirect(selectedDomain, formData);
        if (response.success) {
          const newRedirect = {
            id: redirects.length + 1,
            domain: domainName,
            ...formData,
            hits: 0,
            lastHit: null,
            created: new Date().toISOString()
          };
          setRedirects([...redirects, newRedirect]);
          setSuccessMessage('Redirect created successfully');
        } else {
          setError(response.error || 'Failed to create redirect');
        }
      }

      setFormData({ sourceUrl: '', destinationUrl: '', redirectType: '301', enabled: true });
      setShowCreateForm(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeleteRedirect = async (redirectId) => {
    try {
      setError('');
      const response = await apiClient.deleteDomainRedirect(redirectId);

      if (response.success) {
        setRedirects(redirects.filter(r => r.id !== redirectId));
        setSuccessMessage('Redirect deleted successfully');
        setDeleteConfirm(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete redirect');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleEditRedirect = (redirect) => {
    setFormData({
      sourceUrl: redirect.sourceUrl,
      destinationUrl: redirect.destinationUrl,
      redirectType: redirect.redirectType,
      enabled: redirect.enabled
    });
    setEditingId(redirect.id);
    setShowCreateForm(true);
  };

  const getRedirectTypeBadge = (type) => {
    const types = {
      '301': { label: 'Permanent', bg: 'bg-green-100', text: 'text-green-800' },
      '302': { label: 'Temporary', bg: 'bg-blue-100', text: 'text-blue-800' },
      '307': { label: 'Temporary Redirect', bg: 'bg-blue-100', text: 'text-blue-800' },
      '308': { label: 'Permanent Redirect', bg: 'bg-green-100', text: 'text-green-800' }
    };
    const typeInfo = types[type] || { label: type, bg: 'bg-gray-100', text: 'text-gray-800' };
    return <Badge className={`${typeInfo.bg} ${typeInfo.text}`}>{type} - {typeInfo.label}</Badge>;
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Domain Redirects</h1>
          <p className="text-muted-foreground">Manage URL redirects and forwarding</p>
        </div>
        <Button onClick={() => {
          setEditingId(null);
          setFormData({ sourceUrl: '', destinationUrl: '', redirectType: '301', enabled: true });
          setShowCreateForm(true);
        }} className="gap-2">
          <Plus className="w-4 h-4" />
          New Redirect
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

      {/* Domain Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Domain</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
          >
            {domains.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Redirects</p>
              <p className="text-3xl font-bold">{redirects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-3xl font-bold text-green-600">
                {redirects.filter(r => r.enabled).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Hits</p>
              <p className="text-3xl font-bold">
                {redirects.reduce((sum, r) => sum + r.hits, 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg Hits/Day</p>
              <p className="text-3xl font-bold">
                {Math.round(redirects.reduce((sum, r) => sum + r.hits, 0) / (redirects.length || 1))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Redirect Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Redirect' : 'Create New Redirect'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">Source URL Path</Label>
              <Input
                id="sourceUrl"
                placeholder="/old-page or /blog/*"
                value={formData.sourceUrl}
                onChange={(e) => handleInputChange('sourceUrl', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Use * for wildcard matching</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinationUrl">Destination URL</Label>
              <Input
                id="destinationUrl"
                placeholder="https://new-domain.com/new-page"
                value={formData.destinationUrl}
                onChange={(e) => handleInputChange('destinationUrl', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirectType">Redirect Type</Label>
              <select
                id="redirectType"
                value={formData.redirectType}
                onChange={(e) => handleInputChange('redirectType', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="301">301 - Permanent Redirect</option>
                <option value="302">302 - Temporary Redirect</option>
                <option value="307">307 - Temporary Redirect (Preserve Method)</option>
                <option value="308">308 - Permanent Redirect (Preserve Method)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Use 301/308 for permanent redirects. Use 302/307 for temporary ones.
              </p>
            </div>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => handleInputChange('enabled', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Enable this redirect</span>
            </label>

            <div className="flex gap-3">
              <Button onClick={handleSaveRedirect} className="flex-1">
                {editingId ? 'Update Redirect' : 'Create Redirect'}
              </Button>
              <Button onClick={() => {
                setShowCreateForm(false);
                setEditingId(null);
              }} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redirects List */}
      <div className="space-y-4">
        {redirects.map(redirect => (
          <Card key={redirect.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-sm bg-muted p-2 rounded">{redirect.sourceUrl}</code>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      <code className="text-sm bg-muted p-2 rounded flex-1 truncate">
                        {redirect.destinationUrl}
                      </code>
                    </div>
                    <div className="flex gap-2">
                      {getRedirectTypeBadge(redirect.redirectType)}
                      {redirect.enabled ? (
                        <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Disabled</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Hits</p>
                    <p className="font-semibold text-lg">{redirect.hits.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Hit</p>
                    <p className="font-semibold">
                      {redirect.lastHit 
                        ? new Date(redirect.lastHit).toLocaleString() 
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-semibold">
                      {new Date(redirect.created).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEditRedirect(redirect)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => setDeleteConfirm(redirect.id)}
                    className="gap-2 ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>

                  {deleteConfirm === redirect.id && (
                    <Alert className="mt-3 border-red-200 bg-red-50 absolute">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <p className="mb-2">Are you sure you want to delete this redirect?</p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteRedirect(redirect.id)}
                          >
                            Delete
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Redirect Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-semibold text-sm mb-2">HTTP Status Codes</p>
            <ul className="space-y-2 text-sm">
              <li><span className="font-mono bg-muted px-2 py-1 rounded">301</span> - Permanent redirect (SEO friendly, browsers cache)</li>
              <li><span className="font-mono bg-muted px-2 py-1 rounded">302</span> - Temporary redirect (browsers don't cache)</li>
              <li><span className="font-mono bg-muted px-2 py-1 rounded">307/308</span> - Preserve HTTP method in redirect</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm mb-2">Wildcard Patterns</p>
            <ul className="space-y-2 text-sm">
              <li><span className="font-mono bg-muted px-2 py-1 rounded">/blog/*</span> → Matches /blog/anything</li>
              <li><span className="font-mono bg-muted px-2 py-1 rounded">/api/v1/*</span> → Matches /api/v1/any/path</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
