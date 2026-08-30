import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastOptions } from './useToast'
import './Toast.css'

interface ToastItem extends ToastOptions { id: number }

export interface ToastProviderProps { children: ReactNode; defaultDuration?: number }

export function ToastProvider({ children, defaultDuration = 5000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)
  const dismissToast = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), [])
  const showToast = useCallback((options: ToastOptions) => {
    const id = ++nextId.current
    setToasts((current) => [...current, { variant: 'info', ...options, id }])
    return id
  }, [])
  const value = useMemo(() => ({ showToast, dismissToast }), [dismissToast, showToast])

  return <ToastContext.Provider value={value}>{children}<ToastViewport toasts={toasts} defaultDuration={defaultDuration} onDismiss={dismissToast} /></ToastContext.Provider>
}

function ToastViewport({ toasts, defaultDuration, onDismiss }: { toasts: ToastItem[]; defaultDuration: number; onDismiss: (id: number) => void }) {
  return <div className="toast-viewport" aria-label="Notifications">{toasts.map((toast) => <Toast key={toast.id} toast={toast} duration={toast.duration ?? defaultDuration} onDismiss={onDismiss} />)}</div>
}

function Toast({ toast, duration, onDismiss }: { toast: ToastItem; duration: number; onDismiss: (id: number) => void }) {
  useEffect(() => {
    if (duration <= 0) return
    const timer = window.setTimeout(() => onDismiss(toast.id), duration)
    return () => window.clearTimeout(timer)
  }, [duration, onDismiss, toast.id])

  const symbol = toast.variant === 'success' ? '✓' : toast.variant === 'error' ? '!' : 'i'
  return (
    <div className={`toast toast--${toast.variant}`} role={toast.variant === 'error' ? 'alert' : 'status'}>
      <span className="toast__icon" aria-hidden="true">{symbol}</span>
      <div className="toast__message">{toast.message}</div>
      {toast.action && <div className="toast__action">{toast.action}</div>}
      <button className="toast__dismiss" type="button" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)}>×</button>
    </div>
  )
}
