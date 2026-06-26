import { useEffect, useRef, useState } from 'react'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { DialogWrapper } from './DialogWrapper'

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

  useEscapeKey(onCancel)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  function handleSubmit() {
    const trimmed = value.trim()
    if (required && !trimmed) return
    onConfirm(trimmed)
  }

  return (
    <DialogWrapper
      title={title}
      description={label}
      onCancel={onCancel}
      actions={
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
      }
    >
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
    </DialogWrapper>
  )
}
