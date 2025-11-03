"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message") || "An authentication error occurred"

  return (
    <main className="min-h-svh flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="w-full max-w-md relative">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle className="size-6 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold">Authentication Failed</h1>
            <p className="text-muted-foreground">Something went wrong during sign in</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-600 font-mono break-words">
                {decodeURIComponent(message)}
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/login" className="block">
                <Button className="w-full">Try Again</Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">Go Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
