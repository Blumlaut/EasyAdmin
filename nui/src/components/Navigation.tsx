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
  return (
    <nav
      className="flex flex-col gap-0.5"
      role="navigation"
      aria-label="Main navigation"
    >
      {items.map((item) => (
        <button
          key={item.id}
          className={`nav-item${activeId === item.id ? ' nav-item-active' : ''}`}
          onClick={() => !item.disabled && onSelect(item.id)}
          disabled={item.disabled}
          aria-current={activeId === item.id ? 'page' : undefined}
          aria-disabled={item.disabled}
          tabIndex={item.disabled ? -1 : undefined}
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
