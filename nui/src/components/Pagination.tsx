import { Icon } from './icons'
import { useTranslation } from '../lib/i18n'

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
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2" role="navigation" aria-label={t("Pagination")}>
      {page > 1 && (
        <button className="btn btn-sm btn-secondary" onClick={onFirst} aria-label={t("First page")}>
          <Icon name="chevron-double-left" size="xs" />
        </button>
      )}
      {page > 1 && (
        <button className="btn btn-sm btn-secondary" onClick={onPrev} aria-label={t("Previous page")}>
          <Icon name="chevron-left" size="xs" />
          {t("Prev")}
        </button>
      )}
      <span className="text-mono text-sm text-fg-muted">
        {page} / {totalPages}
      </span>
      {page < totalPages && (
        <button className="btn btn-sm btn-secondary" onClick={onNext} aria-label={t("Next page")}>
          {t("Next")}
          <Icon name="chevron-right" size="xs" />
        </button>
      )}
      {page < totalPages && (
        <button className="btn btn-sm btn-secondary" onClick={onLast} aria-label={t("Last page")}>
          <Icon name="chevron-double-right" size="xs" />
        </button>
      )}
    </div>
  )
}
