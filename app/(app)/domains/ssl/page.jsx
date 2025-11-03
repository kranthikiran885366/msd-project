'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Lock, AlertTriangle, Download, X, Plus } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function SSLCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    domainName: '',
    certFile: null,
    keyFile: null,
    chainFile: null,
    name: ''
  });

  // Mock certificates data
  const mockCertificates = [
    {
      id: 1,
      domain: 'api.example.com',
      name: 'Production API Certificate',
      issuer: "Let's Encrypt",
      status: 'active',
      issuedAt: '2024-01-15',
      expiresAt: '2025-01-15',
      daysUntilExpiry: 320,
      fingerprint: 'A1:B2:C3:D4:E5:F6:G7:H8:I9:J0',
      autoRenew: true,
      certificateChain: 'ACME issued by R3'
    },
    {
      id: 2,
      domain: 'app.example.com',
      name: 'Web Application Certificate',
      issuer: "Let's Encrypt",
      status: 'active',
      issuedAt: '2024-02-01',
      expiresAt: '2025-02-01',
      daysUntilExpiry: 335,
      fingerprint: 'F1:E2:D3:C4:B5:A6:G7:H8:I9:J0',
      autoRenew: true,
      certificateChain: 'ACME issued by R3'
    },
    {
      id: 3,
      domain: 'old.example.com',
      name: 'Legacy Certificate',
      issuer: 'DigiCert',
      status: 'expiring_soon',
      issuedAt: '2023-01-20',
      expiresAt: '2025-01-20',
      daysUntilExpiry: 45,
      fingerprint: 'Z9:Y8:X7:W6:V5:U4:T3:S2:R1:Q0',
      autoRenew: false,
      certificateChain: 'DigiCert SHA2 Secure Server CA'
    },
    {
      id: 4,
      domain: 'staging.example.com',
      name: 'Staging Certificate',
      issuer: "Let's Encrypt",
      status: 'active',
      issuedAt: '2024-03-10',
      expiresAt: '2025-03-10',
      daysUntilExpiry: 360,
      fingerprint: 'P1:O2:N3:M4:L5:K6:J7:I8:H9:G0',
      autoRenew: true,
      certificateChain: 'ACME issued by R3'
    }
  ];

  const fetchCertificates = useCallback(async () => {
    try {
      setError('');
      // Mock API call
      setCertificates(mockCertificates);
    } catch (err) {
      setError(err.message || 'Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const handleFileChange = (field, file) => {
    setFormData({...formData, [field]: file});
  };

  const handleUploadCertificate = async () => {
    if (!formData.domainName || !formData.certFile || !formData.keyFile || !formData.name) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError('');
      setUploadLoading(true);

      // Prepare form data
      const uploadData = new FormData();
      uploadData.append('domain', formData.domainName);
      uploadData.append('name', formData.name);
      uploadData.append('certificate', formData.certFile);
      uploadData.append('key', formData.keyFile);
      if (formData.chainFile) {
        uploadData.append('chain', formData.chainFile);
      }

      const response = await apiClient.uploadSSLCertificate(uploadData);

      if (response.success) {
        setSuccessMessage('Certificate uploaded successfully!');
        setCertificates([...certificates, response.data]);
        setFormData({ domainName: '', certFile: null, keyFile: null, chainFile: null, name: '' });
        setShowUploadForm(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to upload certificate');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteCertificate = async (certId) => {
    try {
      setError('');
      const response = await apiClient.deleteSSLCertificate(certId);

      if (response.success) {
        setCertificates(certificates.filter(c => c.id !== certId));
        setSuccessMessage('Certificate deleted successfully');
        setDeleteConfirm(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete certificate');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleRenewCertificate = async (certId) => {
    try {
      setError('');
      const response = await apiClient.renewSSLCertificate(certId);

      if (response.success) {
        const updated = certificates.map(c => c.id === certId ? {...c, ...response.data} : c);
        setCertificates(updated);
        setSuccessMessage('Certificate renewal initiated');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to renew certificate');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const getStatusBadge = (status, daysUntilExpiry) => {
    if (status === 'active' && daysUntilExpiry > 30) {
      return <Badge className="bg-green-100 text-green-800"><Lock className="w-3 h-3 mr-1" />Active</Badge>;
    } else if (status === 'expiring_soon' || daysUntilExpiry <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Expiring Soon</Badge>;
    } else if (status === 'expired') {
      return <Badge className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" />Expired</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><AlertCircle className="w-8 h-8" /></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">SSL Certificates</h1>
          <p className="text-muted-foreground">Manage SSL/TLS certificates for your domains</p>
        </div>
        <Button 
          onClick={() => setShowUploadForm(!showUploadForm)} 
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Upload Certificate
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

      {/* Upload Form */}
      {showUploadForm && (
        <Card>
          <CardHeader>
            <CardTitle>Upload SSL Certificate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Certificate Name</Label>
              <Input
                id="name"
                placeholder="My SSL Certificate"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domainName">Domain Name</Label>
              <Input
                id="domainName"
                placeholder="example.com"
                value={formData.domainName}
                onChange={(e) => handleInputChange('domainName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certFile">Certificate File (.crt, .pem) *</Label>
              <Input
                id="certFile"
                type="file"
                accept=".crt,.pem,.cer"
                onChange={(e) => handleFileChange('certFile', e.target.files?.[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyFile">Private Key File (.key) *</Label>
              <Input
                id="keyFile"
                type="file"
                accept=".key"
                onChange={(e) => handleFileChange('keyFile', e.target.files?.[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chainFile">Certificate Chain File (.crt, optional)</Label>
              <Input
                id="chainFile"
                type="file"
                accept=".crt,.pem"
                onChange={(e) => handleFileChange('chainFile', e.target.files?.[0])}
              />
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleUploadCertificate} 
                disabled={uploadLoading}
                className="flex-1"
              >
                {uploadLoading ? 'Uploading...' : 'Upload'}
              </Button>
              <Button 
                onClick={() => {
                  setShowUploadForm(false);
                  setFormData({ domainName: '', certFile: null, keyFile: null, chainFile: null, name: '' });
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Certificates</p>
              <p className="text-3xl font-bold">{certificates.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-3xl font-bold text-green-600">
                {certificates.filter(c => c.status === 'active' && c.daysUntilExpiry > 30).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
              <p className="text-3xl font-bold text-yellow-600">
                {certificates.filter(c => c.daysUntilExpiry <= 30 && c.daysUntilExpiry > 0).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Auto-Renew</p>
              <p className="text-3xl font-bold text-blue-600">
                {certificates.filter(c => c.autoRenew).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificates List */}
      <div className="space-y-4">
        {certificates.map(cert => (
          <Card key={cert.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{cert.name}</h3>
                  <p className="text-sm text-muted-foreground">{cert.domain}</p>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(cert.status, cert.daysUntilExpiry)}
                  {cert.autoRenew && (
                    <Badge className="bg-blue-100 text-blue-800">Auto-Renew</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Issuer</p>
                  <p className="font-medium">{cert.issuer}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Issued</p>
                  <p className="font-medium">{cert.issuedAt}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expires</p>
                  <p className="font-medium">{cert.expiresAt}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Days Until Expiry</p>
                  <p className={`font-medium ${cert.daysUntilExpiry <= 30 ? 'text-red-600' : 'text-green-600'}`}>
                    {cert.daysUntilExpiry} days
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fingerprint</p>
                  <p className="font-mono text-xs">{cert.fingerprint}</p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-muted rounded text-sm">
                <p className="text-muted-foreground">Certificate Chain</p>
                <p className="font-mono text-xs">{cert.certificateChain}</p>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleRenewCertificate(cert.id)}
                  disabled={cert.autoRenew}
                  className="gap-2"
                >
                  Renew
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => setDeleteConfirm(cert.id)}
                  className="gap-2 ml-auto"
                >
                  <X className="w-4 h-4" />
                  Delete
                </Button>
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === cert.id && (
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <p className="mb-3">Are you sure you want to delete this certificate?</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteCertificate(cert.id)}
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>SSL/TLS Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Enable auto-renewal to avoid unexpected certificate expiration</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Use certificates issued by trusted Certificate Authorities (CAs)</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Keep private keys secure and never share them</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Monitor certificate expiration dates and renew before they expire</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Use strong key algorithms (RSA 2048+ or ECDP P-256+)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
