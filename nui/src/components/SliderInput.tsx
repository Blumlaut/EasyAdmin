import { useState } from 'react'

interface SliderInputProps {
  label: string
  min: number
  max: number
  step?: number
  initialValue?: number
  formatValue?: (n: number) => string
  onConfirm: (value: number) => void
  onCancel: () => void
}

/**
 * Modal with a numeric slider. Used by slap (1-20x10).
 */
export function SliderInput({
  label,
  min,
  max,
  step = 1,
  initialValue,
  formatValue,
  onConfirm,
  onCancel,
}: SliderInputProps) {
  const [value, setValue] = useState(initialValue ?? min)
  const display = formatValue ? formatValue(value) : String(value)

  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="slider-title">
        <h2 id="slider-title" className="dialog-title">
          {label}
        </h2>
        <p className="dialog-description">
          Value: <span className="text-mono font-semibold">{display}</span>
        </p>
        <input
          className="slider"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          aria-label={label}
        />
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => onConfirm(value)}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
