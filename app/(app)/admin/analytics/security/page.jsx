'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Lock, Eye, TrendingUp, Shield } from 'lucide-react';

export default function SecurityAnalyticsPage() {
  const securityScore = 87;

  const threatData = [
    { date: 'Mon', attempts: 1250, blocked: 1200, successful: 50 },
    { date: 'Tue', attempts: 980, blocked: 945, successful: 35 },
    { date: 'Wed', attempts: 1420, blocked: 1380, successful: 40 },
    { date: 'Thu', attempts: 1100, blocked: 1050, successful: 50 },
    { date: 'Fri', attempts: 1850, blocked: 1800, successful: 50 },
    { date: 'Sat', attempts: 650, blocked: 630, successful: 20 },
    { date: 'Sun', attempts: 720, blocked: 700, successful: 20 },
  ];

  const vulnerabilities = [
    { title: 'SQL Injection Risk in User Input', severity: 'high', cvss: 8.2, status: 'open', discoveredDate: '5 days ago', component: 'Authentication' },
    { title: 'Outdated SSL Certificate', severity: 'critical', cvss: 9.1, status: 'open', discoveredDate: '2 days ago', component: 'Infrastructure' },
    { title: 'Missing CSRF Protection', severity: 'high', cvss: 7.8, status: 'in-progress', discoveredDate: '10 days ago', component: 'API' },
    { title: 'Weak Password Policy', severity: 'medium', cvss: 6.5, status: 'resolved', discoveredDate: '20 days ago', component: 'Auth' },
    { title: 'API Rate Limiting Missing', severity: 'medium', cvss: 6.2, status: 'open', discoveredDate: '3 days ago', component: 'API' },
  ];

  const threatCategories = [
    { name: 'Brute Force', value: 3240, color: '#dc2626' },
    { name: 'SQL Injection', value: 450, color: '#ea580c' },
    { name: 'XSS Attempts', value: 1200, color: '#eab308' },
    { name: 'DDoS', value: 280, color: '#f97316' },
    { name: 'Other', value: 580, color: '#6b7280' },
  ];

  const securityMetrics = [
    { metric: 'Failed Login Attempts Blocked', value: '6,750', trend: 'up', percentage: 12 },
    { metric: 'Vulnerabilities Found', value: '12', trend: 'down', percentage: 8 },
    { metric: 'Security Patches Applied', value: '28', trend: 'up', percentage: 15 },
    { metric: 'Suspicious Activities Detected', value: '145', trend: 'up', percentage: 5 },
  ];

  const COLORS = ['#dc2626', '#ea580c', '#eab308', '#f97316', '#6b7280'];

  const securityEvents = [
    { event: 'Brute force attack detected', severity: 'high', timestamp: '2 hours ago', ip: '192.168.1.100', status: 'blocked' },
    { event: 'SQL injection attempt', severity: 'critical', timestamp: '30 min ago', ip: '203.0.113.45', status: 'blocked' },
    { event: 'Unusual data access pattern', severity: 'medium', timestamp: '1 hour ago', ip: '10.0.0.50', status: 'investigating' },
    { event: 'Certificate expiry warning', severity: 'high', timestamp: '3 hours ago', ip: 'N/A', status: 'warning' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Security Analytics</h1>
        <p className="text-gray-600 mt-2">Monitor threats, vulnerabilities, and security posture</p>
      </div>

      {/* Security Score */}
      <Card className="bg-gradient-to-r from-emerald-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Overall Security Score</p>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-bold">{securityScore}</p>
                <span className="text-xl text-gray-600">/100</span>
              </div>
              <p className="text-sm text-green-600 mt-2">↑ +3 points vs last week</p>
            </div>
            <Shield className="w-16 h-16 text-emerald-600 opacity-20" />
          </div>
        </CardContent>
      </Card>

      {/* Security Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {securityMetrics.map((item, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-2">{item.metric}</p>
              <p className="text-3xl font-bold">{item.value}</p>
              <div className={`flex items-center gap-1 mt-2 text-sm ${item.trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                <TrendingUp className="w-4 h-4" />
                {item.trend === 'up' ? '+' : '-'}{item.percentage}% vs last week
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        {/* Security Events */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.map((event, idx) => (
                  <Card key={idx} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <AlertCircle className={`w-5 h-5 ${
                              event.severity === 'critical' ? 'text-red-600' :
                              event.severity === 'high' ? 'text-orange-600' :
                              'text-yellow-600'
                            }`} />
                            <p className="font-semibold">{event.event}</p>
                            <Badge className={
                              event.severity === 'critical' ? 'bg-red-600' :
                              event.severity === 'high' ? 'bg-orange-600' :
                              'bg-yellow-600'
                            }>
                              {event.severity}
                            </Badge>
                          </div>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span>{event.timestamp}</span>
                            <span>IP: {event.ip}</span>
                            <Badge variant="outline">{event.status}</Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Investigate</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attack Attempts Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={threatData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attempts" stroke="#ef4444" name="Total Attempts" strokeWidth={2} />
                  <Line type="monotone" dataKey="blocked" stroke="#10b981" name="Blocked" strokeWidth={2} />
                  <Line type="monotone" dataKey="successful" stroke="#f59e0b" name="Successful" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vulnerabilities */}
        <TabsContent value="vulnerabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vulnerability Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vulnerabilities.map((vuln, idx) => (
                  <Card key={idx} className={`border ${vuln.status === 'open' && vuln.severity === 'critical' ? 'border-red-300 bg-red-50' : ''}`}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">{vuln.title}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge className={
                                vuln.severity === 'critical' ? 'bg-red-600' :
                                vuln.severity === 'high' ? 'bg-orange-600' :
                                'bg-yellow-600'
                              }>
                                {vuln.severity}
                              </Badge>
                              <Badge variant={vuln.status === 'resolved' ? 'secondary' : vuln.status === 'in-progress' ? 'default' : 'destructive'}>
                                {vuln.status}
                              </Badge>
                              <Badge variant="outline">CVSS {vuln.cvss}</Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">View Details</Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                          <span>Component: {vuln.component}</span>
                          <span>Discovered: {vuln.discoveredDate}</span>
                          <span>Status: {vuln.status}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Threats */}
        <TabsContent value="threats" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Attack Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={threatCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {threatCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {threatCategories.map((threat) => (
                    <div key={threat.name} className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: threat.color }}></div>
                        <span className="text-sm">{threat.name}</span>
                      </div>
                      <p className="font-bold">{threat.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attack Attempts by Day</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={threatData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="attempts" fill="#ef4444" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies & Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { policy: 'Multi-Factor Authentication', status: 'enabled', coverage: '100%' },
                  { policy: 'Encryption at Rest', status: 'enabled', coverage: '100%' },
                  { policy: 'Encryption in Transit', status: 'enabled', coverage: '100%' },
                  { policy: 'Network Segmentation', status: 'enabled', coverage: '95%' },
                  { policy: 'Intrusion Detection', status: 'enabled', coverage: '98%' },
                  { policy: 'Data Masking', status: 'enabled', coverage: '85%' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.policy}</p>
                      <p className="text-xs text-gray-600">Coverage: {item.coverage}</p>
                    </div>
                    <Badge className="bg-green-600">✓ {item.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  'Update SSL certificate before expiration (expires in 15 days)',
                  'Implement API rate limiting to prevent abuse',
                  'Review and update incident response procedures',
                  'Schedule penetration testing for next quarter',
                ].map((rec, idx) => (
                  <div key={idx} className="flex gap-3 p-3 border rounded">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
