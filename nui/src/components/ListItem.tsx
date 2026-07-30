import { type KeyboardEvent, type ReactNode } from 'react'

interface ListItemProps {
  className?: string
  /** When provided, renders as interactive (pointer cursor, hover, keyboard nav). */
  onClick?: () => void
  /** Called when the interactive row body receives focus (for grid navigation). */
  onFocus?: () => void
  children: ReactNode
}

/**
 * List item — interactive when `onClick` is provided, static otherwise.
 *
 * Interactive items support Enter/Space keyboard activation.
 * Replaces the repeated role="button" + onKeyDown pattern across list pages.
 */
export function ListItem({ className = '', onClick, onFocus, children }: ListItemProps) {
  const interactive = !!onClick

  const classes = `list-item${interactive ? ' list-item-interactive' : ''}${className ? ` ${className}` : ''}`.trim()

  if (interactive) {
    return (
      <div
        className={classes}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onFocus={onFocus}
        onKeyDown={(e: KeyboardEvent) => {
          // Only trigger row click when focus is on the row body itself.
          // If a child button has focus, let it handle the key.
          if ((e.key === 'Enter' || e.key === ' ') && e.currentTarget === e.target) {
            e.preventDefault()
            onClick()
          }
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <div className={classes}>
      {children}
    </div>
  )
}
