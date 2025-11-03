'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import realtimeService from '@/lib/realtime-service';
import { AlertTriangle, Shield, Lock, CheckCircle, TrendingUp } from 'lucide-react';

export default function SecurityPage() {
  const [security, setSecurity] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurity();

    const handleAlertUpdate = (data) => {
      setAlerts(prev => [data, ...prev].slice(0, 10));
    };

    realtimeService.subscribeToAlerts(null, handleAlertUpdate);

    return () => {
      realtimeService.off('alert:triggered', handleAlertUpdate);
    };
  }, []);

  const fetchSecurity = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/security/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch security status');
      const data = await response.json();
      setSecurity(data);
    } catch (error) {
      console.error('Error fetching security:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading security dashboard...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security & Threat Detection</h1>
        <Button onClick={fetchSecurity}>Refresh</Button>
      </div>

      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle>Security Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={`${(92 / 100) * 351.8} 351.8`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-3xl font-bold">92</p>
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold mb-2">Excellent Security Posture</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  All encryption enabled
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  MFA enforced for admins
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  No critical vulnerabilities
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Security Events (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { event: 'Failed login attempts blocked', count: 42, severity: 'medium' },
              { event: 'SQL injection attempts detected', count: 3, severity: 'high' },
              { event: 'Unusual API usage detected', count: 1, severity: 'low' },
              { event: 'Unauthorized access attempts', count: 0, severity: 'critical' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <p className="text-sm">{item.event}</p>
                <Badge variant={item.severity === 'critical' ? 'destructive' : 'secondary'}>
                  {item.count} blocked
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Encryption Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Data at Rest', status: 'AES-256', color: 'green' },
              { name: 'Data in Transit', status: 'TLS 1.3', color: 'green' },
              { name: 'API Keys', status: 'Encrypted', color: 'green' },
              { name: 'Backups', status: 'Encrypted', color: 'green' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <p className="text-sm font-semibold">{item.name}</p>
                <Badge className={`bg-${color}-600`}>{item.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* User Access Control */}
      <Card>
        <CardHeader>
          <CardTitle>User Access Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">156</p>
              <p className="text-sm text-gray-600 mt-2">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">98%</p>
              <p className="text-sm text-gray-600 mt-2">MFA Enabled</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">23</p>
              <p className="text-sm text-gray-600 mt-2">Service Accounts</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">4</p>
              <p className="text-sm text-gray-600 mt-2">API Keys Expired</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vulnerability Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Vulnerability Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { severity: 'Critical', count: 0, color: 'red' },
              { severity: 'High', count: 2, color: 'orange' },
              { severity: 'Medium', count: 5, color: 'yellow' },
              { severity: 'Low', count: 12, color: 'blue' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full bg-${item.color}-600`} />
                <p className="font-semibold text-sm w-20">{item.severity}</p>
                <div className="flex-1 bg-gray-200 rounded h-8 flex items-center px-3">
                  <div 
                    className={`bg-${item.color}-600 h-6 rounded flex items-center justify-center text-white text-xs font-bold`}
                    style={{ width: `${(item.count / 12) * 100}%` }}
                  >
                    {item.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              4 API keys expiring within 30 days - rotate for security
            </AlertDescription>
          </Alert>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 p-3 bg-gray-50 rounded">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Enable FIDO2 Security Keys</p>
                <p className="text-xs text-gray-600">Hardware-based authentication for maximum security</p>
              </div>
            </li>
            <li className="flex items-start gap-2 p-3 bg-gray-50 rounded">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Set Up WAF Rules</p>
                <p className="text-xs text-gray-600">Additional protection against common web attacks</p>
              </div>
            </li>
            <li className="flex items-start gap-2 p-3 bg-gray-50 rounded">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Review IAM Policies</p>
                <p className="text-xs text-gray-600">Ensure least privilege principle is followed</p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
