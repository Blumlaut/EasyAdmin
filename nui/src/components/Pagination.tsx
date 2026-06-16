import { Icon } from './icons'

interface PaginationProps {
  page: number
  totalPages: number
  onFirst: () => void
  onPrev: () => void
  onNext: () => void
  onLast: () => void
}

/**
 * First/prev/next/last page controls.
 * Hides buttons that would not change state (e.g. prev on page 1).
 */
export function Pagination({
  page,
  totalPages,
  onFirst,
  onPrev,
  onNext,
  onLast,
}: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2" role="navigation" aria-label="Pagination">
      {page > 1 && (
        <button className="btn btn-sm btn-secondary" onClick={onFirst} aria-label="First page">
          <Icon name="chevron-double-left" size="xs" />
        </button>
      )}
      {page > 1 && (
        <button className="btn btn-sm btn-secondary" onClick={onPrev} aria-label="Previous page">
          <Icon name="chevron-left" size="xs" />
          Prev
        </button>
      )}
      <span className="text-sm text-muted text-mono">
        {page} / {totalPages}
      </span>
      {page < totalPages && (
        <button className="btn btn-sm btn-secondary" onClick={onNext} aria-label="Next page">
          Next
          <Icon name="chevron-right" size="xs" />
        </button>
      )}
      {page < totalPages && (
        <button className="btn btn-sm btn-secondary" onClick={onLast} aria-label="Last page">
          <Icon name="chevron-double-right" size="xs" />
        </button>
      )}
    </div>
  )
}
