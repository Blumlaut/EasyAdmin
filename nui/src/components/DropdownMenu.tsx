import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

function getDropdownRoot(): HTMLElement {
  let el = document.getElementById('ea-dropdown-portal')
  if (!el) {
    el = document.createElement('div')
    el.id = 'ea-dropdown-portal'
    document.documentElement.insertBefore(el, document.body)
  }
  return el
}

/**
 * Lightweight dropdown menu. Click outside or Escape to close.
 * Menu panel is rendered via portal so it breaks out of overflow:hidden
 * parents (list containers, cards, etc.).
 * No animation (CEF safety).
 */
export function DropdownMenu({ trigger, items, align = 'left' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, right: 0 })

  const measureTrigger = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setCoords({
      top: rect.bottom + 6,
      left: rect.left + rect.width,
      right: window.innerWidth - (rect.left + rect.width),
    })
  }, [align])

  // Measure when opened
  useEffect(() => {
    if (!open) return
    const raf = requestAnimationFrame(() => measureTrigger())
    return () => cancelAnimationFrame(raf)
  }, [open, measureTrigger])

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return
    const update = () => {
      const raf = requestAnimationFrame(() => measureTrigger())
      return () => cancelAnimationFrame(raf)
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [open, measureTrigger])

  // Click outside closes the menu
  useClickOutside(open, () => setOpen(false), menuRef)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const menuPanel = (
    <div
      ref={menuRef}
      className={`dropdown-menu-portal ${align === 'right' ? 'dropdown-menu-portal--right' : ''}`}
      style={align === 'right' ? { top: coords.top, right: coords.right } : { top: coords.top, left: coords.left }}
      role="menu"
    >
      {items.map((item, i) => (
        <button
          key={i}
          role="menuitem"
          className={`menu-item dropdown-item${item.danger ? ' dropdown-item-danger' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            item.onSelect()
            setOpen(false)
          }}
        >
          {item.icon && <Icon name={item.icon} size="xs" />}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )

  return (
    <div className="inline-block">
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(!open)
          }
        }}
      >
        {trigger}
      </div>
      {open && createPortal(menuPanel, getDropdownRoot())}
    </div>
  )
}
