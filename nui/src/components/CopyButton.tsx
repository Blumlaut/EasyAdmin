import { useEffect, useCallback, useRef, useState } from 'react'
import { Icon } from './icons'
import { copyToClipboard } from '../utils/clipboard'

const COPIED_TIMEOUT = 2000

interface CopyButtonProps {
  /** Text to copy to clipboard. */
  value: string
  /** Called after successful copy. Optional — for side effects like toasts. */
  onCopy?: () => void
  /** Aria label for accessibility. */
  ariaLabel?: string
}

/**
 * Copy button that briefly shows "Copied ✓" with a fade transition,
 * then returns to "Copy". CEF-safe — uses CSS transitions only.
 */
export function CopyButton({ value, onCopy, ariaLabel = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = useCallback(() => {
    if (!value) return
    copyToClipboard(value)
    onCopy?.()

    if (timerRef.current) clearTimeout(timerRef.current)
    setCopied(true)
    timerRef.current = setTimeout(() => setCopied(false), COPIED_TIMEOUT)
  }, [value, onCopy])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <button
      className={`copy-btn${copied ? ' copy-btn-copied' : ''}`}
      onClick={handleClick}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <span className="copy-btn-text copy-btn-text-copy">Copy</span>
      <span className="copy-btn-text copy-btn-text-copied">
        <Icon name="check" size="xs" />
        Copied
      </span>
    </button>
  )
}
