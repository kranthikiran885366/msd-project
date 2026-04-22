"use client"

import { Suspense, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppStore } from "@/store/use-app-store"
import apiClient from "@/lib/api-client"
import tokenService from "@/lib/token-service"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, setIsAuthenticated } = useAppStore()

  const processCallback = useCallback(async () => {
    try {
      const token = searchParams.get("token")
      const refreshToken = searchParams.get("refreshToken")
      const userId = searchParams.get("userId")
      const email = searchParams.get("email")
      const name = searchParams.get("name")
      const avatar = searchParams.get("avatar")
      const isNew = searchParams.get("isNew") === "true"
      const provider = searchParams.get("provider") || "google"
      const githubConnected = searchParams.get("github-connected") === "true"
      const returnUrl = searchParams.get("returnUrl")

      // Check if we have the required params
      if (!token || !refreshToken) {
        router.push("/login/error?message=Missing authentication tokens")
        return
      }

      // Store tokens using token service for secure handling
      tokenService.setAccessToken(token)
      tokenService.setRefreshToken(refreshToken)
      
      // Also set in API client for immediate use
      apiClient.setToken(token)
      apiClient.setRefreshToken(refreshToken)

      // Store user data
      const userData = {
        id: userId,
        email,
        name,
        avatar: avatar || null,
        provider,
      }
      tokenService.setUser(userData)

      // Set user data in store
      setUser(userData)
      setIsAuthenticated(true)

      // Show welcome message if new user
      if (isNew) {
        console.log(`Welcome ${name}! Your account has been created.`)
      } else {
        console.log(`Welcome back ${name}!`)
      }

      // If GitHub was connected, redirect back to deployments page to show the dialog with repos
      if (githubConnected) {
        console.log('GitHub connected successfully, redirecting to return URL with GitHub import dialog flag')
        // Signal that we should re-open the GitHub import dialog
        sessionStorage.setItem('github-import-pending', 'true')
        if (returnUrl) {
          try {
            const resolved = new URL(returnUrl, window.location.origin)
            if (resolved.origin === window.location.origin) {
              router.push(`${resolved.pathname}${resolved.search}${resolved.hash}`)
              return
            }
          } catch {
            // Fall through to default deployments route
          }
        }
        router.push("/deployments")
        return
      }

      if (returnUrl) {
        try {
          const resolved = new URL(returnUrl, window.location.origin)
          if (resolved.origin === window.location.origin) {
            router.push(`${resolved.pathname}${resolved.search}${resolved.hash}`)
            return
          }
        } catch {
          // Fall through to default dashboard route
        }
      }

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Auth callback error:", error)
      router.push(`/login/error?message=${encodeURIComponent(error.message)}`)
    }
  }, [searchParams, router, setUser, setIsAuthenticated])

  useEffect(() => {
    processCallback()
  }, [processCallback])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center space-y-4">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full"></div>
        </div>
        <h2 className="text-xl font-semibold text-white">Completing authentication...</h2>
        <p className="text-slate-400">Please wait while we process your login.</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center space-y-4">
          <div className="animate-spin">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full"></div>
          </div>
          <h2 className="text-xl font-semibold text-white">Completing authentication...</h2>
          <p className="text-slate-400">Please wait while we process your login.</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
