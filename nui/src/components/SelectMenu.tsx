import { useEffect, useRef, useState } from 'react'
import { Icon } from './icons'
import type { IconName } from './icons'

interface SelectMenuItem {
  value: string
  label: string
  icon?: IconName
}

interface SelectMenuProps {
  items: SelectMenuItem[]
  placeholder?: string
  onChange: (item: SelectMenuItem) => void
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
  disabled = false,
  ariaLabel,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<SelectMenuItem | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  const handleSelect = (item: SelectMenuItem) => {
    setSelected(item)
    setOpen(false)
    onChange(item)
  }

  const displayLabel = selected ? selected.label : placeholder
  const displayIcon = selected ? selected.icon : undefined

  return (
    <div ref={containerRef} className="select-menu-container">
      <button
        className="select-menu-trigger"
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
          className="select-menu-list"
          role="listbox"
        >
          {items.map((item) => (
            <button
              key={item.value}
              className={`select-menu-item${selected?.value === item.value ? ' select-menu-item-selected' : ''}`}
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
