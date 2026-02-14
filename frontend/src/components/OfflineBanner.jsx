import { useOnlineStatus } from '@/hooks/useOnlineStatus'

/**
 * Banner shown when the user is offline.
 * Renders nothing when online.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      className="sticky top-0 z-50 w-full bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-medium shadow"
      role="alert"
    >
      You are offline. Some features may not work until connection is restored.
    </div>
  )
}
