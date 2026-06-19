import { useCallback, useEffect, useSyncExternalStore } from 'react'
import type { Notification, ToastItem } from '../types'
import { on } from '../fivem'

const DEFAULT_DURATION_MS = 5000
const TOAST_DURATION_MS = 5000

// ---- Module-level singleton (shared across all hook instances) ----

let idCounter = 0
const queue: ToastItem[] = []
const listeners: Set<() => void> = new Set()
let rafId: number | null = null
let eventSubscribed = false

function notifyListeners() {
  listeners.forEach((fn) => fn())
}

function scheduleTick() {
  if (rafId === null) {
    rafId = requestAnimationFrame(() => {
      rafId = null
      const now = performance.now()
      const expiredIds: string[] = []

      for (const toast of queue) {
        if (now - toast.createdAt >= toast.duration) {
          expiredIds.push(toast.id)
        }
      }

      if (expiredIds.length > 0) {
        for (const id of expiredIds) {
          const idx = queue.findIndex((t) => t.id === id)
          if (idx !== -1) queue.splice(idx, 1)
        }
        notifyListeners()
      }

      // Keep ticking while toasts are alive
      if (queue.length > 0) {
        scheduleTick()
      }
    })
  }
}

function addToast(message: string, type: ToastItem['type'] = 'info', duration = DEFAULT_DURATION_MS): void {
  queue.push({
    id: `t-${Date.now()}-${++idCounter}`,
    message,
    type,
    createdAt: performance.now(),
    duration,
  })
  notifyListeners()
  scheduleTick()
}

function removeToast(id: string): void {
  const idx = queue.findIndex((t) => t.id === id)
  if (idx !== -1) {
    queue.splice(idx, 1)
    notifyListeners()
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function getSnapshot(): ToastItem[] {
  return queue
}

// Subscribe to the 'notification' event from Lua (once only)
function subscribeToEvents(): void {
  if (eventSubscribed) return
  eventSubscribed = true
  on<Notification>('notification', (data) => {
    addToast(data.text, data.type ?? 'info', TOAST_DURATION_MS)
  })
}

// ---- Hook ----

export function useToast() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const showToast = useCallback((text: string, type: Notification['type'] = 'info', duration?: number) => {
    addToast(text, type ?? 'info', duration ?? DEFAULT_DURATION_MS)
  }, [])

  const dismissToast = useCallback((id: string) => {
    removeToast(id)
  }, [])

  useEffect(() => {
    subscribeToEvents()
  }, [])

  return { toasts, showToast, dismissToast }
}
