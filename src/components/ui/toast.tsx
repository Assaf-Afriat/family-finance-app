import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: string
  title: string
  description?: string
  type?: 'success' | 'error' | 'info'
  action?: ToastAction
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  showToast: (title: string, type?: Toast['type'], description?: string) => string
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const timeoutRefs = React.useRef<Map<string, NodeJS.Timeout>>(new Map())

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])

    const duration = toast.duration ?? (toast.action ? 8000 : 4000)
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      timeoutRefs.current.delete(id)
    }, duration)
    
    timeoutRefs.current.set(id, timeout)
    return id
  }, [])

  const removeToast = React.useCallback((id: string) => {
    const timeout = timeoutRefs.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutRefs.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = React.useCallback(
    (title: string, type?: Toast['type'], description?: string) =>
      addToast({ title, type, description }),
    [addToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[]
  removeToast: (id: string) => void
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-right-full duration-300',
            'bg-card text-card-foreground',
            toast.type === 'success' && 'border-green-500/50 bg-green-50 dark:bg-green-950/20',
            toast.type === 'error' && 'border-red-500/50 bg-red-50 dark:bg-red-950/20'
          )}
        >
          <div className="flex-1">
            <p className="font-medium text-sm">{toast.title}</p>
            {toast.description && (
              <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>
            )}
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick()
                  removeToast(toast.id)
                }}
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export function toast(options: Omit<Toast, 'id'>) {
  const event = new CustomEvent('toast', { detail: options })
  window.dispatchEvent(event)
}
