interface ToastProps {
  message: string
  type?: 'info' | 'success' | 'error'
}

const toastColors = {
  info: 'var(--accent-blue)',
  success: 'var(--accent-green)',
  error: 'var(--accent-red)',
}

export function Toast({ message, type = 'info' }: ToastProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 16,
      right: 16,
      zIndex: 2000,
      animation: 'slideIn 200ms ease-out',
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${toastColors[type]}`,
        borderRadius: 'var(--radius)',
        padding: '10px 16px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: 360,
      }}>
        <span style={{
          fontSize: 13,
          color: 'var(--text-primary)',
        }}>
          {message}
        </span>
      </div>
    </div>
  )
}
