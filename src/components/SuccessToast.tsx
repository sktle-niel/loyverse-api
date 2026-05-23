import { useEffect, useState } from 'react'

export type SuccessToastProps = {
  open: boolean
  message: string
  durationMs?: number
  onClose: () => void
}

export function SuccessToast({
  open,
  message,
  durationMs = 6000,
  onClose,
}: SuccessToastProps) {
  const [visible, setVisible] = useState(open)

  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }

    setVisible(true)
    const t = window.setTimeout(() => {
      setVisible(false)
      // give the animation a moment to finish
      window.setTimeout(onClose, 350)
    }, durationMs)

    return () => window.clearTimeout(t)
  }, [open, durationMs, onClose])

  if (!open && !visible) return null

  return (
    <div
      className={`fixed z-50 top-4 right-4 px-3 sm:px-0 w-full sm:w-auto pointer-events-none transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div
        role="status"
        className="pointer-events-auto flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-4 rounded-2xl shadow-lg bg-success text-success-content border border-success/30"
      >
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 mt-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 8.707 9.879a1 1 0 00-1.414 1.414l1.414 1.414a1 1 0 001.414 0l3.586-3.586z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="text-sm sm:text-base leading-snug">
          <div className="font-semibold">Success</div>
          <div className="text-success-content/90">{message}</div>
        </div>
        <div className="flex-1" />
          <button
            type="button"
            className="btn btn-ghost btn-sm text-success-content/90 hover:bg-success/10 hover:text-success-content focus-visible:ring-2 focus-visible:ring-success/40"
            onClick={() => {
              setVisible(false)
              window.setTimeout(onClose, 150)
            }}
          >
            Close
          </button>
      </div>
    </div>
  )
}

