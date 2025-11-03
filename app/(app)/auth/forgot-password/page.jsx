'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'idle', 'loading', 'sent', 'error'
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setStatus('loading');
    setError('');
    setMessage('');

    try {
      // Real API call to request password reset
      const response = await apiClient.forgotPassword(email);
      
      if (response.success) {
        setStatus('sent');
        setMessage(`Password reset link sent to ${email}. Check your inbox within 5 minutes.`);
        setEmail('');
      } else {
        setStatus('error');
        setError(response.error || 'Failed to send reset link. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setError(err.message || 'An error occurred. Please try again later.');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mx-auto">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-muted-foreground">Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        {/* Form Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            {status === 'sent' ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">
                    {message}
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Didn't receive the email?</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStatus('idle');
                      setEmail('');
                    }}
                    className="w-full"
                  >
                    Try another email
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send a password reset link to this email address
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !email}
                  className="w-full h-10 bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  asChild
                  className="w-full h-10"
                >
                  <Link href="/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to login
                  </Link>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <p className="text-xs text-center text-muted-foreground">
          Remember your password?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
