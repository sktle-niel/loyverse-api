import { useEffect, useRef } from 'react'
import { useToast } from '../context/ToastContext'
import { SuccessToast } from './SuccessToast'

export function ToastLayer() {
  const { toast, closeToast } = useToast()
  const lastToastIdRef = useRef<string | null>(null)



  useEffect(() => {
    if (!toast) {
      lastToastIdRef.current = null
      return
    }
    lastToastIdRef.current = toast.id
  }, [toast])

  if (!toast) return null

  return (
    <SuccessToast
      open={true}
      message={toast.message}
      durationMs={toast.durationMs}
      onClose={closeToast}
    />
  )
}

