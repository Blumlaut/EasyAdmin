import { useEffect, useRef, useState } from 'react'
import { Icon } from './icons'
import type { IconName } from './icons'
import { useClickOutside } from '../hooks/useClickOutside'

export interface SelectMenuItem {
  value: string
  label: string
  icon?: IconName
}

interface SelectMenuProps {
  items: SelectMenuItem[]
  placeholder?: string
  onChange: (item: SelectMenuItem) => void
  /** Controlled selected value (matches item.value). When omitted, SelectMenu manages its own selection. */
  value?: string
  disabled?: boolean
  ariaLabel?: string
}

/**
 * Custom select dropdown. Opens above the trigger to avoid
 * overflowing the bottom of the CEF window.
 */
export function SelectMenu({
  items,
  placeholder = 'Select...',
  onChange,
  value,
  disabled = false,
  ariaLabel,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false)
  const [uncontrolledSelected, setUncontrolledSelected] = useState<SelectMenuItem | null>(null)
  const [flip, setFlip] = useState(false)

  // Controlled mode: derive selection from value prop
  const controlledSelected = value !== undefined
    ? items.find((item) => item.value === value) ?? null
    : null
  const selected = value !== undefined ? controlledSelected : uncontrolledSelected
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Close on outside click / Escape
  useClickOutside(open, () => setOpen(false), containerRef)

  // Measure available space and flip dropdown direction if it would clip off-screen.
  // The default CSS opens upward (bottom: calc(100% + 4px)).
  // If there isn't enough space above, flip to open downward.
  useEffect(() => {
    if (!open || !triggerRef.current) return

    // Use requestAnimationFrame to ensure the dropdown is painted before measuring
    const rafId = requestAnimationFrame(() => {
      const triggerRect = triggerRef.current!.getBoundingClientRect()
      const spaceAbove = triggerRect.top
      const spaceBelow = window.innerHeight - triggerRect.bottom
      // Need at least 40px to be usable; prefer opening downward if there's more room below
      if (spaceAbove < 40 || spaceBelow > spaceAbove) {
        setFlip(true)
      } else {
        setFlip(false)
      }
    })

    return () => cancelAnimationFrame(rafId)
  }, [open])

  const handleSelect = (item: SelectMenuItem) => {
    if (value === undefined) {
      setUncontrolledSelected(item)
    }
    setOpen(false)
    onChange(item)
  }

  const displayLabel = selected?.label ?? placeholder
  const displayIcon = selected?.icon

  return (
    <div ref={containerRef} className="select-menu-container">
      <button
        ref={triggerRef}
        className="panel-btn select-menu-trigger"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {displayIcon && <Icon name={displayIcon} size="xs" />}
        <span className="select-menu-trigger-label">{displayLabel}</span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size="xs" className="select-menu-chevron" />
      </button>

      {open && (
        <div
          className={`select-menu-list${flip ? ' select-menu-list-flip' : ''}`}
          role="listbox"
        >
          {items.map((item) => (
            <button
              key={item.value}
              className={`menu-item select-menu-item${selected?.value === item.value ? ' select-menu-item-selected' : ''}`}
              role="option"
              aria-selected={selected?.value === item.value}
              onClick={() => handleSelect(item)}
            >
              {item.icon && <Icon name={item.icon} size="xs" />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
