import { Suspense } from 'react'

export const metadata = {
  title: 'CloudDeck - Authentication',
  description: 'Unified Cloud Dashboard',
}

export default function AuthLayout({ children }) {
  return (
    <Suspense fallback={null}>
      {children}
    </Suspense>
  )
}
