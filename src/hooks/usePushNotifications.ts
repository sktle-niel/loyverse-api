import { useCallback, useEffect, useState } from 'react'
import { apiPostJson, apiFetchJson } from '../api/client'

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output.buffer
}

const isPushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supported = isPushSupported()

  // Check current state on mount
  useEffect(() => {
    if (!supported) return
    setPermission(Notification.permission)

    navigator.serviceWorker.ready
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription()
        if (!sub) { setIsSubscribed(false); return }
        // Verify with server (subscription may have been cleared server-side)
        try {
          const { subscribed } = await apiPostJson<{ subscribed: boolean }>('/push/status', {
            endpoint: sub.endpoint,
          })
          setIsSubscribed(subscribed)
          if (!subscribed) await sub.unsubscribe()
        } catch {
          setIsSubscribed(!!sub)
        }
      })
      .catch(() => null)
  }, [supported])

  const subscribe = useCallback(async () => {
    if (!supported) return
    setIsLoading(true)
    setError(null)
    try {
      // Request notification permission
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        setError('Notification permission denied. Enable it in your browser settings.')
        return
      }

      // Get VAPID public key from backend
      const { publicKey } = await apiFetchJson<{ publicKey: string }>('/push/key')

      // Subscribe via browser Push API
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      // Send subscription to backend
      const json = sub.toJSON()
      await apiPostJson('/push/subscribe', {
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      })

      setIsSubscribed(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to enable notifications.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [supported])

  const unsubscribe = useCallback(async () => {
    if (!supported) return
    setIsLoading(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await apiPostJson('/push/subscribe', { endpoint: sub.endpoint }).catch(() => null)
        // Use DELETE via apiPostJson workaround — call unsubscribe on push manager
        await sub.unsubscribe()
        // Tell server to remove it
        await fetch(`${window.location.origin}/api/push/subscribe`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth.token') ?? ''}`,
          },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => null)
      }
      setIsSubscribed(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to disable notifications.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [supported])

  return { supported, permission, isSubscribed, isLoading, error, subscribe, unsubscribe }
}
