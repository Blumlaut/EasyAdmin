import type { ReactNode } from 'react'
import './tooltip.css'

interface TooltipProps {
  /** Text shown inside the tooltip on hover */
  content: string
  /** Element(s) to wrap */
  children: ReactNode
}

/**
 * Lightweight CSS-only tooltip.
 * Renders a `::after` pseudo-element on hover using `attr(data-tooltip)`.
 * Works on any inline or block element — no portals, no JS state.
 */
export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="ea-tooltip" data-tooltip={content}>
      {children}
    </span>
  )
}
