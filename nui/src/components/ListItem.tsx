import { type ReactNode } from 'react'

interface ListItemProps {
  className?: string
  onClick: () => void
  children: ReactNode
}

/**
 * Clickable list item with keyboard support (Enter/Space).
 *
 * Replaces the repeated role="button" + onKeyDown pattern across list pages.
 */
export function ListItem({ className = '', onClick, children }: ListItemProps) {
  return (
    <div
      className={`list-item ${className}`.trim()}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {children}
    </div>
  )
}
