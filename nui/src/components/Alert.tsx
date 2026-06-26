import { type ReactNode } from 'react'
import { useTranslation } from '../lib/i18n'
import { Icon, type IconName } from './icons'

// ============================================================
// Alert
// Generic alert card matching the existing card aesthetic.
// ============================================================

export type AlertVariant = 'info' | 'warning' | 'success' | 'error'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children?: ReactNode
  icon?: IconName
  action?: ReactNode
  onDismiss?: () => void
  className?: string
}

const DEFAULT_ICONS: Record<AlertVariant, IconName> = {
  info: 'info',
  warning: 'alert-triangle',
  success: 'check-circle',
  error: 'alert-circle',
}

export function Alert({
  variant = 'info',
  title,
  children,
  icon,
  action,
  onDismiss,
  className = '',
}: AlertProps) {
  const { t } = useTranslation()
  const displayIcon = icon || DEFAULT_ICONS[variant]

  return (
    <div
      className={`alert alert--${variant} ${className}`}
      role="alert"
    >
      <div className="alert-icon">
        <Icon name={displayIcon} size="sm" />
      </div>
      <div className="alert-content">
        {title && (
          <p className="alert-title">{title}</p>
        )}
        {children && <div className="alert-message">{children}</div>}
      </div>
      <div className="alert-actions">
        {action}
        {onDismiss && (
          <button
            className="btn btn-ghost btn-icon btn-sm alert-dismiss-btn"
            onClick={onDismiss}
            aria-label={t("Dismiss")}
          >
            <Icon name="x" size="xs" />
          </button>
        )}
      </div>
    </div>
  )
}
