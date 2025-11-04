'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { AlertCircle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams.get('message') || 'Authentication failed. Please try again.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-6 text-sm">{message}</p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-red-900 mb-2">What went wrong?</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• OAuth credentials may not be configured correctly</li>
              <li>• GitHub OAuth app may be missing required scopes</li>
              <li>• Callback URL might not be authorized</li>
              <li>• Network connection issue</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/login')}
              className="w-full gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Home
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              If you continue to experience issues, please <a href="mailto:support@deployer.dev" className="text-blue-600 hover:underline">contact support</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
