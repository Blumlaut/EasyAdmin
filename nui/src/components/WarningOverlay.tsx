import { useCallback, useEffect, useRef, useState } from 'react'
import { callLua } from '../fivem'
import { Icon } from './icons'

interface WarningData {
  title: string
  message: string
  warnedBy: string
  dismissText: string
}

interface WarningOverlayProps {
  warning: WarningData | null
  onDismiss: () => void
}

const HOLD_DURATION_MS = 5000

export function WarningOverlay({ warning, onDismiss }: WarningOverlayProps) {
  const [holdProgress, setHoldProgress] = useState(0)
  const holdStartRef = useRef(0)
  const rafRef = useRef(0)
  const isHoldingRef = useRef(false)

  const animate = useCallback(() => {
    if (!isHoldingRef.current) return
    const elapsed = performance.now() - holdStartRef.current
    const progress = Math.min(elapsed / HOLD_DURATION_MS, 1)
    setHoldProgress(progress)
    if (progress >= 1) {
      isHoldingRef.current = false
      // Release NUI focus back to the game
      callLua('dismissWarning').catch(() => {})
      onDismiss()
      return
    }
    rafRef.current = requestAnimationFrame(animate)
  }, [onDismiss])

  const startHold = useCallback(() => {
    if (isHoldingRef.current) return
    isHoldingRef.current = true
    holdStartRef.current = performance.now()
    rafRef.current = requestAnimationFrame(animate)
  }, [animate])

  const cancelHold = useCallback(() => {
    isHoldingRef.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setHoldProgress(0)
  }, [])

  // Reset hold on pointer leave
  const handlePointerLeave = useCallback(() => {
    if (isHoldingRef.current) cancelHold()
  }, [cancelHold])

  // Reset hold if focus is lost (e.g. tab away)
  const handleBlur = useCallback(() => {
    if (isHoldingRef.current) cancelHold()
  }, [cancelHold])

  // Prevent Spacebar from scrolling the page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        e.stopPropagation()
        if (!isHoldingRef.current) {
          startHold()
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        e.stopPropagation()
        cancelHold()
      }
    }
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    window.addEventListener('keyup', handleKeyUp, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      window.removeEventListener('keyup', handleKeyUp, { capture: true })
    }
  }, [startHold, cancelHold])

  // Cleanup on unmount
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  if (!warning) return null

  return (
    <div className="warning-overlay">
      <div className="warning-card">
        <div className="warning-icon-wrap">
          <Icon name="alert-triangle" size="lg" />
        </div>
        <h2 className="warning-title">{warning.title}</h2>
        <p className="warning-message">{warning.message}</p>
        {warning.warnedBy && (
          <p className="warning-meta">
            <span className="warning-meta-label">{warning.warnedBy}</span>
          </p>
        )}
        <div className="warning-dismiss-wrap">
          <button
            className="warning-dismiss-btn"
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={handlePointerLeave}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            onPointerLeave={handlePointerLeave}
            onBlur={handleBlur}
            style={{
              '--hold-progress': `${holdProgress * 100}%`,
            } as React.CSSProperties}
            autoFocus
          >
            <span className="warning-dismiss-label">{warning.dismissText}</span>
            <span className="warning-progress-track">
              <span className="warning-progress-fill" />
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
