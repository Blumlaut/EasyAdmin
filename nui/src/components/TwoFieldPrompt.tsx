import { useEffect, useRef, useState } from 'react'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { DialogWrapper } from './DialogWrapper'
import { useTranslation } from '../lib/i18n'

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
  const { t } = useTranslation()
  const [first, setFirst] = useState(firstInitialValue)
  const [second, setSecond] = useState(secondInitialValue)
  const firstRef = useRef<HTMLInputElement>(null)

  useEscapeKey(onCancel)

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  function handleSubmit() {
    if (!first.trim() || !second.trim()) return
    onConfirm(first.trim(), second.trim())
  }

  return (
    <DialogWrapper
      title={title}
      onCancel={onCancel}
      actions={
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {t("Cancel")}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!first.trim() || !second.trim()}
          >
            {t("Confirm")}
          </button>
        </div>
      }
    >
      <div className="two-field-prompt">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-subtle">{firstLabel}</span>
          <input
            ref={firstRef}
            className="input"
            placeholder={firstPlaceholder}
            value={first}
            onChange={(e) => setFirst(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-subtle">{secondLabel}</span>
          <input
            className="input"
            placeholder={secondPlaceholder}
            value={second}
            onChange={(e) => setSecond(e.target.value)}
          />
        </label>
      </div>
    </DialogWrapper>
  )
}
