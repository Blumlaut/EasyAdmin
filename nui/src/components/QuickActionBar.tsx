import { useMemo } from 'react'
import type { IconName } from './icons'
import { Icon } from './icons'
import { Tooltip } from './Tooltip'
import { DropdownMenu } from './DropdownMenu'

// ---- Types ----

export type QuickActionVariant = 'default' | 'warning' | 'danger'

export interface QuickAction {
  /** Display label (used for tooltip and dropdown). */
  label: string
  /** Lucide icon name. */
  icon: IconName
  /** Color variant for the button. */
  variant?: QuickActionVariant
  /** Called when the action is triggered. Pass the event so the caller can stopPropagation. */
  onClick: (e: React.MouseEvent) => void | Promise<void>
}

export interface DropdownAction {
  /** Display label. */
  label: string
  /** Lucide icon name. */
  icon: IconName
  /** Whether to style as destructive. */
  danger?: boolean
  /** Called when selected. */
  onSelect: () => void | Promise<void>
}

export interface QuickActionBarProps {
  /** Actions shown as direct icon buttons. */
  actions: QuickAction[]
  /** Actions shown inside the dropdown (chevron) button. */
  dropdownActions?: DropdownAction[]
}

/**
 * Compact row of icon buttons + optional dropdown for overflow actions.
 *
 * Designed for inline use inside list rows so admins can act without
 * navigating to a detail page.  Buttons are small, icon-only, and
 * show a tooltip on hover.
 *
 * Each button's `onClick` receives the mouse event — call
 * `e.stopPropagation()` to prevent the parent row from firing its
 * own click handler (e.g. navigation to a detail page).
 */
export function QuickActionBar({ actions, dropdownActions }: QuickActionBarProps) {
  const hasDropdown = (dropdownActions?.length ?? 0) > 0
  const hasAny = actions.length > 0 || hasDropdown

  if (!hasAny) {
    return null
  }

  const menuItems = useMemo(
    () =>
      (dropdownActions ?? []).map((item) => ({
        label: item.label,
        icon: item.icon,
        danger: item.danger,
        onSelect: () => item.onSelect(),
      })),
    [dropdownActions],
  )

  return (
    <div className="quick-action-bar">
      {actions.map((action, i) => (
        <Tooltip key={`${action.icon}-${i}`} content={action.label}>
          <button
            type="button"
            className={`quick-action-btn${action.variant ? ` quick-action-btn--${action.variant}` : ''}`}
            onClick={action.onClick}
          >
            <Icon name={action.icon} size="sm" />
          </button>
        </Tooltip>
      ))}

      {hasDropdown && (
        <DropdownMenu
          align="right"
          items={menuItems}
          trigger={
            <button
              type="button"
              className="quick-action-btn quick-action-btn--dropdown"
            >
              <Icon name="chevron-down" size="sm" />
            </button>
          }
        />
      )}
    </div>
  )
}
