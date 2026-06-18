import React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Notification } from '../types'
import { Icon } from './icons'

interface ToastProps {
  id: number
  message: string
  type?: Notification['type']
  dismissing: boolean
  onDismiss?: (id: number) => void
}

function ToastInner({ id, message, type = 'info', dismissing, onDismiss }: ToastProps) {
  const mounted = useRef(false)
  const visRef = useRef(false)
  const [, setTick] = useState(0)

  // Entrance — fires once on mount
  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    const t = requestAnimationFrame(() => {
      visRef.current = true
      setTick((k) => k + 1)
    })
    return () => cancelAnimationFrame(t)
  }, [])

  // Exit — fires when dismissing flips
  useEffect(() => {
    if (dismissing) {
      visRef.current = false
      setTick((k) => k + 1)
    }
  }, [dismissing])

  const handleDismiss = useCallback(() => {
    onDismiss?.(id)
  }, [id, onDismiss])

  return (
    <div
      className={`toast toast-${type}`}
      style={{
        opacity: visRef.current ? 1 : 0,
        marginRight: visRef.current ? 0 : 32,
      }}
      role="alert"
    >
      {type === 'error' && <Icon name="alert-triangle" size="xs" className="shrink-0" />}
      <span className={type === 'error' ? 'ml-2' : ''}>{message}</span>
      {onDismiss && (
        <button
          className="toast-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <Icon name="x" size="xs" />
        </button>
      )}
    </div>
  )
}

export const Toast = React.memo(ToastInner)
