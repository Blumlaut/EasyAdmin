import { useCallback, useEffect, useRef, useState } from 'react'
import type { Notification } from '../types'
import { on } from '../fivem'

const TOAST_DURATION_MS = 3000
const TOAST_EXIT_MS = 300 // must match CSS transition duration
const MAX_TOASTS = 3

interface QueuedToast extends Notification {
  id: number
  dismissing: boolean
}

let nextId = 0

export function useToast() {
  const [queue, setQueue] = useState<QueuedToast[]>([])
  const idCounterRef = useRef(nextId)
  const timersRef = useRef<Map<number, number>>(new Map())
  const dismissToastRef = useRef<(id: number) => void>()

  const dismissToast = useCallback((id: number) => {
    // Mark as dismissing so the exit animation plays
    setQueue((prev) =>
      prev.map((t) => (t.id === id ? { ...t, dismissing: true } : t)),
    )
    // Remove after transition completes
    timersRef.current.set(
      id,
      window.setTimeout(() => {
        setQueue((prev) => prev.filter((t) => t.id !== id))
        timersRef.current.delete(id)
      }, TOAST_EXIT_MS),
    )
  }, [])

  // Keep ref in sync so showToast can call the latest dismissToast
  // without creating a useCallback dependency cycle
  dismissToastRef.current = dismissToast

  const showToast = useCallback(
    (text: string, type: Notification['type'] = 'info') => {
      const id = idCounterRef.current++
      const newToast: QueuedToast = { id, text, type, dismissing: false }

      setQueue((prev) => {
        const filtered = prev.filter((t) => !t.dismissing)
        // Keep max N toasts — drop oldest
        const sliced =
          filtered.length >= MAX_TOASTS ? filtered.slice(1) : filtered
        return [...sliced, newToast]
      })

      // Auto-dismiss (use ref to avoid useCallback dependency on dismissToast)
      timersRef.current.set(
        id,
        window.setTimeout(() => dismissToastRef.current?.(id), TOAST_DURATION_MS),
      )
    },
    [],
  )

  // Listen for notifications from Lua
  useEffect(() => {
    return on<Notification>('notification', (data) => {
      showToast(data.text, data.type)
    })
  }, [showToast])

  // Cleanup timers on unmount
  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current.clear()
  }, [])

  return { queue, showToast, dismissToast }
}
