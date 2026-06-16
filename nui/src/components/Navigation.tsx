/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
import { useCallback, useRef } from 'react'
import { Icon } from './icons'

export interface NavItem {
  id: string
  label: string
  icon: string
  badge?: string | number
  disabled?: boolean
}

interface NavigationProps {
  items: NavItem[]
  activeId: string
  onSelect: (id: string) => void
}

export function Navigation({ items, activeId, onSelect }: NavigationProps) {
  const navRef = useRef<HTMLButtonElement[]>([])

  const initItemRefs = useCallback((el: HTMLButtonElement | null) => {
    if (el) {
      navRef.current.push(el)
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const enabledItems = items.filter((item) => !item.disabled)
    if (enabledItems.length === 0) return

    const currentIndex = enabledItems.findIndex((item) => item.id === activeId)
    let newIndex: number

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        newIndex = (currentIndex + 1) % enabledItems.length
        break
      case 'ArrowUp':
        e.preventDefault()
        newIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = enabledItems.length - 1
        break
      default:
        return
    }

    const target = enabledItems[newIndex]
    if (target) {
      onSelect(target.id)
      // Find the DOM element for the target and focus it
      const targetEl = navRef.current.find(
        (el) => el && el.getAttribute('data-nav-id') === target.id,
      )
      targetEl?.focus()
    }
  }, [items, activeId, onSelect])

  return (
    <nav
      className="flex flex-col gap-0.5"
      role="navigation"
      aria-label="Main navigation"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {items.map((item) => (
        <button
          key={item.id}
          ref={initItemRefs}
          data-nav-id={item.id}
          className={`nav-item${activeId === item.id ? ' nav-item-active' : ''}`}
          onClick={() => !item.disabled && onSelect(item.id)}
          disabled={item.disabled}
          aria-current={activeId === item.id ? 'page' : undefined}
          aria-disabled={item.disabled}
          tabIndex={activeId === item.id ? 0 : -1}
          style={item.disabled ? { opacity: 0.5 } : undefined}
        >
          {/* @ts-expect-error Icon name is dynamic but validated at runtime */}
          <Icon name={item.icon} size="sm" />
          <span className="nav-item-label">{item.label}</span>
          {item.badge !== undefined && (
            <span className="nav-item-badge">{item.badge}</span>
          )}
        </button>
      ))}
    </nav>
  )
}
