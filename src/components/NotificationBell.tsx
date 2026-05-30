import { usePushNotifications } from '../hooks/usePushNotifications'

export function NotificationBell() {
  const { supported, permission, isSubscribed, isLoading, error, subscribe, unsubscribe } =
    usePushNotifications()

  if (!supported) return null

  const denied = permission === 'denied'

  return (
    <div className="relative group">
      <button
        type="button"
        disabled={isLoading || denied}
        onClick={() => void (isSubscribed ? unsubscribe() : subscribe())}
        title={
          denied
            ? 'Notifications blocked — enable in browser settings'
            : isSubscribed
            ? 'Notifications on — click to turn off'
            : 'Turn on push notifications'
        }
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
          isSubscribed
            ? 'text-primary hover:bg-primary/8'
            : 'text-base-content/50 hover:text-base-content hover:bg-base-content/5'
        }`}
      >
        {isLoading ? (
          <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
          </svg>
        ) : isSubscribed ? (
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
            <circle cx="18" cy="6" r="3" fill="currentColor" stroke="none" />
          </svg>
        ) : denied ? (
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M13.73 21a2 2 0 01-3.46 0" />
            <path d="M18.63 13A17.89 17.89 0 0118 8" />
            <path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        )}
        <span className="text-xs">
          {denied ? 'Notifications blocked' : isSubscribed ? 'Notifications on' : 'Notify on requests'}
        </span>
      </button>

      {error && (
        <p className="absolute bottom-full mb-1 left-2 right-2 text-[10px] text-error bg-base-100 border border-error/20 rounded px-2 py-1 shadow-sm z-50">
          {error}
        </p>
      )}
    </div>
  )
}
