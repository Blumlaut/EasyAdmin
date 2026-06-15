import type { ReactNode } from 'react'

export interface KeyValueRow {
  key: string
  value: ReactNode
  /** If provided, row is clickable and onClick is called with the current value. */
  onClick?: () => void
  /** Label for the action hint (e.g. "Click to edit"). */
  actionLabel?: string
  mono?: boolean
}

interface KeyValueTableProps {
  rows: KeyValueRow[]
  ariaLabel?: string
}

/**
 * Display rows of `key: value` pairs. Used for ban details, player info, etc.
 * Rows with an `onClick` handler are interactive and styled as buttons.
 */
export function KeyValueTable({ rows, ariaLabel }: KeyValueTableProps) {
  return (
    <div className="flex flex-col" role="table" aria-label={ariaLabel}>
      {rows.map((row, i) => {
        const isLast = i === rows.length - 1
        const interactive = !!row.onClick
        return (
          <div
            key={row.key}
            className={`flex items-center gap-3 py-2 ${isLast ? '' : 'kv-row-divider'}`}
            role="row"
          >
            <span
              className="text-sm text-muted shrink-0 kv-key"
            >
              {row.key}
            </span>
            {interactive ? (
              <button
                className="btn btn-ghost btn-sm flex-1 justify-start text-left"
                onClick={row.onClick}
                title={row.actionLabel}
              >
                <span className={row.mono ? 'text-mono' : ''}>{row.value}</span>
                {row.actionLabel && (
                  <span className="text-xs text-muted ml-auto">
                    {row.actionLabel}
                  </span>
                )}
              </button>
            ) : (
              <span className={`text-sm text-primary flex-1 truncate ${row.mono ? 'text-mono' : ''}`}>
                {row.value || <span className="text-muted">—</span>}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
