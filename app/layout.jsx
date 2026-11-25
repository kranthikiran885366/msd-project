import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"

export const metadata = {
  title: "CloudDeck · Your code, delivered",
  description: "A focused workspace for Git-based deployments, projects and delivery logs.",
}

export default function RootLayout({ children }) {
  const enableVercelAnalytics = process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === "true"

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Suspense fallback={null}>
            {children}
            <Toaster />
            {enableVercelAnalytics ? <Analytics /> : null}
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  )
}