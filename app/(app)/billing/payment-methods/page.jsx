'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Plus, Trash2, Settings, CreditCard, Lock } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [defaultMethod, setDefaultMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [newPaymentMethod, setNewPaymentMethod] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    cardholderName: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: 'US',
    setAsDefault: true,
  });

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setError('');
        const response = await apiClient.getPaymentMethods();

        if (response.success) {
          setPaymentMethods(response.data || []);
          const defaultMethod = response.data?.find(m => m.isDefault);
          if (defaultMethod) setDefaultMethod(defaultMethod.id);
        } else {
          setError(response.error || 'Failed to fetch payment methods');
        }
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const handleAddPaymentMethod = async () => {
    try {
      setError('');
      
      if (!newPaymentMethod.cardNumber || !newPaymentMethod.cvc) {
        setError('Card number and CVC are required');
        return;
      }

      setSaving(true);
      const response = await apiClient.addPaymentMethod(newPaymentMethod);

      if (response.success) {
        setPaymentMethods([...paymentMethods, response.data]);
        if (newPaymentMethod.setAsDefault) {
          setDefaultMethod(response.data.id);
        }
        setNewPaymentMethod({
          cardNumber: '',
          expiryMonth: '',
          expiryYear: '',
          cvc: '',
          cardholderName: '',
          billingAddress: '',
          billingCity: '',
          billingState: '',
          billingZip: '',
          billingCountry: 'US',
          setAsDefault: true,
        });
        setShowAddForm(false);
        setSuccessMessage('Payment method added successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to add payment method');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId) => {
    if (!confirm('Delete this payment method?')) return;

    try {
      setError('');
      setSaving(true);
      const response = await apiClient.deletePaymentMethod(methodId);

      if (response.success) {
        setPaymentMethods(paymentMethods.filter(m => m.id !== methodId));
        if (defaultMethod === methodId) setDefaultMethod(null);
        setSuccessMessage('Payment method deleted');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete payment method');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (methodId) => {
    try {
      setError('');
      setSaving(true);
      const response = await apiClient.setDefaultPaymentMethod(methodId);

      if (response.success) {
        setDefaultMethod(methodId);
        setSuccessMessage('Default payment method updated');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to set default payment method');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Payment Methods</h1>
        <p className="text-muted-foreground">
          Manage your credit cards and billing information
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

      {/* Security Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Lock className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          All payment information is encrypted and securely stored. We never store full card numbers on our servers.
        </AlertDescription>
      </Alert>

      {/* Saved Payment Methods */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Saved Cards</h2>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Payment Method
          </Button>
        </div>

        {paymentMethods.length === 0 && !showAddForm ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No payment methods saved</p>
              <p className="text-sm">Add your first payment method to get started</p>
            </CardContent>
          </Card>
        ) : (
          paymentMethods.map((method) => (
            <Card
              key={method.id}
              className={defaultMethod === method.id ? 'border-green-200 bg-green-50' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded flex items-center justify-center text-white font-bold text-sm">
                      {method.brand.substring(0, 3).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{method.cardholderName}</p>
                      <p className="text-sm text-muted-foreground">
                        {method.brand} ending in {method.lastFourDigits}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {method.expiryMonth}/{method.expiryYear}
                      </p>
                      {method.billingAddress && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {method.billingAddress}, {method.billingCity}, {method.billingState} {method.billingZip}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {defaultMethod === method.id && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 w-fit">
                        Default
                      </Badge>
                    )}

                    <div className="flex gap-2">
                      {defaultMethod !== method.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(method.id)}
                          disabled={saving}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        disabled={saving}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Payment Method Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Card Details */}
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="John Doe"
                value={newPaymentMethod.cardholderName}
                onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cardholderName: e.target.value})}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={newPaymentMethod.cardNumber}
                onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cardNumber: e.target.value})}
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryMonth">Expiry Month</Label>
                <Input
                  id="expiryMonth"
                  placeholder="MM"
                  maxLength="2"
                  value={newPaymentMethod.expiryMonth}
                  onChange={(e) => setNewPaymentMethod({...newPaymentMethod, expiryMonth: e.target.value})}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryYear">Expiry Year</Label>
                <Input
                  id="expiryYear"
                  placeholder="YY"
                  maxLength="2"
                  value={newPaymentMethod.expiryYear}
                  onChange={(e) => setNewPaymentMethod({...newPaymentMethod, expiryYear: e.target.value})}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  placeholder="123"
                  maxLength="4"
                  type="password"
                  value={newPaymentMethod.cvc}
                  onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cvc: e.target.value})}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Billing Address */}
            <div className="border-t pt-4">
              <p className="font-semibold mb-3">Billing Address</p>

              <div className="space-y-2">
                <Label htmlFor="billingAddress">Street Address</Label>
                <Input
                  id="billingAddress"
                  placeholder="123 Main St"
                  value={newPaymentMethod.billingAddress}
                  onChange={(e) => setNewPaymentMethod({...newPaymentMethod, billingAddress: e.target.value})}
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="billingCity">City</Label>
                  <Input
                    id="billingCity"
                    placeholder="New York"
                    value={newPaymentMethod.billingCity}
                    onChange={(e) => setNewPaymentMethod({...newPaymentMethod, billingCity: e.target.value})}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingState">State</Label>
                  <Input
                    id="billingState"
                    placeholder="NY"
                    maxLength="2"
                    value={newPaymentMethod.billingState}
                    onChange={(e) => setNewPaymentMethod({...newPaymentMethod, billingState: e.target.value})}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="billingZip">ZIP Code</Label>
                  <Input
                    id="billingZip"
                    placeholder="10001"
                    value={newPaymentMethod.billingZip}
                    onChange={(e) => setNewPaymentMethod({...newPaymentMethod, billingZip: e.target.value})}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingCountry">Country</Label>
                  <select
                    id="billingCountry"
                    value={newPaymentMethod.billingCountry}
                    onChange={(e) => setNewPaymentMethod({...newPaymentMethod, billingCountry: e.target.value})}
                    disabled={saving}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Set as Default */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <input
                type="checkbox"
                id="setAsDefault"
                checked={newPaymentMethod.setAsDefault}
                onChange={(e) => setNewPaymentMethod({...newPaymentMethod, setAsDefault: e.target.checked})}
                disabled={saving}
              />
              <Label htmlFor="setAsDefault" className="font-normal cursor-pointer">
                Set as default payment method
              </Label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPaymentMethod}
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Adding...' : 'Add Payment Method'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Payment Security</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>• We use PCI DSS Level 1 compliant payment processing</p>
          <p>• Your card details are never stored on our servers</p>
          <p>• All transactions are encrypted with SSL/TLS</p>
          <p>• We support Visa, Mastercard, American Express, and Discover</p>
          <p>• Charges appear as "CloudDeck" on your statement</p>
        </CardContent>
      </Card>
    </div>
  );
}
