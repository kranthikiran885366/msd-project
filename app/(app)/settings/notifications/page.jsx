'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';

export default function NotificationsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState({
    enabled: true,
    deploymentSuccess: true,
    deploymentFailed: true,
    deploymentStarted: true,
    securityAlerts: true,
    apiErrors: true,
    buildTimeExceeds: true,
    billingAlerts: true,
    weeklyDigest: true
  });

  const [pushNotifications, setPushNotifications] = useState({
    enabled: false,
    deploymentSuccess: false,
    deploymentFailed: true,
    securityAlerts: true
  });

  const [slackIntegration, setSlackIntegration] = useState({
    enabled: false,
    channel: '',
    deployments: true,
    alerts: true,
    failureOnly: false
  });

  const [slackConfig, setSlackConfig] = useState({
    enabled: false,
    webhookUrl: '',
    channel: '',
    events: []
  });

  const [discordConfig, setDiscordConfig] = useState({
    enabled: false,
    webhookUrl: '',
    events: []
  });

  const [webhookConfig, setWebhookConfig] = useState({
    enabled: false,
    endpoints: [],
  });

  const [quietHours, setQuietHours] = useState({
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'UTC',
    excludedEvents: [],
  });

  const [notificationHistory, setNotificationHistory] = useState([]);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const settingsResponse = await apiClient.request('/settings/notifications');
      const historyResponse = await apiClient.request('/settings/notifications/history');

      const settings = settingsResponse;
      setEmailNotifications(settings.email || {});
      setSlackConfig(settings.slack || {});
      setDiscordConfig(settings.discord || {});
      setWebhookConfig(settings.webhooks || {});
      setQuietHours(settings.quietHours || {});
      setPushNotifications(settings.push || {});
      setSlackIntegration(settings.slack || {});
      
      setNotificationHistory((historyResponse.history || []).map(notif => ({
        ...notif,
        time: formatRelativeTime(new Date(notif.timestamp))
      })));

      setIsLoading(false);
    } catch (error) {
      toast({
        title: 'Error loading notification settings',
        description: error.message || 'Could not load notification settings',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'just now';
    }
  };

  const saveNotificationSettings = async (type, settings) => {
    try {
      const response = await apiClient.request('/settings/notifications', {
        method: 'PATCH',
        body: JSON.stringify({
          [type]: settings
        })
      });
      
      switch(type) {
        case 'email':
          setEmailNotifications(response.email || settings);
          break;
        case 'push':
          setPushNotifications(response.push || settings);
          break;
        case 'slack':
          setSlackIntegration(response.slack || settings);
          break;
        case 'webhooks':
          setWebhookConfig(response.webhooks || settings);
          break;
        case 'quietHours':
          setQuietHours(response.quietHours || settings);
          break;
      }

      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} settings updated`,
        description: `Your ${type} notification preferences have been saved`,
      });
    } catch (error) {
      toast({
        title: `Error updating ${type} settings`,
        description: error.message || `Could not update ${type} settings`,
        variant: 'destructive',
      });
    }
  };

  const testWebhook = async (endpoint) => {
    try {
      await apiClient.request('/settings/notifications/test-webhook', {
        method: 'POST',
        body: JSON.stringify({ endpoint })
      });
      toast({
        title: 'Test webhook sent',
        description: 'A test notification has been sent to your webhook endpoint',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error testing webhook',
        description: error.message || 'Could not send test webhook',
        type: 'error',
      });
    }
  };

  const updateQuietHours = async (updates) => {
    try {
      const response = await apiClient.request('/settings/notifications', {
        method: 'PATCH',
        body: JSON.stringify({
          quietHours: { ...quietHours, ...updates },
        })
      });
      setQuietHours(response.quietHours || { ...quietHours, ...updates });
      toast({
        title: 'Quiet hours updated',
        description: 'Your quiet hours settings have been saved',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error updating quiet hours',
        description: error.message || 'Could not update quiet hours',
        type: 'error',
      });
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  };

  const notificationChannels = [
    { id: 'email', name: 'Email', icon: Mail, description: 'Receive notifications via email' },
    { id: 'push', name: 'Push Notifications', icon: Bell, description: 'Browser and mobile notifications' },
    { id: 'slack', name: 'Slack', icon: MessageSquare, description: 'Send to Slack channels' },
    { id: 'webhook', name: 'Webhooks', icon: AlertCircle, description: 'HTTP POST to custom endpoint' },
  ];

  const eventCategories = [
    {
      name: 'Deployments',
      events: [
        { key: 'deploymentSuccess', label: 'Deployment Successful' },
        { key: 'deploymentFailed', label: 'Deployment Failed' },
        { key: 'deploymentStarted', label: 'Deployment Started' },
      ]
    },
    {
      name: 'Alerts',
      events: [
        { key: 'securityAlerts', label: 'Security Alerts' },
        { key: 'apiErrors', label: 'API Errors' },
        { key: 'buildTimeExceeds', label: 'Build Time Exceeds Threshold' },
      ]
    },
    {
      name: 'Account',
      events: [
        { key: 'billingAlerts', label: 'Billing Alerts' },
        { key: 'weeklyDigest', label: 'Weekly Digest' },
      ]
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Notification Preferences</h1>
        <p className="text-gray-600">Manage how and when you receive notifications from the platform</p>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="quiethours">Quiet Hours</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Email Notifications Tab */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" /> Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {eventCategories.map((category, idx) => (
                <div key={idx}>
                  <h3 className="font-semibold mb-3 text-sm uppercase text-gray-600">{category.name}</h3>
                  <div className="space-y-3">
                    {category.events.map((event) => (
                      <div key={event.key} className="flex items-center justify-between p-3 border rounded-lg">
                        <label className="text-sm font-medium">{event.label}</label>
                        <Switch
                          checked={emailNotifications[event.key]}
                          onCheckedChange={(checked) => {
                            setEmailNotifications({
                              ...emailNotifications,
                              [event.key]: checked
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t">
                <Button 
                  className="w-full"
                  onClick={() => saveNotificationSettings('email', emailNotifications)}
                >
                  Save Email Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          {/* Push Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" /> Push Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">Receive real-time notifications on your devices</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <label className="text-sm font-medium">Deployment Successful</label>
                  <Switch checked={pushNotifications.deploymentSuccess} onCheckedChange={(checked) => {
                    setPushNotifications({ ...pushNotifications, deploymentSuccess: checked });
                  }} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <label className="text-sm font-medium">Deployment Failed</label>
                  <Switch checked={pushNotifications.deploymentFailed} onCheckedChange={(checked) => {
                    setPushNotifications({ ...pushNotifications, deploymentFailed: checked });
                  }} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <label className="text-sm font-medium">Security Alerts</label>
                  <Switch checked={pushNotifications.securityAlerts} onCheckedChange={(checked) => {
                    setPushNotifications({ ...pushNotifications, securityAlerts: checked });
                  }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Slack Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Slack Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Connected to Slack</p>
                  <p className="text-sm text-gray-600">{slackIntegration.channel}</p>
                </div>
                <Badge className="bg-green-100 text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Connected
                </Badge>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <label className="text-sm font-medium">Send Deployment Notifications</label>
                  <Switch checked={slackIntegration.deployments} onCheckedChange={(checked) => {
                    setSlackIntegration({ ...slackIntegration, deployments: checked });
                  }} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <label className="text-sm font-medium">Send Alerts</label>
                  <Switch checked={slackIntegration.alerts} onCheckedChange={(checked) => {
                    setSlackIntegration({ ...slackIntegration, alerts: checked });
                  }} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <label className="text-sm font-medium">Failed Deployments Only</label>
                  <Switch checked={slackIntegration.failureOnly} onCheckedChange={(checked) => {
                    setSlackIntegration({ ...slackIntegration, failureOnly: checked });
                  }} />
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => saveNotificationSettings('slack', slackIntegration)}
                >
                  Save Slack Settings
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => window.location.href = '/api/auth/slack'}
                >
                  {slackIntegration.enabled ? 'Reconnect to Slack' : 'Connect to Slack'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-2">Enable Webhooks</label>
                  <div className="flex items-center gap-2">
                    <Switch checked={webhookConfig.enabled} onCheckedChange={(checked) => {
                      setWebhookConfig({ ...webhookConfig, enabled: checked });
                    }} />
                    {webhookConfig.enabled ? <Badge className="bg-green-100 text-green-800">Enabled</Badge> : <Badge variant="outline">Disabled</Badge>}
                  </div>
                </div>

                {webhookConfig.enabled && (
                  <>
                    <div>
                      <label className="text-sm font-medium block mb-2">Webhook URL</label>
                      <input
                        type="url"
                        placeholder="https://api.example.com/webhooks/deployment"
                        className="w-full px-3 py-2 border rounded"
                        value={webhookConfig.url}
                        onChange={(e) => setWebhookConfig({ ...webhookConfig, url: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">Events</label>
                      <div className="space-y-2">
                        {webhookConfig.events.map((event) => (
                          <div key={event} className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="w-4 h-4" />
                            <label className="text-sm">{event}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">Test Webhook</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiet Hours Tab */}
        <TabsContent value="quiethours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quiet Hours Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium block mb-3">Enable Quiet Hours</label>
                <div className="flex items-center gap-2">
                  <Switch checked={quietHours.enabled} onCheckedChange={(checked) => {
                    setQuietHours({ ...quietHours, enabled: checked });
                  }} />
                  {quietHours.enabled ? <Badge className="bg-green-100 text-green-800">Enabled</Badge> : <Badge variant="outline">Disabled</Badge>}
                </div>
              </div>

              {quietHours.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Start Time</label>
                      <input
                        type="time"
                        value={quietHours.startTime}
                        onChange={(e) => setQuietHours({ ...quietHours, startTime: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">End Time</label>
                      <input
                        type="time"
                        value={quietHours.endTime}
                        onChange={(e) => setQuietHours({ ...quietHours, endTime: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Timezone</label>
                    <select className="w-full px-3 py-2 border rounded" value={quietHours.timezone}>
                      <option>UTC-8 (PST)</option>
                      <option>UTC-5 (EST)</option>
                      <option>UTC+0 (UTC)</option>
                      <option>UTC+1 (CET)</option>
                      <option>UTC+5:30 (IST)</option>
                      <option>UTC+8 (SGT)</option>
                    </select>
                  </div>

                  <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    <p className="text-sm"><span className="font-medium">Note:</span> Critical alerts (security breaches, complete outages) will still be delivered during quiet hours.</p>
                  </div>
                </>
              )}

              <Button 
                className="w-full"
                onClick={() => saveNotificationSettings('quietHours', quietHours)}
              >
                Save Quiet Hours
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notificationHistory.map((notif, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="mt-1">
                      {notif.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {notif.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                      {notif.status === 'alert' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                      {notif.status === 'info' && <Bell className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{notif.type}</Badge>
                        <span className="text-xs text-gray-600">{notif.time}</span>
                      </div>
                      <p className="text-sm mt-1">{notif.message}</p>
                    </div>
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
