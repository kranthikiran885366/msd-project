"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message") || "An authentication error occurred. Please try again."

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Authentication Error</h1>
          <p className="text-slate-400 text-lg">{decodeURIComponent(message)}</p>
        </div>
        <div className="pt-4 space-y-3">
          <Button asChild className="w-full">
            <Link href="/login">Try Again</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Back Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
