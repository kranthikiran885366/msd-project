'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';

export default function StatusPage() {
  const [incidents, setIncidents] = useState([]);
  const [services, setServices] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [summary, setSummary] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState('operational');
  const { toast } = useToast();

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const [statusRes, incidentsRes] = await Promise.all([
          fetch('/api/status/system'),
          fetch('/api/status/incidents')
        ]);

        if (!statusRes.ok || !incidentsRes.ok) {
          throw new Error('Failed to fetch status data');
        }

        const statusData = await statusRes.json();
        const incidentsData = await incidentsRes.json();

        setServices(statusData.services);
        setIncidents(incidentsData);
        setOverallStatus(statusData.overallStatus);
        setStatusHistory(statusData.uptime || []);
        setSummary(statusData.metrics || {});
      } catch (error) {
        console.error('Error fetching status:', error);
        toast({
          title: 'Error',
          description: 'Failed to load system status. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemStatus();
    const statusInterval = setInterval(fetchSystemStatus, 60000); // Refresh every minute

    return () => clearInterval(statusInterval);
  }, [toast]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'operational': return <CheckCircle className="w-5 h-5" />;
      case 'degraded': return <AlertCircle className="w-5 h-5" />;
      case 'maintenance': return <Clock className="w-5 h-5" />;
      case 'offline': return <AlertCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  const currentStatus = services.length > 0 && services.every(s => s.status === 'operational') ? 'operational' : overallStatus;
  const currentUptime = statusHistory[statusHistory.length - 1]?.uptime || '100%';
  const avgUptime = statusHistory.length
    ? `${(statusHistory.reduce((sum, day) => sum + Number(String(day.uptime).replace('%', '')), 0) / statusHistory.length).toFixed(2)}%`
    : '100.00%';
  const lastIncidentLabel = incidents.length > 0 ? `${new Date(incidents[0].createdAt || Date.now()).toLocaleDateString()}` : 'No recent incidents';
  const responseTime = summary.responseTime ? `${summary.responseTime}ms` : 'n/a';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">System Status</h1>
        <p className="text-gray-600">Real-time monitoring of all platform services and infrastructure</p>
      </div>

      {/* Overall Status */}
      <Card className={overallStatus === 'operational' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(overallStatus)}
              <div>
                <h2 className="text-2xl font-bold">
                  {overallStatus === 'operational' ? 'All Systems Operational' : 'System Degradation Detected'}
                </h2>
                <p className="text-sm text-gray-600">Updated 2 minutes ago</p>
              </div>
            </div>
            <Badge className={getStatusColor(overallStatus)}>
              {overallStatus.toUpperCase()}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current Uptime</p>
              <p className="text-2xl font-bold">{currentUptime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">30-Day Uptime</p>
              <p className="text-2xl font-bold">{avgUptime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Incident</p>
              <p className="text-2xl font-bold">{lastIncidentLabel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold">{responseTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-3">
          {services.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">No service telemetry available yet.</CardContent>
            </Card>
          ) : services.map((service, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      <Badge className={getStatusColor(service.status)}>
                        {service.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">30-day uptime: <span className="font-semibold text-green-600">{service.uptime}</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Regions</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {service.regions.map((region, ridx) => (
                        <Badge key={ridx} variant="outline">{region}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Key Metrics</p>
                    <div className="space-y-1 mt-1">
                      {Object.entries(service.metrics).map(([key, value]) => (
                        <p key={key} className="text-sm">
                          <span className="text-gray-600">{key}:</span> <span className="font-semibold">{value}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-3">
          {incidents.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No active incidents. All systems are operating normally.
              </CardContent>
            </Card>
          ) : (
            incidents.map((incident) => (
              <Card key={incident.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{incident.title}</h3>
                    <Badge className={
                      incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      incident.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {incident.status.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{incident.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-semibold">{incident.duration}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Impact</p>
                      <p className="font-semibold">{incident.impact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-3">
          {statusHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">No status history available yet.</CardContent>
            </Card>
          ) : statusHistory.map((day, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{day.date}</h3>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-gray-600">Uptime</p>
                        <p className="text-lg font-semibold text-green-600">{day.uptime}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Events</p>
                        <p className="text-lg font-semibold">{day.events}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Downtime</p>
                        <p className="text-lg font-semibold">{day.downtime}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Status Page Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">Subscribe to get notified about incidents and maintenance windows</p>
          <div className="flex gap-2">
            <input type="email" placeholder="your@email.com" className="flex-1 px-3 py-2 border rounded" />
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Subscribe</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
