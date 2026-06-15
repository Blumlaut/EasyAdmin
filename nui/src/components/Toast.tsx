import type { Notification } from '../types'
import { Icon } from './icons'

interface ToastProps {
  message: string
  type?: Notification['type']
}

export function Toast({ message, type = 'info' }: ToastProps) {
  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`} role="alert">
        {type === 'error' && <Icon name="alert-triangle" size="xs" style={{ flexShrink: 0 }} />}
        <span style={{ marginLeft: type === 'error' ? 'var(--space-2)' : 0 }}>{message}</span>
      </div>
    </div>
  )
}
