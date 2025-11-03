'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Search, ChevronDown, AlertCircle } from 'lucide-react';

export default function AuditCompliancePage() {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/audit', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit data');
      }
      
      const data = await response.json();
      setAuditData(data);
    } catch (error) {
      console.error('Error fetching audit data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error loading audit data: {error}</p>
          <Button onClick={fetchAuditData}>Retry</Button>
        </div>
      </div>
    );
  }

  const { logs = [] } = auditData || {};

  // Fallback data
  const fallbackLogs = [
    {
      id: 1,
      user: 'Sarah Chen',
      action: 'Created deployment',
      resource: 'Production Database',
      status: 'success',
      timestamp: '2 hours ago',
      ipAddress: '192.168.1.100',
      details: 'Deployed version 2.1.0 to production'
    },
    {
      id: 2,
      user: 'Alex Rodriguez',
      action: 'Modified project settings',
      resource: 'Backend API Project',
      status: 'success',
      timestamp: '5 hours ago',
      ipAddress: '10.0.0.50',
      details: 'Changed environment variables for staging'
    },
    {
      id: 3,
      user: 'Jordan Kim',
      action: 'Failed login attempt',
      resource: 'Authentication',
      status: 'failure',
      timestamp: '1 day ago',
      ipAddress: '203.0.113.45',
      details: 'Incorrect password provided'
    },
    {
      id: 4,
      user: 'Sarah Chen',
      action: 'Deleted API key',
      resource: 'API Keys',
      status: 'success',
      timestamp: '2 days ago',
      ipAddress: '192.168.1.100',
      details: 'Revoked legacy API key sk_old_***'
    },
    {
      id: 5,
      user: 'Unknown',
      action: 'Suspicious activity detected',
      resource: 'Security',
      status: 'warning',
      timestamp: '3 days ago',
      ipAddress: '198.51.100.90',
      details: 'Multiple failed login attempts from same IP'
    },
    {
      id: 6,
      user: 'Alex Rodriguez',
      action: 'Added team member',
      resource: 'Team Management',
      status: 'success',
      timestamp: '5 days ago',
      ipAddress: '10.0.0.50',
      details: 'Invited dev@company.com as Developer'
    },
  ];

  const auditLogs = logs.length > 0 ? logs : fallbackLogs;

  const complianceStatus = [
    { name: 'GDPR', status: 'compliant', lastAudit: '30 days ago', expiresIn: '90 days' },
    { name: 'SOC 2 Type II', status: 'compliant', lastAudit: '60 days ago', expiresIn: '150 days' },
    { name: 'ISO 27001', status: 'compliant', lastAudit: '45 days ago', expiresIn: '120 days' },
    { name: 'HIPAA', status: 'not-applicable', lastAudit: 'N/A', expiresIn: 'N/A' },
    { name: 'PCI DSS', status: 'in-progress', lastAudit: 'N/A', expiresIn: '30 days' },
  ];

  const securityPolicies = [
    { id: 1, name: 'Password Policy', status: 'active', version: '2.0', updatedBy: 'Sarah Chen', updatedDate: '15 days ago' },
    { id: 2, name: 'Data Retention Policy', status: 'active', version: '1.5', updatedBy: 'Admin', updatedDate: '30 days ago' },
    { id: 3, name: 'Incident Response Plan', status: 'active', version: '3.0', updatedBy: 'Security Team', updatedDate: '5 days ago' },
    { id: 4, name: 'Access Control Policy', status: 'active', version: '2.1', updatedBy: 'Alex Rodriguez', updatedDate: '10 days ago' },
  ];

  const getActionColor = (action) => {
    if (action.includes('Delete') || action.includes('Failed')) return 'destructive';
    if (action.includes('Modified') || action.includes('Suspicious')) return 'secondary';
    return 'default';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failure':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchQuery.toLowerCase());
    // Treat 'ALL' as no filter since Select.Item values must be non-empty
    const matchesUser = !selectedUser || selectedUser === 'ALL' || log.user === selectedUser;
    const matchesAction = !selectedAction || selectedAction === 'ALL' || log.action === selectedAction;
    return matchesSearch && matchesUser && matchesAction;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Audit Logs & Compliance</h1>
        <Button><Download className="w-4 h-4 mr-2" /> Export Report</Button>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="policies">Security Policies</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Audit Logs */}
        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search logs..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">User</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All users</SelectItem>
                      <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
                      <SelectItem value="Alex Rodriguez">Alex Rodriguez</SelectItem>
                      <SelectItem value="Jordan Kim">Jordan Kim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Action</label>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All actions</SelectItem>
                      <SelectItem value="Created deployment">Created deployment</SelectItem>
                      <SelectItem value="Modified project settings">Modified project settings</SelectItem>
                      <SelectItem value="Deleted API key">Deleted API key</SelectItem>
                      <SelectItem value="Added team member">Added team member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Log ({filteredLogs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <Card key={log.id} className="border">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(log.status)}>
                                {log.action}
                              </Badge>
                              <span className="text-sm font-semibold">{log.resource}</span>
                            </div>
                            <div className="mt-3 space-y-1">
                              <p className="text-sm"><span className="text-gray-600">User:</span> {log.user}</p>
                              <p className="text-sm"><span className="text-gray-600">Details:</span> {log.details}</p>
                              <div className="flex gap-4 text-xs text-gray-500 mt-2">
                                <span>IP: {log.ipAddress}</span>
                                <span>{log.timestamp}</span>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">View</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No audit logs match your filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complianceStatus.map((compliance) => (
                  <Card key={compliance.name} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{compliance.name}</p>
                          <div className="flex gap-4 text-sm text-gray-600 mt-2">
                            <span>Last audit: {compliance.lastAudit}</span>
                            {compliance.expiresIn !== 'N/A' && (
                              <span>Expires in: {compliance.expiresIn}</span>
                            )}
                          </div>
                        </div>
                        <Badge className={
                          compliance.status === 'compliant' ? 'bg-green-600' :
                          compliance.status === 'in-progress' ? 'bg-blue-600' :
                          'bg-gray-400'
                        }>
                          {compliance.status === 'compliant' ? 'Compliant' :
                           compliance.status === 'in-progress' ? 'In Progress' :
                           'Not Applicable'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compliance Document Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { name: 'Privacy Policy', updatedDate: '30 days ago', status: 'current' },
                  { name: 'Terms of Service', updatedDate: '60 days ago', status: 'current' },
                  { name: 'Data Processing Agreement', updatedDate: '15 days ago', status: 'current' },
                  { name: 'Security Incident Response Plan', updatedDate: '5 days ago', status: 'current' },
                ].map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-semibold text-sm">{doc.name}</p>
                      <p className="text-xs text-gray-600">Last updated {doc.updatedDate}</p>
                    </div>
                    <Button size="sm" variant="outline">Download</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Policies */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Security Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityPolicies.map((policy) => (
                  <Card key={policy.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{policy.name}</p>
                          <div className="flex gap-4 text-sm text-gray-600 mt-2">
                            <span>Version {policy.version}</span>
                            <span>Updated by {policy.updatedBy}</span>
                            <span>{policy.updatedDate}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="outline">Edit</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Policy Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Create New Policy from Template</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Retention Period</label>
                <Select defaultValue="90">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days (Default)</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>

          {/* Audit Event Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Events to Audit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { event: 'User Login', enabled: true },
                { event: 'User Logout', enabled: true },
                { event: 'API Key Creation', enabled: true },
                { event: 'API Key Deletion', enabled: true },
                { event: 'Deployment Creation', enabled: true },
                { event: 'Project Modification', enabled: true },
                { event: 'Team Member Addition', enabled: true },
                { event: 'Settings Change', enabled: true },
              ].map((item) => (
                <div key={item.event} className="flex items-center justify-between p-3 border rounded">
                  <span className="text-sm">{item.event}</span>
                  <input type="checkbox" defaultChecked={item.enabled} className="w-5 h-5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
