import { type KeyboardEvent, type ReactNode } from 'react'

interface ListItemProps {
  className?: string
  /** When provided, renders as interactive (pointer cursor, hover, keyboard nav). */
  onClick?: () => void
  children: ReactNode
}

/**
 * List item — interactive when `onClick` is provided, static otherwise.
 *
 * Interactive items support Enter/Space keyboard activation.
 * Replaces the repeated role="button" + onKeyDown pattern across list pages.
 */
export function ListItem({ className = '', onClick, children }: ListItemProps) {
  const interactive = !!onClick

  const classes = `list-item${interactive ? ' list-item-interactive' : ''}${className ? ` ${className}` : ''}`.trim()

  if (interactive) {
    return (
      <div
        className={classes}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e: KeyboardEvent) => {
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

  return (
    <div className={classes}>
      {children}
    </div>
  )
}
