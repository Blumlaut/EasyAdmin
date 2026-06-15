import { useEffect, useRef, useState } from 'react'

interface InputPromptProps {
  title: string
  label?: string
  placeholder?: string
  initialValue?: string
  maxLength?: number
  confirmLabel?: string
  cancelLabel?: string
  required?: boolean
  onConfirm: (value: string) => void
  onCancel: () => void
}

/**
 * Reusable modal for capturing a single string input.
 *
 * Used across the app for: kick reason, ban reason, warn reason,
 * server announce, set gametype, etc.
 */
export function InputPrompt({
  title,
  label,
  placeholder,
  initialValue = '',
  maxLength = 128,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  required = false,
  onConfirm,
  onCancel,
}: InputPromptProps) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  function handleSubmit() {
    const trimmed = value.trim()
    if (required && !trimmed) return
    onConfirm(trimmed)
  }

  return (
    <div
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
        aria-labelledby="input-prompt-title"
      >
        <h2 id="input-prompt-title" className="dialog-title">
          {title}
        </h2>
        {label && <p className="dialog-description">{label}</p>}
        <input
          ref={inputRef}
          className="input"
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
          aria-label={label ?? title}
        />
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={required && !value.trim()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
