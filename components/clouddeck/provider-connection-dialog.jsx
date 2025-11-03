'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import apiClient from '@/lib/api-client'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export function ProviderConnectionDialog({ provider, isOpen, onClose, onSuccess }) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const providerInfo = {
    vercel: {
      name: 'Vercel',
      description: 'Deploy Next.js and static sites to Vercel',
      tokenLabel: 'API Token',
      tokenPlaceholder: 'Enter your Vercel API token',
      tokenLink: 'https://vercel.com/account/tokens',
      instructions: [
        'Go to https://vercel.com/account/tokens',
        'Create a new token (Full Access recommended)',
        'Copy and paste the token below',
      ],
    },
    netlify: {
      name: 'Netlify',
      description: 'Deploy to Netlify with automatic builds',
      tokenLabel: 'Personal Access Token',
      tokenPlaceholder: 'Enter your Netlify token',
      tokenLink: 'https://app.netlify.com/user/applications',
      instructions: [
        'Go to https://app.netlify.com/user/applications',
        'Create a new personal access token',
        'Copy and paste the token below',
      ],
    },
    render: {
      name: 'Render',
      description: 'Deploy to Render with free tier support',
      tokenLabel: 'API Key',
      tokenPlaceholder: 'Enter your Render API key',
      tokenLink: 'https://dashboard.render.com/account/api-tokens',
      instructions: [
        'Go to https://dashboard.render.com/account/api-tokens',
        'Create a new API token',
        'Copy and paste the key below',
      ],
    },
  }

  const info = providerInfo[provider] || {}

  const handleConnect = async () => {
    if (!token.trim()) {
      setError('Token is required')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const result = await apiClient.connectProvider(provider, {
        token,
      })

      setSuccess(true)
      setToken('')
      setTimeout(() => {
        onSuccess?.(result)
        onClose()
      }, 1500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect provider'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect {info.name}</DialogTitle>
          <DialogDescription>{info.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-slate-50 p-3 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">How to get your token:</h4>
            <ol className="space-y-1">
              {(info.instructions || []).map((instruction, index) => (
                <li key={index} className="text-sm text-slate-600">
                  {index + 1}. {instruction}
                </li>
              ))}
            </ol>
          </div>

          {/* Token Input */}
          <div>
            <label className="block text-sm font-medium mb-2">{info.tokenLabel}</label>
            <Input
              type="password"
              placeholder={info.tokenPlaceholder}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
              className="font-mono text-xs"
            />
            <p className="text-xs text-slate-500 mt-1">
              Your token will be securely stored and never shared.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully connected to {info.name}!
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={loading || !token.trim() || success}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {success ? 'Connected!' : 'Connect'}
            </Button>
          </div>

          {/* Help Link */}
          <div className="text-center">
            <a
              href={info.tokenLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Get your {info.name} token →
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
