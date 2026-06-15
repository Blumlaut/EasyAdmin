import { useEffect } from 'react'

interface ConfirmDialogProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
      tabIndex={-1}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          width: 400,
          maxWidth: '90vw',
          boxShadow: 'var(--shadow)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <h3 style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 8,
        }}>
          {title}
        </h3>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 13,
          lineHeight: 1.6,
          marginBottom: 20,
        }}>
          {message}
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}>
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
