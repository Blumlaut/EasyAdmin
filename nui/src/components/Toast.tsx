import type { Notification } from '../types'

interface ToastProps {
  message: string
  type?: Notification['type']
}

export function Toast({ message, type = 'info' }: ToastProps) {
  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`} role="alert">
        {message}
      </div>
    </div>
  )
}
