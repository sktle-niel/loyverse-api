import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type Toast = {
  id: string
  message: string
  durationMs: number
}

type ToastContextValue = {
  toast: Toast | null
  showToast: (opts: { message: string; durationMs?: number }) => void
  closeToast: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)

  const closeToast = useCallback(() => {
    setToast(null)
  }, [])

  const showToast = useCallback(
    ({ message, durationMs = 6000 }: { message: string; durationMs?: number }) => {
      setToast({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message,
        durationMs,
      })
    },
    [],
  )

  const value = useMemo(() => ({ toast, showToast, closeToast }), [toast, showToast, closeToast])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

