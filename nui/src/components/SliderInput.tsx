import { useState } from 'react'
import { DialogWrapper } from './DialogWrapper'

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
    <DialogWrapper
      title={label}
      description={
        <span>
          Value: <span className="text-mono font-semibold">{display}</span>
        </span>
      }
      onCancel={onCancel}
      actions={
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => onConfirm(value)}>
            Confirm
          </button>
        </div>
      }
    >
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
    </DialogWrapper>
  )
}
