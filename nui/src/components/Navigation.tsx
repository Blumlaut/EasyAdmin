/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './icons'

export type NavItemType = 'item' | 'separator' | 'header'

export interface NavItemBase {
  type?: 'item'
  id: string
  label: string
  icon: string
  badge?: string | number
  disabled?: boolean
  // Dropdown support: when present, this item renders as an expandable group
  children?: NavItem[]
}

export interface NavSeparator {
  type: 'separator'
}

export interface NavHeader {
  type: 'header'
  label: string
}

export type NavItem = NavItemBase | NavSeparator | NavHeader

/** Type guard: is this a clickable nav item (not a separator or header)? */
function isNavItem(item: NavItem): item is NavItemBase {
  return item.type === 'item' || item.type === undefined
}

/** Type guard: is this a separator? */
function isSeparator(item: NavItem): item is NavSeparator {
  return item.type === 'separator'
}

/** Type guard: is this a section header? */
function isHeader(item: NavItem): item is NavHeader {
  return item.type === 'header'
}

/** Build a collapsed expanded map with only `id` set to true (accordion pattern). */
function expandOnly(id: string, prev: Record<string, boolean>): Record<string, boolean> {
  const collapsed: Record<string, boolean> = {}
  for (const key of Object.keys(prev)) {
    collapsed[key] = false
  }
  collapsed[id] = true
  return collapsed
}

interface NavigationProps {
  items: NavItem[]
  activeId: string
  onSelect: (id: string) => void
  orientation?: 'vertical' | 'horizontal'
}

export function Navigation({ items, activeId, onSelect, orientation = 'vertical' }: NavigationProps) {
  const navRef = useRef<HTMLButtonElement[]>([])
  // Track which dropdown groups are expanded (keyed by parent id)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Auto-expand a dropdown when its parent or a child is active (accordion: close others)
  useEffect(() => {
    for (const item of items) {
      if (!isNavItem(item) || !item.children) continue
      const childIds = item.children.filter(isNavItem).map((c) => c.id)
      if (activeId === item.id || childIds.includes(activeId)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-expand dropdown to reveal active item when navigation changes externally
        setExpanded((prev) => prev[item.id] ? prev : expandOnly(item.id, prev))
        break
      }
    }
  }, [activeId, items])

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => prev[id] ? {} : expandOnly(id, prev))
  }, [])

  const initItemRefs = useCallback((el: HTMLButtonElement | null) => {
    if (el) {
      navRef.current.push(el)
    }
  }, [])

  // Collect all leaf (non-dropdown) items for keyboard navigation
  const leafItems = useCallback((): NavItemBase[] => {
    const leaves: NavItemBase[] = []
    for (const item of items) {
      if (!isNavItem(item)) continue
      if (item.children && expanded[item.id]) {
        for (const child of item.children) {
          if (isNavItem(child)) leaves.push(child)
        }
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

    const nextKeys = orientation === 'horizontal' ? ['ArrowRight', 'ArrowDown'] : ['ArrowDown', 'ArrowRight']
    const prevKeys = orientation === 'horizontal' ? ['ArrowLeft', 'ArrowUp'] : ['ArrowUp', 'ArrowLeft']

    switch (e.key) {
      case nextKeys[0]:
      case nextKeys[1]:
        e.preventDefault()
        newIndex = (currentIndex + 1) % enabledItems.length
        break
      case prevKeys[0]:
      case prevKeys[1]:
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
      // Expand parent dropdown if the target is a child (accordion: close others)
      for (const item of items) {
        if (isNavItem(item) && item.children && item.children.some((c) => isNavItem(c) && c.id === target.id)) {
          setExpanded((prev) => prev[item.id] ? prev : expandOnly(item.id, prev))
          break
        }
      }
      // Find the DOM element for the target and focus it
      const targetEl = navRef.current.find(
        (el) => el && el.getAttribute('data-nav-id') === target.id,
      )
      targetEl?.focus()
    }
  }, [items, activeId, onSelect, leafItems, orientation])

  const renderItem = (item: NavItem, index: number) => {
    // Render separator
    if (isSeparator(item)) {
      return <div key={`sep-${index}`} className="nav-separator" />
    }

    // Render section header
    if (isHeader(item)) {
      return (
        <div key={`header-${item.label}`} className="nav-header">
          {item.label}
        </div>
      )
    }

    // At this point item is a NavItemBase
    const navItem = item as NavItemBase
    const hasChildren = !!navItem.children && navItem.children.length > 0
    const isExpanded = expanded[navItem.id]
    const isActive = activeId === navItem.id
    const isParentActive = (hasChildren && navItem.children?.some((c) => isNavItem(c) && c.id === activeId)) ?? false
    const isDisabled = navItem.disabled || ((hasChildren && navItem.children?.every((c) => !isNavItem(c) || c.disabled)) ?? false)

    return (
      <div key={navItem.id} className={`${hasChildren ? 'nav-dropdown' : ''}${hasChildren && (isActive || isParentActive) ? ' nav-dropdown-parent' : ''}`.trimStart()}>
        <button
          ref={initItemRefs}
          data-nav-id={navItem.id}
          className={`nav-item${hasChildren && (isActive || isParentActive) ? ' nav-dropdown-parent-active' : ''}${!hasChildren && isActive ? ' nav-item-active' : ''}${hasChildren ? ' nav-dropdown-toggle' : ''}`}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(navItem.id)
              // If expanding and no child is active, navigate to first enabled child
              if (!isExpanded) {
                const firstEnabled = navItem.children?.find((c) => isNavItem(c) && !c.disabled) as NavItemBase | undefined
                if (firstEnabled && !isParentActive) onSelect(firstEnabled.id)
                else if (isParentActive) {
                  const activeChild = navItem.children?.find((c) => isNavItem(c) && c.id === activeId) as NavItemBase | undefined
                  if (activeChild) onSelect(activeChild.id)
                }
              }
            } else if (!navItem.disabled) {
              onSelect(navItem.id)
            }
          }}
          disabled={isDisabled}
          aria-current={(isActive || (hasChildren && isParentActive)) ? 'page' : undefined}
          aria-disabled={isDisabled}
          aria-expanded={hasChildren ? isExpanded : undefined}
          tabIndex={(isActive || (hasChildren && isParentActive)) ? 0 : -1}
          style={isDisabled ? { opacity: 0.5 } : undefined}
        >
          {/* @ts-expect-error Icon name is dynamic but validated at runtime */}
          <Icon name={navItem.icon} size="sm" />
          <span className="nav-item-label">{navItem.label}</span>
          {navItem.badge !== undefined && (
            <span className="nav-item-badge">{navItem.badge}</span>
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
              {navItem.children?.map((child, idx) => renderItem(child, idx)) ?? []}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <nav
      className={`navigation navigation--${orientation}`}
      role="navigation"
      aria-label="Main navigation"
      onKeyDown={handleKeyDown}
    >
      {items.map((item, idx) => renderItem(item, idx))}
    </nav>
  )
}
