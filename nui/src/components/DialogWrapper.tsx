import { type ReactNode, useRef } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface DialogWrapperProps {
  title: string
  description?: ReactNode
  onCancel: () => void
  actions?: ReactNode
  children: ReactNode
  titleId?: string
}

/**
 * Shared dialog wrapper: overlay + dialog shell + focus trap + backdrop click.
 *
 * Every modal in the app uses the same overlay/dialog structure.
 * This component eliminates that repetition.
 */
export function DialogWrapper({
  title,
  description,
  onCancel,
  actions,
  children,
  titleId,
}: DialogWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useFocusTrap(containerRef)

  const titleIdToUse = titleId ?? `dialog-title-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`

  return (
    <div
      ref={containerRef}
      className="dialog-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleIdToUse}
      >
        <h2 id={titleIdToUse} className="dialog-title">
          {title}
        </h2>
        {description && <p className="dialog-description">{description}</p>}
        <div className="dialog-body">
          {children}
          {actions}
        </div>
      </div>
    </div>
  )
}
