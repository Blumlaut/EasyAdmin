import { Icon } from './icons'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  resultCount?: { shown: number; total: number }
  ariaLabel?: string
}

/**
 * Reusable search input with a leading icon and an optional `resultCount` summary.
 * Used as the standard search field across list pages.
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  resultCount,
  ariaLabel = 'Search',
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="search-wrapper">
        <Icon name="search" size="sm" className="search-icon shrink-0 text-fg-muted" />
        <input
          className="input search-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
        />
      </div>
      {resultCount && (
        <span className="shrink-0 text-xs text-fg-muted">
          {resultCount.shown}/{resultCount.total}
        </span>
      )}
    </div>
  )
}
