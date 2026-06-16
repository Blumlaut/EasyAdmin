import { useState } from 'react'
import { DialogWrapper } from './DialogWrapper'

export interface BanDurationChoice {
  label: string
  time: number
}

const PRESETS: BanDurationChoice[] = [
  { label: '6 hours', time: 21600 },
  { label: '12 hours', time: 43200 },
  { label: '1 day', time: 86400 },
  { label: '3 days', time: 259200 },
  { label: '1 week', time: 518400 },
  { label: '2 weeks', time: 1123200 },
  { label: '1 month', time: 2678400 },
  { label: '1 year', time: 31536000 },
  { label: 'Permanent', time: 10444633200 },
  { label: 'Custom...', time: -1 },
]

interface BanDurationPickerProps {
  value: number | null
  onChange: (seconds: number | null) => void
  allowPermanent?: boolean
}

/**
 * Dropdown of preset ban lengths plus a "Custom..." sub-modal
 * (hours/days/weeks/months) that matches NativeUI behavior.
 */
export function BanDurationPicker({
  value,
  onChange,
  allowPermanent = true,
}: BanDurationPickerProps) {
  const presets = allowPermanent
    ? PRESETS
    : PRESETS.filter((p) => p.time !== 10444633200)

  // Show custom sub-modal whenever the user picks "Custom..." (-1)
  // and not yet applied a real value. The modal is purely controlled
  // by the current value: no internal state sync.
  const customOpen = value === -1

  const [hours, setHours] = useState(0)
  const [days, setDays] = useState(0)
  const [weeks, setWeeks] = useState(0)
  const [months, setMonths] = useState(0)

  function handlePresetChange(seconds: number) {
    if (seconds === -1) {
      // Custom: reset to 0, open sub-modal
      onChange(-1)
    } else {
      onChange(seconds)
    }
  }

  function handleCustomConfirm() {
    const total =
      hours * 3600 + days * 86400 + weeks * 518400 + months * 2678400
    onChange(total > 0 ? total : null)
  }

  function handleCustomCancel() {
    onChange(null)
  }

  // Find current preset label
  const currentLabel = (() => {
    if (value === null || value === undefined) return 'Select duration...'
    const match = presets.find((p) => p.time === value)
    if (match) return match.label
    if (value > 0) return 'Custom (set)'
    return 'Select duration...'
  })()

  return (
    <>
      <select
        className="input"
        value={value === null || value === undefined ? '' : String(value)}
        onChange={(e) => handlePresetChange(Number(e.target.value))}
        aria-label="Ban duration"
      >
        <option value="" disabled>
          {currentLabel}
        </option>
        {presets.map((p) => (
          <option key={p.time} value={String(p.time)}>
            {p.label}
          </option>
        ))}
      </select>

      {customOpen && (
        <CustomBanModal
          hours={hours}
          setHours={setHours}
          days={days}
          setDays={setDays}
          weeks={weeks}
          setWeeks={setWeeks}
          months={months}
          setMonths={setMonths}
          onConfirm={handleCustomConfirm}
          onCancel={handleCustomCancel}
        />
      )}
    </>
  )
}

function CustomBanModal({
  hours,
  setHours,
  days,
  setDays,
  weeks,
  setWeeks,
  months,
  setMonths,
  onConfirm,
  onCancel,
}: {
  hours: number
  setHours: (n: number) => void
  days: number
  setDays: (n: number) => void
  weeks: number
  setWeeks: (n: number) => void
  months: number
  setMonths: (n: number) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <DialogWrapper
      title="Custom Ban Length"
      description="Set the custom ban duration. Leave all at 0 for indefinite."
      onCancel={onCancel}
      actions={
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Apply
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <NumberField label="Hours" value={hours} onChange={setHours} max={24} />
        <NumberField label="Days" value={days} onChange={setDays} max={31} />
        <NumberField label="Weeks" value={weeks} onChange={setWeeks} max={4} />
        <NumberField label="Months" value={months} onChange={setMonths} max={12} />
      </div>
    </DialogWrapper>
  )
}

function NumberField({
  label,
  value,
  onChange,
  max,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  max: number
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-secondary">
        {label} (0-{max})
      </span>
      <input
        className="input"
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (n >= 0 && n <= max) onChange(n)
        }}
      />
    </label>
  )
}
