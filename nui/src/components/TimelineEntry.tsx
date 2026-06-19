import type { ReactNode } from 'react'

interface TimelineEntryProps {
  /** Shown at the top-left (e.g. an action badge or note label) */
  title?: ReactNode
  /** Shown at the top-right (e.g. a formatted datetime string) */
  time?: ReactNode
  /** Main body content */
  children?: ReactNode
  /** Shown at the bottom-left (e.g. moderator, extra metadata) */
  footer?: ReactNode
  /** Shown at the bottom-right (e.g. delete button or other actions) */
  actions?: ReactNode
}

export function TimelineEntry({
  title,
  time,
  children,
  footer,
  actions,
}: TimelineEntryProps) {
  return (
    <div className="timeline-entry">
      {(title != null || time != null) && (
        <div className="timeline-entry-header">
          {title != null && <div className="timeline-entry-title">{title}</div>}
          {time != null && <span className="timeline-entry-time">{time}</span>}
        </div>
      )}

      {children != null && (
        <div className="timeline-entry-content">{children}</div>
      )}

      {(footer != null || actions != null) && (
        <div className="timeline-entry-footer">
          {footer != null && <div className="timeline-entry-footer-left">{footer}</div>}
          {actions != null && <div className="timeline-entry-footer-right">{actions}</div>}
        </div>
      )}
    </div>
  )
}
