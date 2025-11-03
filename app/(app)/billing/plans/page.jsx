'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function BillingPlansPage() {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setError('');
        const [plansRes, currentRes] = await Promise.all([
          apiClient.getBillingPlans(),
          apiClient.getCurrentPlan()
        ]);

        if (plansRes.success) setPlans(plansRes.data || []);
        if (currentRes.success) setCurrentPlan(currentRes.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleUpgradePlan = async (planId) => {
    try {
      setError('');
      setUpgrading(planId);

      const response = await apiClient.upgradePlan(planId);

      if (response.success) {
        setCurrentPlan(response.data);
        setSuccessMessage('Plan upgraded successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to upgrade plan');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setUpgrading(null);
    }
  };

  const handleDowngradePlan = async (planId) => {
    if (!confirm('Downgrading may result in feature loss. Continue?')) return;

    try {
      setError('');
      setUpgrading(planId);

      const response = await apiClient.downgradePlan(planId);

      if (response.success) {
        setCurrentPlan(response.data);
        setSuccessMessage('Plan downgraded successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to downgrade plan');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Billing Plans</h1>
        <p className="text-muted-foreground">
          Choose the plan that fits your needs
        </p>
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

      {/* Current Plan Info */}
      {currentPlan && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Current Plan</span>
              <Badge className="text-lg px-3 py-1">{currentPlan.name}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Price:</strong> ${currentPlan.price}/month
            </p>
            <p>
              <strong>Renewal:</strong> {new Date(currentPlan.renewalDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Active
              </Badge>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan?.id === plan.id;

          return (
            <Card
              key={plan.id}
              className={`flex flex-col ${
                isCurrentPlan
                  ? 'border-2 border-primary shadow-lg'
                  : ''
              } ${
                plan.popular ? 'lg:scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-primary text-white px-4 py-1 text-xs font-semibold text-center">
                  MOST POPULAR
                </div>
              )}

              <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                {/* Plan Name & Price */}
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 flex-1">
                  {plan.features?.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limits */}
                {plan.limits && (
                  <div className="space-y-2 text-xs text-muted-foreground border-t pt-4">
                    <p>
                      <strong>Deployments:</strong> {plan.limits.deployments}/month
                    </p>
                    <p>
                      <strong>Builds:</strong> {plan.limits.builds}/month
                    </p>
                    <p>
                      <strong>Storage:</strong> {plan.limits.storage}GB
                    </p>
                    <p>
                      <strong>Team Members:</strong> {plan.limits.teamMembers}
                    </p>
                  </div>
                )}

                {/* Button */}
                <div className="pt-4">
                  {isCurrentPlan ? (
                    <Button disabled className="w-full">
                      <Check className="w-4 h-4 mr-2" />
                      Current Plan
                    </Button>
                  ) : plan.price > (currentPlan?.price || 0) ? (
                    <Button
                      onClick={() => handleUpgradePlan(plan.id)}
                      disabled={upgrading === plan.id}
                      className="w-full"
                    >
                      {upgrading === plan.id ? 'Upgrading...' : 'Upgrade'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleDowngradePlan(plan.id)}
                      disabled={upgrading === plan.id}
                      variant="outline"
                      className="w-full"
                    >
                      {upgrading === plan.id ? 'Downgrading...' : 'Downgrade'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ / Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Plan Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-semibold">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-2 px-4 font-semibold">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-4">Monthly Price</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-2 px-4">
                      ${plan.price}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">Support</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-2 px-4">
                      {plan.support === 'email' ? 'Email' : plan.support === 'phone' ? 'Phone & Email' : '24/7'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">SLA</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-2 px-4">
                      {plan.sla}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Plan Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>• All plans include 14-day free trial</p>
          <p>• Upgrade or downgrade anytime with prorated billing</p>
          <p>• No long-term contracts required</p>
          <p>• Cancel anytime from your account settings</p>
          <p>• Enterprise plans available with custom terms</p>
        </CardContent>
      </Card>
    </div>
  );
}
