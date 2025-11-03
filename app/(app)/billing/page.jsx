'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CreditCard, DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function BillingPage() {
  const [currentPlan] = useState({
    name: 'Professional',
    price: 99,
    features: [
      'Up to 10 projects',
      'Unlimited deployments',
      'Custom domains',
      '50 GB bandwidth/month',
      'Build time: 2000 min/month',
      '24/7 support',
      'Advanced analytics'
    ]
  });

  const [costData] = useState([
    { month: 'Jul', compute: 45, storage: 15, bandwidth: 20, support: 10 },
    { month: 'Aug', compute: 52, storage: 18, bandwidth: 25, support: 10 },
    { month: 'Sep', compute: 48, storage: 16, bandwidth: 22, support: 10 },
    { month: 'Oct', compute: 61, storage: 20, bandwidth: 28, support: 10 },
    { month: 'Nov', compute: 55, storage: 18, bandwidth: 24, support: 10 },
    { month: 'Dec (est.)', compute: 58, storage: 19, bandwidth: 26, support: 10 },
  ]);

  const [usageData] = useState([
    { name: 'Compute', value: 55, color: '#3b82f6' },
    { name: 'Storage', value: 19, color: '#8b5cf6' },
    { name: 'Bandwidth', value: 24, color: '#ec4899' },
    { name: 'Support', value: 2, color: '#f59e0b' },
  ]);

  const [plans] = useState([
    {
      id: 'hobby',
      name: 'Hobby',
      price: 0,
      description: 'For personal projects',
      limits: {
        projects: 3,
        deployments: '5/day',
        bandwidth: '5 GB/month',
        buildTime: '200 min/month',
        domains: 1
      },
      features: ['Community support', 'Public deployments only'],
      badge: null
    },
    {
      id: 'pro',
      name: 'Professional',
      price: 99,
      description: 'For growing teams',
      limits: {
        projects: 10,
        deployments: 'Unlimited',
        bandwidth: '50 GB/month',
        buildTime: '2000 min/month',
        domains: 5
      },
      features: ['Email support', 'Private deployments', 'Advanced analytics', 'Team collaboration'],
      badge: 'CURRENT'
    },
    {
      id: 'business',
      name: 'Business',
      price: 299,
      description: 'For enterprises',
      limits: {
        projects: 'Unlimited',
        deployments: 'Unlimited',
        bandwidth: '500 GB/month',
        buildTime: 'Unlimited',
        domains: 'Unlimited'
      },
      features: ['24/7 priority support', 'Advanced security', 'Custom integrations', 'Dedicated account manager', 'SLA'],
      badge: 'POPULAR'
    },
  ]);

  const [monthlyInvoices] = useState([
    {
      id: 'INV-2024-11',
      date: 'Nov 1, 2024',
      amount: 113.45,
      status: 'paid',
      dueDate: 'Nov 15, 2024',
      items: [
        { name: 'Professional Plan', price: 99 },
        { name: 'Extra Bandwidth (5 GB)', price: 14.45 }
      ]
    },
    {
      id: 'INV-2024-10',
      date: 'Oct 1, 2024',
      amount: 119.33,
      status: 'paid',
      dueDate: 'Oct 15, 2024',
      items: [
        { name: 'Professional Plan', price: 99 },
        { name: 'Extra Build Time (500 min)', price: 20.33 }
      ]
    },
    {
      id: 'INV-2024-09',
      date: 'Sep 1, 2024',
      amount: 99.00,
      status: 'paid',
      dueDate: 'Sep 15, 2024',
      items: [
        { name: 'Professional Plan', price: 99 }
      ]
    },
  ]);

  const [paymentMethods] = useState([
    {
      id: 1,
      type: 'credit_card',
      last4: '4242',
      brand: 'Visa',
      expiry: '12/26',
      isDefault: true
    },
    {
      id: 2,
      type: 'credit_card',
      last4: '5555',
      brand: 'Mastercard',
      expiry: '08/25',
      isDefault: false
    },
  ]);

  const currentMonthUsage = {
    compute: { used: 1250, limit: 2000, percentage: 62.5 },
    storage: { used: 38, limit: 50, percentage: 76 },
    bandwidth: { used: 42, limit: 50, percentage: 84 },
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your plan, invoices, and payment methods</p>
      </div>

      {/* Current Plan Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Plan</p>
              <h2 className="text-3xl font-bold mt-1">{currentPlan.name}</h2>
              <p className="text-sm text-gray-600 mt-2">${currentPlan.price}/month, billed monthly</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-blue-600">${currentPlan.price}</p>
              <Button className="mt-4">Upgrade Plan</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Status */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(currentMonthUsage).map(([key, value]) => (
          <Card key={key}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 capitalize mb-2">{key}</p>
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold">{value.used}/{value.limit}</span>
                  <span className="text-sm text-gray-600">{value.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      value.percentage > 80 ? 'bg-red-500' :
                      value.percentage > 60 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(value.percentage, 100)}%` }}
                  />
                </div>
              </div>
              {value.percentage > 80 && (
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-2">
                  <AlertCircle className="w-3 h-3" /> Usage approaching limit
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={usageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {usageData.map((entry, index) => (
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
                <CardTitle className="text-sm">Cost Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costData.slice(-3)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="compute" fill="#3b82f6" />
                    <Bar dataKey="bandwidth" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>6-Month Cost History</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="compute" stroke="#3b82f6" />
                  <Line type="monotone" dataKey="storage" stroke="#8b5cf6" />
                  <Line type="monotone" dataKey="bandwidth" stroke="#ec4899" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.badge === 'CURRENT' ? 'border-blue-500 border-2' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {plan.badge && (
                      <Badge className={plan.badge === 'CURRENT' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                        {plan.badge}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{plan.description}</p>

                  <div className="mb-4">
                    {plan.price === 0 ? (
                      <p className="text-3xl font-bold">Free</p>
                    ) : (
                      <>
                        <p className="text-3xl font-bold">${plan.price}</p>
                        <p className="text-sm text-gray-600">/month</p>
                      </>
                    )}
                  </div>

                  <div className="space-y-2 mb-4 pb-4 border-b">
                    {Object.entries(plan.limits).map(([key, value]) => (
                      <p key={key} className="text-sm text-gray-700">
                        <span className="font-medium">{key}:</span> {value}
                      </p>
                    ))}
                  </div>

                  <div className="space-y-1 mb-4">
                    {plan.features.map((feature, idx) => (
                      <p key={idx} className="text-sm text-gray-700">✓ {feature}</p>
                    ))}
                  </div>

                  <Button className="w-full" variant={plan.badge === 'CURRENT' ? 'outline' : 'default'}>
                    {plan.badge === 'CURRENT' ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          {monthlyInvoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-semibold">{invoice.id}</p>
                        <p className="text-sm text-gray-600">{invoice.date}</p>
                      </div>
                    </div>

                    <div className="space-y-1 ml-8 text-sm">
                      {invoice.items.map((item, idx) => (
                        <p key={idx} className="text-gray-600">
                          {item.name}: <span className="font-medium">${item.price.toFixed(2)}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold mb-2">${invoice.amount.toFixed(2)}</p>
                    <Badge className={invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {invoice.status === 'paid' ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
                      {invoice.status.toUpperCase()}
                    </Badge>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">Download</Button>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment" className="space-y-4">
          {paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-semibold">{method.brand} •••• {method.last4}</p>
                      <p className="text-sm text-gray-600">Expires {method.expiry}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {method.isDefault && <Badge className="bg-blue-100 text-blue-800">Default</Badge>}
                    <Button size="sm" variant="outline">Edit</Button>
                    {!method.isDefault && <Button size="sm" variant="outline">Remove</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button className="w-full">
            <CreditCard className="w-4 h-4 mr-2" /> Add Payment Method
          </Button>
        </TabsContent>
      </Tabs>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Company Name</label>
              <input type="text" placeholder="Your Company" className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Email</label>
              <input type="email" placeholder="billing@example.com" className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium block mb-1">Address</label>
              <input type="text" placeholder="123 Main St" className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">City</label>
              <input type="text" placeholder="San Francisco" className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Country</label>
              <select className="w-full px-3 py-2 border rounded">
                <option>United States</option>
                <option>Canada</option>
                <option>UK</option>
              </select>
            </div>
          </div>
          <Button>Save Billing Information</Button>
        </CardContent>
      </Card>
    </div>
  );
}
