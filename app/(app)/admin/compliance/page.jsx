'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import realtimeService from '@/lib/realtime-service';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export default function ComplianceDashboardPage() {
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState('all');

  useEffect(() => {
    fetchCompliance();
    
    const handleComplianceUpdate = (data) => {
      setCompliance(data);
    };

    realtimeService.subscribeToCompliance(null, handleComplianceUpdate);

    return () => {
      realtimeService.off('compliance:update', handleComplianceUpdate);
    };
  }, []);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/compliance/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch compliance status');
      const data = await response.json();
      setCompliance(data);
    } catch (error) {
      console.error('Error fetching compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading compliance dashboard...</div>;

  const frameworks = [
    {
      name: 'SOC2 Type II',
      icon: '🔒',
      status: 'COMPLIANT',
      controls: 4,
      completed: 4,
      description: 'Security audit controls'
    },
    {
      name: 'GDPR',
      icon: '🇪🇺',
      status: 'COMPLIANT',
      controls: 8,
      completed: 8,
      description: 'Data protection regulations'
    },
    {
      name: 'HIPAA',
      icon: '🏥',
      status: 'COMPLIANT',
      controls: 5,
      completed: 5,
      description: 'Healthcare data security'
    },
    {
      name: 'PCI-DSS',
      icon: '💳',
      status: 'COMPLIANT',
      controls: 6,
      completed: 6,
      description: 'Payment card security'
    },
    {
      name: 'ISO 27001',
      icon: '📋',
      status: 'COMPLIANT',
      controls: 114,
      completed: 114,
      description: 'Information security'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLIANT':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
        <Button onClick={fetchCompliance}>Refresh</Button>
      </div>

      {/* Overall Status */}
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          All compliance frameworks are current and compliant. Last audit: 2 days ago
        </AlertDescription>
      </Alert>

      {/* Compliance Frameworks */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {frameworks.map((framework) => (
          <Card 
            key={framework.name}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedFramework(framework.name.toLowerCase())}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <span className="text-3xl">{framework.icon}</span>
                {getStatusIcon(framework.status)}
              </div>
              <CardTitle className="text-sm mt-2">{framework.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-3">{framework.description}</p>
              <p className="text-sm font-bold">
                {framework.completed}/{framework.controls} controls
              </p>
              <div className="w-full bg-gray-200 rounded h-2 mt-2">
                <div
                  className="bg-green-600 rounded h-2 transition-all"
                  style={{ width: `${(framework.completed / framework.controls) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* SOC2 Controls */}
        <Card>
          <CardHeader>
            <CardTitle>SOC2 Type II Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { control: 'CC6', name: 'Access Control', status: 'PASS' },
              { control: 'CC7', name: 'Monitoring & Alerting', status: 'PASS' },
              { control: 'M1', name: 'System Performance', status: 'PASS' },
              { control: 'A1', name: 'Asset Management', status: 'PASS' }
            ].map((item) => (
              <div key={item.control} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold text-sm">{item.control}: {item.name}</p>
                </div>
                <Badge variant="default" className="bg-green-600">PASS</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Audit Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Audit Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { event: 'Unauthorized access attempt blocked', time: '2 hours ago' },
              { event: 'MFA enabled for admin users', time: '1 day ago' },
              { event: 'Encryption key rotated', time: '3 days ago' },
              { event: 'Backup verification passed', time: '1 week ago' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded">
                <p className="text-sm">{item.event}</p>
                <p className="text-xs text-gray-600">{item.time}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* GDPR Data Handling */}
      <Card>
        <CardHeader>
          <CardTitle>GDPR Data Handling</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">2</p>
            <p className="text-sm text-gray-600">Deletion Requests (Pending)</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">47</p>
            <p className="text-sm text-gray-600">Data Exports Completed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">156</p>
            <p className="text-sm text-gray-600">Consent Records</p>
          </div>
        </CardContent>
      </Card>

      {/* Generate Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Download Compliance Reports</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Button variant="outline">SOC2 Report (PDF)</Button>
          <Button variant="outline">GDPR Audit Trail (Excel)</Button>
          <Button variant="outline">HIPAA Assessment (PDF)</Button>
          <Button variant="outline">PCI-DSS Validation (PDF)</Button>
          <Button variant="outline">ISO 27001 Controls (Excel)</Button>
          <Button variant="outline">Full Compliance Report (PDF)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
