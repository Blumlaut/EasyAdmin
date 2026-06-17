/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './icons'

export interface NavItem {
  id: string
  label: string
  icon: string
  badge?: string | number
  disabled?: boolean
  // Dropdown support: when present, this item renders as an expandable group
  children?: NavItem[]
}

interface NavigationProps {
  items: NavItem[]
  activeId: string
  onSelect: (id: string) => void
}

export function Navigation({ items, activeId, onSelect }: NavigationProps) {
  const navRef = useRef<HTMLButtonElement[]>([])
  // Track which dropdown groups are expanded (keyed by parent id)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Auto-expand a dropdown when its parent or a child is active
  useEffect(() => {
    for (const item of items) {
      if (!item.children) continue
      const childIds = item.children.map((c) => c.id)
      if (activeId === item.id || childIds.includes(activeId)) {
        setExpanded((prev) => (prev[item.id] ? prev : { ...prev, [item.id]: true }))
        break
      }
    }
  }, [activeId, items])

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const initItemRefs = useCallback((el: HTMLButtonElement | null) => {
    if (el) {
      navRef.current.push(el)
    }
  }, [])

  // Collect all leaf (non-dropdown) items for keyboard navigation
  const leafItems = useCallback(() => {
    const leaves: NavItem[] = []
    for (const item of items) {
      if (item.children && expanded[item.id]) {
        leaves.push(...item.children)
      } else if (!item.children) {
        leaves.push(item)
      }
    }
    return leaves.filter((item) => !item.disabled)
  }, [items, expanded])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const enabledItems = leafItems()
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
      // Expand parent dropdown if the target is a child
      for (const item of items) {
        if (item.children && item.children.some((c) => c.id === target.id)) {
          setExpanded((prev) => (prev[item.id] ? prev : { ...prev, [item.id]: true }))
          break
        }
      }
      // Find the DOM element for the target and focus it
      const targetEl = navRef.current.find(
        (el) => el && el.getAttribute('data-nav-id') === target.id,
      )
      targetEl?.focus()
    }
  }, [items, activeId, onSelect, leafItems])

  const renderItem = (item: NavItem) => {
    const hasChildren = !!item.children && item.children.length > 0
    const isExpanded = expanded[item.id]
    const isActive = activeId === item.id
    const isParentActive = hasChildren && item.children!.some((c) => c.id === activeId)
    const isDisabled = item.disabled || (hasChildren && item.children!.every((c) => c.disabled))

    return (
      <div key={item.id} className={hasChildren ? 'nav-dropdown' : undefined}>
        <button
          ref={initItemRefs}
          data-nav-id={item.id}
          className={`nav-item${isActive ? ' nav-item-active' : ''}${hasChildren ? ' nav-dropdown-toggle' : ''}${isParentActive && !isActive ? ' nav-dropdown-parent-active' : ''}`}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
              // If expanding and no child is active, navigate to first enabled child
              if (!isExpanded) {
                const firstEnabled = item.children!.find((c) => !c.disabled)
                if (firstEnabled && !isParentActive) onSelect(firstEnabled.id)
                else if (isParentActive) {
                  const activeChild = item.children!.find((c) => c.id === activeId)
                  if (activeChild) onSelect(activeChild.id)
                }
              }
            } else if (!item.disabled) {
              onSelect(item.id)
            }
          }}
          disabled={isDisabled}
          aria-current={isActive ? 'page' : undefined}
          aria-disabled={isDisabled}
          aria-expanded={hasChildren ? isExpanded : undefined}
          tabIndex={isActive ? 0 : -1}
          style={isDisabled ? { opacity: 0.5 } : undefined}
        >
          {/* @ts-expect-error Icon name is dynamic but validated at runtime */}
          <Icon name={item.icon} size="sm" />
          <span className="nav-item-label">{item.label}</span>
          {item.badge !== undefined && (
            <span className="nav-item-badge">{item.badge}</span>
          )}
          {hasChildren && (
            <Icon
              name="chevron-down"
              size="xs"
              className={`nav-dropdown-chevron${isExpanded ? ' nav-dropdown-chevron-open' : ''}`}
            />
          )}
        </button>
        {/* Always render children container for animated expand/collapse */}
        {hasChildren && (
          <div className={`nav-dropdown-children${isExpanded ? ' nav-dropdown-children-open' : ''}`}>
            <div className="nav-dropdown-children-inner">
              {item.children!.map((child) => renderItem(child))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <nav
      className="flex flex-col gap-0.5"
      role="navigation"
      aria-label="Main navigation"
      onKeyDown={handleKeyDown}
    >
      {items.map((item) => renderItem(item))}
    </nav>
  )
}
