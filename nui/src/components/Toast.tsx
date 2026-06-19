import { useEffect, useRef, useState } from 'react'
import type { ToastItem } from '../types'
import { Icon } from './icons'

interface ToastProps {
  toast: ToastItem
  onDismiss: (id: string) => void
}

const TYPE_CONFIG: Record<ToastItem['type'], { icon: 'info' | 'check-circle' | 'alert-triangle' | 'alert-circle'; accent: string; label: string }> = {
  info: { icon: 'info', accent: 'var(--accent-blue)', label: 'Info' },
  success: { icon: 'check-circle', accent: 'var(--accent-green)', label: 'Success' },
  warn: { icon: 'alert-triangle', accent: 'var(--accent-orange)', label: 'Warning' },
  error: { icon: 'alert-circle', accent: 'var(--accent-red)', label: 'Error' },
}

const EXIT_DELAY_MS = 250

export function Toast({ toast, onDismiss }: ToastProps) {
  const { icon, accent, label } = TYPE_CONFIG[toast.type]
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [exiting, setExiting] = useState(false)

  const progress = Math.max(0, 1 - (performance.now() - toast.createdAt) / toast.duration)

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    }
  }, [])

  const handleDismiss = () => {
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    setExiting(true)
    exitTimerRef.current = setTimeout(() => onDismiss(toast.id), EXIT_DELAY_MS)
  }

  return (
    <div
      className={`toast toast--${toast.type}${exiting ? ' toast--exiting' : ''}`}
      role="alert"
      style={
        {
          '--toast-accent': accent,
          '--toast-progress': progress,
        } as React.CSSProperties
      }
      data-toast-enter
    >
      {/* Accent bar (top edge) */}
      <div className="toast-accent-bar" />

      {/* Header */}
      <div className="toast-header">
        <div className="toast-header-left">
          <Icon name={icon} size="xs" className="toast-header-icon" />
          <span className="toast-header-label">{label}</span>
          <span className="toast-header-brand">EasyAdmin</span>
        </div>
        <button
          className="toast-dismiss-btn"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          <Icon name="x" size="xs" />
        </button>
      </div>

      {/* Body */}
      <div className="toast-body">
        <span className="toast-message">{toast.message}</span>
      </div>

      {/* Progress bar */}
      <div className="toast-progress-track">
        <div className="toast-progress-fill" />
      </div>
    </div>
  )
}
