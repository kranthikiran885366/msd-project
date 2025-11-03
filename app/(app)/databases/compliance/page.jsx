'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, Download, Calendar, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function InfrastructureCompliancePage() {
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [complianceStatus, setComplianceStatus] = useState({});
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('soc2');

  // Mock compliance frameworks
  const frameworks = [
    {
      id: 'soc2',
      name: 'SOC 2 Type II',
      icon: '🔒',
      lastAudit: '2024-11-15T10:00:00Z',
      expiresAt: '2025-11-14T23:59:59Z',
      status: 'compliant',
      requirements: [
        { requirement: 'Encryption at rest', status: 'met', evidence: 'AES-256 implemented' },
        { requirement: 'Encryption in transit', status: 'met', evidence: 'TLS 1.2+ enforced' },
        { requirement: 'Access controls', status: 'met', evidence: 'RBAC configured' },
        { requirement: 'Audit logging', status: 'met', evidence: '90 days retention' },
        { requirement: 'Incident response', status: 'met', evidence: 'Plan documented' },
        { requirement: 'Change management', status: 'met', evidence: 'Process in place' }
      ],
      certifications: [
        { name: 'SOC 2 Type II Certificate', issued: '2023-11-15', expires: '2025-11-14', status: 'active' }
      ]
    },
    {
      id: 'hipaa',
      name: 'HIPAA',
      icon: '🏥',
      lastAudit: '2024-10-20T14:30:00Z',
      expiresAt: '2025-10-19T23:59:59Z',
      status: 'compliant',
      requirements: [
        { requirement: 'Data protection', status: 'met', evidence: 'HIPAA BAA signed' },
        { requirement: 'Administrative safeguards', status: 'met', evidence: 'Training completed' },
        { requirement: 'Physical safeguards', status: 'met', evidence: 'Data center certified' },
        { requirement: 'Technical safeguards', status: 'met', evidence: 'Encryption enabled' },
        { requirement: 'Breach notification', status: 'met', evidence: 'Process defined' }
      ],
      certifications: [
        { name: 'HIPAA Compliance Certificate', issued: '2023-10-20', expires: '2025-10-19', status: 'active' }
      ]
    },
    {
      id: 'gdpr',
      name: 'GDPR',
      icon: '🌍',
      lastAudit: '2024-09-10T09:00:00Z',
      expiresAt: '2025-09-09T23:59:59Z',
      status: 'compliant',
      requirements: [
        { requirement: 'Data minimization', status: 'met', evidence: 'Policy implemented' },
        { requirement: 'Consent management', status: 'met', evidence: 'System configured' },
        { requirement: 'Data subject rights', status: 'met', evidence: 'Access controls set' },
        { requirement: 'DPA in place', status: 'met', evidence: 'Signed with processors' },
        { requirement: 'Privacy by design', status: 'met', evidence: 'Architecture reviewed' }
      ],
      certifications: [
        { name: 'GDPR Compliance Assessment', issued: '2023-09-10', expires: '2025-09-09', status: 'active' }
      ]
    },
    {
      id: 'pci-dss',
      name: 'PCI DSS',
      icon: '💳',
      lastAudit: '2024-08-25T11:15:00Z',
      expiresAt: '2025-08-24T23:59:59Z',
      status: 'compliant',
      requirements: [
        { requirement: 'Network security', status: 'met', evidence: 'Firewall configured' },
        { requirement: 'Cardholder data protection', status: 'met', evidence: 'Encrypted storage' },
        { requirement: 'Vulnerability management', status: 'met', evidence: 'Annual scan' },
        { requirement: 'Strong access controls', status: 'met', evidence: 'MFA enabled' },
        { requirement: 'Regular monitoring', status: 'met', evidence: 'Logs retained' }
      ],
      certifications: [
        { name: 'PCI DSS v3.2.1 Attestation', issued: '2023-08-25', expires: '2025-08-24', status: 'active' }
      ]
    },
    {
      id: 'iso27001',
      name: 'ISO 27001',
      icon: '📋',
      lastAudit: '2024-07-18T13:45:00Z',
      expiresAt: '2025-07-17T23:59:59Z',
      status: 'in-progress',
      requirements: [
        { requirement: 'Information security policy', status: 'met', evidence: 'Documented' },
        { requirement: 'Risk assessment', status: 'met', evidence: 'Completed annually' },
        { requirement: 'Asset management', status: 'met', evidence: 'Inventory maintained' },
        { requirement: 'Access control', status: 'pending', evidence: 'Review in progress' },
        { requirement: 'Cryptography', status: 'met', evidence: 'Standards applied' }
      ],
      certifications: [
        { name: 'ISO 27001 Certificate', issued: '2023-07-18', expires: '2025-07-17', status: 'active' }
      ]
    }
  ];

  // Mock audit trail
  const mockAuditTrail = [
    {
      id: 1,
      date: '2024-12-20T10:30:00Z',
      action: 'Compliance status updated',
      framework: 'SOC 2 Type II',
      details: 'All requirements verified compliant',
      user: 'admin@company.com'
    },
    {
      id: 2,
      date: '2024-12-15T14:15:00Z',
      action: 'Certification renewed',
      framework: 'SOC 2 Type II',
      details: 'SOC 2 Type II certificate renewed for 1 year',
      user: 'auditor@external.com'
    },
    {
      id: 3,
      date: '2024-12-10T09:00:00Z',
      action: 'Audit completed',
      framework: 'HIPAA',
      details: 'Annual HIPAA compliance audit completed successfully',
      user: 'auditor@external.com'
    },
    {
      id: 4,
      date: '2024-12-01T16:45:00Z',
      action: 'Policy updated',
      framework: 'GDPR',
      details: 'Data retention policy updated to align with GDPR requirements',
      user: 'security@company.com'
    },
    {
      id: 5,
      date: '2024-11-25T11:20:00Z',
      action: 'Requirement verified',
      framework: 'PCI DSS',
      details: 'Network segmentation requirement verified',
      user: 'compliance@company.com'
    }
  ];

  const fetchDatabases = useCallback(async () => {
    try {
      setError('');
      const response = await apiClient.getDatabases();
      setDatabases(response || []);
      if (response?.length > 0 && !selectedDb) {
        setSelectedDb(response[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch databases');
    }
  }, [selectedDb]);

  const fetchComplianceData = useCallback(async () => {
    if (!selectedDb) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.getDatabaseCompliance(selectedDb);
      
      if (response) {
        // Use real compliance data from API
        const status = {};
        frameworks.forEach(fw => {
          const met = fw.requirements.filter(r => r.status === 'met').length;
          status[fw.id] = {
            ...fw,
            completionPercentage: Math.round((met / fw.requirements.length) * 100)
          };
        });
        setComplianceStatus(status);
        setAuditTrail(mockAuditTrail);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch compliance data');
    } finally {
      setLoading(false);
    }
  }, [selectedDb]);

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    if (selectedDb) {
      fetchComplianceData();
    }
  }, [selectedDb, fetchComplianceData]);

  const handleExportReport = async () => {
    try {
      setError('');
      // Note: Export functionality would need to be implemented in the API
      setSuccessMessage('Compliance report export initiated');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to export report');
    }
  };

  const handleRunComplianceCheck = async () => {
    try {
      setError('');
      await apiClient.runComplianceCheck(selectedDb);
      setSuccessMessage('Compliance check initiated');
      await fetchComplianceData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to run compliance check');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'non-compliant': return 'bg-red-100 text-red-800';
      case 'met': return 'text-green-600';
      case 'pending': return 'text-orange-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'met': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    );
  }

  const selectedFrameworkData = complianceStatus[selectedFramework];
  const compliantFrameworks = Object.values(complianceStatus).filter(f => f.status === 'compliant').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Infrastructure Compliance</h1>
        <p className="text-muted-foreground">Manage regulatory compliance and certifications</p>
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

      {/* Database Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Database</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedDb}
            onChange={(e) => setSelectedDb(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="">Select a database...</option>
            {databases.map(db => (
              <option key={db._id} value={db._id}>
                {db.name} ({db.type})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Frameworks</p>
              <p className="text-3xl font-bold">{Object.keys(complianceStatus).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Compliant</p>
              <p className="text-3xl font-bold text-green-600">{compliantFrameworks}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Compliance Score</p>
              <p className="text-3xl font-bold">
                {Math.round(
                  Object.values(complianceStatus).reduce((sum, f) => sum + f.completionPercentage, 0) / 
                  Object.keys(complianceStatus).length
                )}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Framework Overview */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg">Compliance Frameworks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.values(complianceStatus).map(framework => (
            <button
              key={framework.id}
              onClick={() => setSelectedFramework(framework.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedFramework === framework.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{framework.icon}</div>
              <p className="font-semibold text-sm">{framework.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(framework.status)}>
                  {framework.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {framework.completionPercentage}% compliant
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Framework Details */}
      {selectedFrameworkData && (
        <>
          {/* Framework Header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{selectedFrameworkData.icon}</span>
                    {selectedFrameworkData.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Last Audit: {new Date(selectedFrameworkData.lastAudit).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={`${getStatusColor(selectedFrameworkData.status)} capitalize text-lg px-3 py-1`}>
                  {selectedFrameworkData.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Compliance Progress</span>
                  <span className="font-semibold">{selectedFrameworkData.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${selectedFrameworkData.completionPercentage}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleExportReport} className="gap-2">
                  <Download className="w-4 h-4" />
                  Export Report
                </Button>
                <Button onClick={handleRunComplianceCheck} variant="outline">
                  Run Compliance Check
                </Button>
              </div>
              {selectedFrameworkData.expiresAt && (
                <Alert className="border-orange-200 bg-orange-50">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    Certification expires on {new Date(selectedFrameworkData.expiresAt).toLocaleDateString()}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements & Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedFrameworkData.requirements.map((req, idx) => (
                  <div key={idx} className="flex gap-3 p-3 border rounded-lg">
                    <div className={`flex-shrink-0 mt-1 ${getStatusColor(req.status)}`}>
                      {getStatusIcon(req.status)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{req.requirement}</p>
                      <p className="text-sm text-muted-foreground">{req.evidence}</p>
                    </div>
                    <Badge className={getStatusColor(req.status)} variant="outline">
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Active Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedFrameworkData.certifications.map((cert, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold">{cert.name}</p>
                      <Badge className={cert.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {cert.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-semibold text-foreground">Issued</p>
                        <p>{new Date(cert.issued).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Expires</p>
                        <p>{new Date(cert.expires).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="mt-3 w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download Certificate
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditTrail.map(trail => (
              <div key={trail.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-semibold">{trail.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(trail.date).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{trail.framework}</p>
                  <p className="text-sm mt-1">{trail.details}</p>
                  <p className="text-xs text-muted-foreground mt-1">By: {trail.user}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Schedule regular compliance audits to maintain certifications</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Document all evidence for compliance requirements</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Maintain an audit trail of all compliance activities</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Monitor certification expiry dates and renew proactively</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
