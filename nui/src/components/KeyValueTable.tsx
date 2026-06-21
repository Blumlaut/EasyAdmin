import type { ReactNode } from 'react'

export interface KeyValueRow {
  key: string
  value: ReactNode
  /** If provided, row is clickable and onClick is called with the current value. */
  onClick?: () => void
  /** Label for the action hint (e.g. "Click to edit"), or a ReactNode (e.g. <CopyButton />). */
  actionLabel?: ReactNode
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
    <div className="flex flex-col gap-1" role="table" aria-label={ariaLabel}>
      {rows.map((row) => {
        const interactive = !!row.onClick
        return (
          <div
            key={row.key}
            className="identifier-row flex items-center gap-2"
            role="row"
          >
            <span
              className="kv-key shrink-0 text-sm text-fg-muted"
            >
              {row.key}
            </span>
            {interactive ? (
              <button
                className="btn btn-ghost btn-sm flex-1"
                onClick={row.onClick}
              >
                <span className={`flex-1 text-right text-sm text-fg ${row.mono ? 'text-mono' : ''}`}>
                  {row.value}
                </span>
                {typeof row.actionLabel === 'string' && (
                  <span className="kv-action-badge ml-2 shrink-0 text-xs text-fg-muted">
                    {row.actionLabel}
                  </span>
                )}
                {row.actionLabel && typeof row.actionLabel !== 'string' && (
                  <span className="kv-action-badge ml-2 shrink-0">
                    {row.actionLabel}
                  </span>
                )}
              </button>
            ) : row.actionLabel ? (
              <div className="flex flex-1 items-center">
                <span className={`min-w-0 flex-1 truncate text-right text-sm text-fg ${row.mono ? 'text-mono' : ''}`}>
                  {row.value || <span className="text-fg-muted">—</span>}
                </span>
                <span className="ml-2 shrink-0">
                  {row.actionLabel}
                </span>
              </div>
            ) : (
              <span className={`flex-1 truncate text-right text-sm text-fg ${row.mono ? 'text-mono' : ''}`}>
                {row.value || <span className="text-fg-muted">—</span>}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
