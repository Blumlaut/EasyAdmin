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
      <div className="flex items-center flex-1">
        <Icon name="search" size="sm" className="text-muted shrink-0" />
        <input
          className="input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
        />
      </div>
      {resultCount && (
        <span className="text-sm text-muted shrink-0">
          {resultCount.shown}/{resultCount.total}
        </span>
      )}
    </div>
  )
}
