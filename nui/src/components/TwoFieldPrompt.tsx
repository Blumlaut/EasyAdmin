import { useEffect, useRef, useState } from 'react'

interface TwoFieldPromptProps {
  title: string
  firstLabel: string
  firstPlaceholder?: string
  secondLabel: string
  secondPlaceholder?: string
  firstInitialValue?: string
  secondInitialValue?: string
  onConfirm: (first: string, second: string) => void
  onCancel: () => void
}

/**
 * Modal with two text fields. Used for setting a convar (name + value).
 */
export function TwoFieldPrompt({
  title,
  firstLabel,
  firstPlaceholder,
  secondLabel,
  secondPlaceholder,
  firstInitialValue = '',
  secondInitialValue = '',
  onConfirm,
  onCancel,
}: TwoFieldPromptProps) {
  const [first, setFirst] = useState(firstInitialValue)
  const [second, setSecond] = useState(secondInitialValue)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  function handleSubmit() {
    if (!first.trim() || !second.trim()) return
    onConfirm(first.trim(), second.trim())
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
        aria-labelledby="two-field-title"
      >
        <h2 id="two-field-title" className="dialog-title">
          {title}
        </h2>
        <div className="two-field-prompt">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-secondary">{firstLabel}</span>
            <input
              ref={firstRef}
              className="input"
              placeholder={firstPlaceholder}
              value={first}
              onChange={(e) => setFirst(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-secondary">{secondLabel}</span>
            <input
              className="input"
              placeholder={secondPlaceholder}
              value={second}
              onChange={(e) => setSecond(e.target.value)}
            />
          </label>
        </div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!first.trim() || !second.trim()}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
