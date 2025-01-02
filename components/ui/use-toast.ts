import { toast as sonnerToast } from 'sonner'

interface ToastOptions {
  title: string
  description: string
  variant?: 'default' | 'destructive'
}

interface Toast {
  (options: ToastOptions): void
  error: (message: string) => void
  success: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const customToast = (options: ToastOptions) => {
  sonnerToast(options.title, {
    description: options.description,
    style: options.variant === 'destructive' ? { backgroundColor: 'rgb(239, 68, 68)' } : undefined
  })
}

export const toast = Object.assign(customToast, {
  error: (message: string) => {
    sonnerToast.error(message)
  },
  success: (message: string) => {
    sonnerToast.success(message)
  },
  info: (message: string) => {
    sonnerToast.info(message)
  },
  warning: (message: string) => {
    sonnerToast.warning(message)
  }
}) as Toast 