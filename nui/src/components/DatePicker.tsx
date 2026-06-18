import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './icons'

interface DatePickerProps {
  value: string // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void
  disabled?: boolean
  label?: string
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0 = Monday, 6 = Sunday
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function formatDate(year: number, month: number, day: number): string {
  const y = String(year)
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isSameDay(a: string, b: string): boolean {
  return a === b
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date()
  return (
    now.getFullYear() === year &&
    now.getMonth() === month &&
    now.getDate() === day
  )
}

type ViewMode = 'days' | 'months' | 'years'

interface CalendarState {
  viewYear: number
  viewMonth: number
}

export function DatePicker({ value, onChange, disabled, label }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<CalendarState>(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      return { viewYear: y, viewMonth: m - 1 }
    }
    const now = new Date()
    return { viewYear: now.getFullYear(), viewMonth: now.getMonth() }
  })
  const [viewMode, setViewMode] = useState<ViewMode>('days')
  const [yearPage, setYearPage] = useState(Math.floor(state.viewYear / 12) * 12)
  const ref = useRef<HTMLDivElement>(null)

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      setState({ viewYear: y, viewMonth: m - 1 })
    }
  }, [value])

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

  const handleSelectDay = useCallback((formatted: string) => {
    onChange(formatted)
    setOpen(false)
  }, [onChange])

  const handlePrevMonth = useCallback(() => {
    setState((prev) => {
      const m = prev.viewMonth - 1
      if (m < 0) return { viewYear: prev.viewYear - 1, viewMonth: 11 }
      return { ...prev, viewMonth: m }
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setState((prev) => {
      const m = prev.viewMonth + 1
      if (m > 11) return { viewYear: prev.viewYear + 1, viewMonth: 0 }
      return { ...prev, viewMonth: m }
    })
  }, [])

  const handleYearChange = useCallback((year: number) => {
    setState((prev) => ({ ...prev, viewYear: year }))
    setViewMode('months')
  }, [])

  const handleMonthChange = useCallback((month: number) => {
    setState((prev) => ({ ...prev, viewMonth: month }))
    setViewMode('days')
  }, [])

  const displayDate = useMemo(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
    return 'Select date'
  }, [value])

  // Build day grid
  const days = useMemo(() => {
    const daysInMonth = getDaysInMonth(state.viewYear, state.viewMonth)
    const firstDay = getFirstDayOfMonth(state.viewYear, state.viewMonth)
    const cells: { day: number; formatted: string; currentMonth: boolean }[] = []

    // Previous month padding
    const prevMonthDays = getDaysInMonth(
      state.viewMonth === 0 ? state.viewYear - 1 : state.viewYear,
      state.viewMonth === 0 ? 11 : state.viewMonth - 1,
    )
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i
      const m = state.viewMonth === 0 ? 11 : state.viewMonth - 1
      const y = state.viewMonth === 0 ? state.viewYear - 1 : state.viewYear
      cells.push({ day, formatted: formatDate(y, m, day), currentMonth: false })
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, formatted: formatDate(state.viewYear, state.viewMonth, d), currentMonth: true })
    }

    // Next month padding
    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++) {
      const m = state.viewMonth === 11 ? 0 : state.viewMonth + 1
      const y = state.viewMonth === 11 ? state.viewYear + 1 : state.viewYear
      cells.push({ day: d, formatted: formatDate(y, m, d), currentMonth: false })
    }

    return cells
  }, [state.viewYear, state.viewMonth])

  // Build month grid
  const months = useMemo(() => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]
    return monthNames.map((name, i) => ({ name, index: i }))
  }, [])

  // Build year grid
  const years = useMemo(() => {
    const result: number[] = []
    for (let y = yearPage; y < yearPage + 12; y++) {
      result.push(y)
    }
    return result
  }, [yearPage])

  const headerLabel = useMemo(() => {
    if (viewMode === 'years') {
      return `${yearPage} — ${yearPage + 11}`
    }
    if (viewMode === 'months') {
      return String(state.viewYear)
    }
    const monthName = new Date(state.viewYear, state.viewMonth).toLocaleDateString('en-US', { month: 'long' })
    return `${monthName} ${state.viewYear}`
  }, [viewMode, state.viewYear, state.viewMonth, yearPage])

  if (disabled) {
    return (
      <div className="date-picker date-picker-disabled" ref={ref}>
        {label && <span className="text-sm text-secondary">{label}</span>}
        <button
          type="button"
          className="date-picker-trigger"
          disabled
        >
          <Icon name="calendar" size="xs" />
          <span className="date-picker-trigger-text">{displayDate}</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`date-picker${open ? ' date-picker-open' : ''}`} ref={ref}>
      {label && <span className="text-sm text-secondary">{label}</span>}
      <button
        type="button"
        className="date-picker-trigger"
        onClick={() => setOpen(!open)}
      >
        <Icon name="calendar" size="xs" />
        <span className="date-picker-trigger-text">{displayDate}</span>
      </button>

      {open && (
        <div className="date-picker-dropdown">
          {/* Header */}
          <div className="date-picker-header">
            <button
              type="button"
              className="date-picker-nav"
              onClick={viewMode === 'days' ? handlePrevMonth
                : viewMode === 'months' ? () => setState((p) => ({ ...p, viewYear: p.viewYear - 1 }))
                : () => setYearPage((p) => p - 12)}
              aria-label="Previous"
            >
              <Icon name="chevron-left" size="xs" />
            </button>
            <button
              type="button"
              className="date-picker-header-label"
              onClick={() => {
                if (viewMode === 'days') {
                  setViewMode('months')
                } else if (viewMode === 'months') {
                  setViewMode('years')
                }
              }}
            >
              {headerLabel}
            </button>
            <button
              type="button"
              className="date-picker-nav"
              onClick={viewMode === 'days' ? handleNextMonth
                : viewMode === 'months' ? () => setState((p) => ({ ...p, viewYear: p.viewYear + 1 }))
                : () => setYearPage((p) => p + 12)}
              aria-label="Next"
            >
              <Icon name="chevron-right" size="xs" />
            </button>
          </div>

          {/* Day grid */}
          {viewMode === 'days' && (
            <div className="date-picker-grid">
              {/* Weekday headers */}
              {WEEKDAYS.map((wd) => (
                <span key={wd} className="date-picker-weekday">{wd}</span>
              ))}
              {/* Day cells */}
              {days.map((cell, i) => {
                const selected = isSameDay(cell.formatted, value)
                const today = cell.currentMonth && isToday(state.viewYear, state.viewMonth, cell.day)
                return (
                  <button
                    key={i}
                    type="button"
                    className={`date-picker-day${!cell.currentMonth ? ' date-picker-day-other' : ''}${selected ? ' date-picker-day-selected' : ''}${today && !selected ? ' date-picker-day-today' : ''}`}
                    onClick={() => handleSelectDay(cell.formatted)}
                  >
                    {cell.day}
                  </button>
                )
              })}
            </div>
          )}

          {/* Month grid */}
          {viewMode === 'months' && (
            <div className="date-picker-month-grid">
              {months.map((m) => {
                const selected = m.index === state.viewMonth
                return (
                  <button
                    key={m.index}
                    type="button"
                    className={`date-picker-month-cell${selected ? ' date-picker-month-cell-selected' : ''}`}
                    onClick={() => handleMonthChange(m.index)}
                  >
                    {m.name}
                  </button>
                )
              })}
            </div>
          )}

          {/* Year grid */}
          {viewMode === 'years' && (
            <div className="date-picker-year-grid">
              {years.map((y) => {
                const selected = y === state.viewYear
                return (
                  <button
                    key={y}
                    type="button"
                    className={`date-picker-year-cell${selected ? ' date-picker-year-cell-selected' : ''}`}
                    onClick={() => handleYearChange(y)}
                  >
                    {y}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
