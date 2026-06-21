import { useCallback, useState } from 'react'
import { Icon } from './icons'

// ============================================================
// Types
// ============================================================

export type SortDir = 'asc' | 'desc'

export interface TableColumn<T = unknown> {
  /** Unique column key (used as sort key) */
  key: string
  /** Header label */
  label: string
  /** Whether this column is sortable */
  sortable?: boolean
  /** Render function for cell content */
  render: (item: T, index: number) => React.ReactNode
  /** Optional CSS class for the cell */
  cellClass?: string
}

export interface SortState {
  sortBy: string
  sortDir: SortDir
}

interface SortableTableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  /** Controlled sort state (optional — omit for internal management) */
  sortBy?: string
  sortDir?: SortDir
  /** Called when sort changes */
  onSortChange?: (state: SortState) => void
  /** Called when refresh is requested */
  onRefresh?: () => void
  /** Row key extractor */
  getKey: (item: T, index: number) => string
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  emptySubMessage?: string
  /** Additional CSS class on the table */
  tableClass?: string
  /** Additional CSS class on the wrapper */
  className?: string
}

// ============================================================
// Component
// ============================================================

export function SortableTable<T>({
  columns,
  rows,
  sortBy,
  sortDir,
  onSortChange,
  onRefresh,
  getKey,
  loading = false,
  emptyMessage = 'No data',
  emptySubMessage,
  tableClass = 'statistics-table',
  className = '',
}: SortableTableProps<T>) {
  const [internalSortBy, setInternalSortBy] = useState('')
  const [internalSortDir, setInternalSortDir] = useState<SortDir>('desc')

  const isActive = sortBy !== undefined
  const activeSortBy = isActive ? sortBy : internalSortBy
  const activeSortDir = isActive ? sortDir ?? 'desc' : internalSortDir

  const handleSort = useCallback(
    (colKey: string) => {
      if (activeSortBy === colKey) {
        const newDir = activeSortDir === 'desc' ? 'asc' : 'desc'
        if (isActive) {
          onSortChange?.({ sortBy: colKey, sortDir: newDir })
        } else {
          setInternalSortDir(newDir)
        }
      } else {
        if (isActive) {
          onSortChange?.({ sortBy: colKey, sortDir: 'desc' })
        } else {
          setInternalSortBy(colKey)
          setInternalSortDir('desc')
        }
      }
    },
    [activeSortBy, activeSortDir, isActive, onSortChange],
  )

  if (loading && rows.length === 0) {
    return (
      <div className={`flex min-h-100 items-center justify-center ${className}`}>
        <p className="text-xs text-fg-muted">Loading…</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-6 ${className}`}>
        <p className="text-sm text-fg-muted">{emptyMessage}</p>
        {emptySubMessage && <p className="mt-1 text-xs text-fg-muted">{emptySubMessage}</p>}
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      {onRefresh && (
        <div className="mb-2 flex justify-end">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <Icon name="refresh" size="xs" />
            Refresh
          </button>
        </div>
      )}
      <table className={tableClass}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.sortable ? 'sortable-header' : ''}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                {col.sortable ? (
                  <span className="sort-header-inner">
                    {col.label}
                    <span className="sort-icon">
                      {activeSortBy === col.key ? (
                        <Icon name={activeSortDir === 'asc' ? 'chevron-up' : 'chevron-down'} size="xs" />
                      ) : (
                        <Icon name="chevron-down" size="xs" className="sort-icon-inactive" />
                      )}
                    </span>
                  </span>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={getKey(row, i)}>
              {columns.map((col) => (
                <td key={col.key} className={col.cellClass}>
                  {col.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
