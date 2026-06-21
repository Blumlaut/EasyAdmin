import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './icons'

interface TimePickerProps {
  value: string // HH:MM format
  onChange: (time: string) => void
  disabled?: boolean
  label?: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function formatTimeDisplay(hours: number, minutes: number): string {
  const period = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${h12}:${pad(minutes)} ${period}`
}

function parseTime(value: string): { hours: number; minutes: number } {
  if (!value) return { hours: 0, minutes: 0 }
  const [h, m] = value.split(':').map(Number)
  return { hours: h || 0, minutes: m || 0 }
}

export function TimePicker({ value, onChange, disabled, label }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  // Draft state — only used while picker is open
  const [draftHours, setDraftHours] = useState(0)
  const [draftMinutes, setDraftMinutes] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  // Derive display values from the prop (source of truth)
  const { hours, minutes } = useMemo(() => parseTime(value), [value])

  // Sync draft when opening
  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        setDraftHours(hours)
        setDraftMinutes(minutes)
      }
      return !prev
    })
  }, [hours, minutes])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleHourSelect = useCallback((h: number) => {
    setDraftHours(h)
    const m = value.split(':').map(Number)[1]
    onChange(`${pad(h)}:${pad(m || 0)}`)
  }, [value, onChange])

  const handleMinuteSelect = useCallback((m: number) => {
    setDraftMinutes(m)
    const [h] = value.split(':').map(Number)
    onChange(`${pad(h || 0)}:${pad(m)}`)
  }, [value, onChange])

  const displayTime = value ? formatTimeDisplay(hours, minutes) : 'Select time'

  // Build options
  const hourOptions = Array.from({ length: 24 }, (_, i) => i)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5)

  if (disabled) {
    return (
      <div className="time-picker time-picker-disabled" ref={ref}>
        {label && <span className="text-sm text-fg-subtle">{label}</span>}
        <button
          type="button"
          className="time-picker-trigger"
          disabled
        >
          <Icon name="clock" size="xs" />
          <span className="time-picker-trigger-text">{displayTime}</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`time-picker${open ? ' time-picker-open' : ''}`} ref={ref}>
      {label && <span className="text-sm text-fg-subtle">{label}</span>}
      <button
        type="button"
        className="time-picker-trigger"
        onClick={handleToggle}
      >
        <Icon name="clock" size="xs" />
        <span className="time-picker-trigger-text">{displayTime}</span>
      </button>

      {open && (
        <div className="time-picker-dropdown">
          {/* Two-column layout: hours | minutes */}
          <div className="time-picker-columns">
            <div className="time-picker-column">
              {hourOptions.map((h) => {
                const selected = h === draftHours
                const display = h === 0 ? '12 AM' : h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`
                return (
                  <button
                    key={h}
                    type="button"
                    className={`time-picker-option${selected ? ' time-picker-option-selected' : ''}`}
                    onClick={() => handleHourSelect(h)}
                  >
                    {display}
                  </button>
                )
              })}
            </div>
            <div className="time-picker-column">
              {minuteOptions.map((m) => {
                const selected = m === draftMinutes
                return (
                  <button
                    key={m}
                    type="button"
                    className={`time-picker-option${selected ? ' time-picker-option-selected' : ''}`}
                    onClick={() => handleMinuteSelect(m)}
                  >
                    {pad(m)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="time-picker-preview">
            {formatTimeDisplay(draftHours, draftMinutes)}
          </div>
        </div>
      )}
    </div>
  )
}
