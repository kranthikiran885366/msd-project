'use client'
import { toast as notify, type ExternalToast } from 'sonner'
import type { ReactNode } from 'react'
type ToastOptions = {
  title?: ReactNode
  description?: ReactNode
  variant?: 'default' | 'destructive'
  duration?: number
  action?: ExternalToast['action']
}
function toast(options: ToastOptions) {
  const { title, variant, ...rest } = options
  const id = (variant === 'destructive' ? notify.error : notify)(title || 'Notification', rest)
  return { id: String(id), dismiss: () => notify.dismiss(id), update: (next: ToastOptions) => notify(next.title || title || 'Notification', { ...rest, ...next, id }) }
}
function useToast() { return { toast, dismiss: (id?: string) => notify.dismiss(id) } }
export { useToast, toast }
