import { Suspense } from 'react'

export const metadata = {
  title: 'CloudDeck - Login',
  description: 'Sign in to your CloudDeck account',
}

export default function LoginLayout({ children }) {
  return (
    <Suspense fallback={null}>
      {children}
    </Suspense>
  )
}
