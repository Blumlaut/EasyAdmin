import { useRef, useState } from 'react'
import type { IconName } from './icons'
import { Icon } from './icons'
import { useClickOutside } from '../hooks/useClickOutside'

interface DropdownItem {
  label: string
  icon?: IconName
  danger?: boolean
  onSelect: () => void
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}

/**
 * Lightweight dropdown menu. Click outside or Escape to close.
 * No animation (CEF safety).
 */
export function DropdownMenu({ trigger, items, align = 'left' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(open, () => setOpen(false), ref)

  return (
    <div ref={ref} className="relative inline-block">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(!open)
          }
        }}
      >
        {trigger}
      </div>
      {open && (
        <div
          className={`dropdown-menu ${align === 'right' ? 'dropdown-menu-right' : ''}`}
          role="menu"
        >
          {items.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              className={`menu-item dropdown-item${item.danger ? ' dropdown-item-danger' : ''}`}
              onClick={() => {
                item.onSelect()
                setOpen(false)
              }}
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
