import { useMemo, useState } from 'react'
import type { BanEntry, Notification } from '../../types'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import { SearchBar } from '../../components/SearchBar'
import { Pagination } from '../../components/Pagination'
import { Skeleton } from '../../components/Skeleton'
import { Icon } from '../../components/icons'

interface BanListPageProps {
  bans: BanEntry[]
  loading: boolean
  showLicenses: boolean
  ipPrivacy: boolean
  onSelectBan: (banId: string) => void
  onToast: (text: string, type?: Notification['type']) => void
  onRefresh: () => void
}

const PAGE_SIZE = 10

export function BanListPage({
  bans,
  loading,
  showLicenses,
  ipPrivacy,
  onSelectBan,
  onRefresh,
}: BanListPageProps) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)

  const filtered = useMemo(() => {
    if (!debouncedQuery) return bans
    const q = debouncedQuery.toLowerCase()
    return bans.filter((ban) => {
      if (ban.banid?.toLowerCase().includes(q)) return true
      if (ban.name?.toLowerCase().includes(q)) return true
      if (ban.reason?.toLowerCase().includes(q)) return true
      if (ban.identifiers?.some((id) => id.toLowerCase().includes(q))) return true
      return false
    })
  }, [bans, debouncedQuery])

  const pagination = usePagination(filtered, PAGE_SIZE)

  return (
    <div className="page-container">
      <div className="flex items-center gap-2 mb-3">
        <SearchBar
          value={query}
          onChange={(v) => {
            setQuery(v)
            pagination.reset()
          }}
          placeholder="Search by ID, name, reason, or identifier..."
          resultCount={{ shown: filtered.length, total: bans.length }}
          ariaLabel="Search bans"
        />
        <button
          className="btn btn-ghost btn-sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <Icon name="refresh" size="xs" />
          Refresh
        </button>
      </div>

      {loading ? (
        <BanListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <Icon name="ban" size="lg" className="text-muted" />
          <p>{bans.length === 0 ? 'No bans on record' : 'No bans match your search'}</p>
        </div>
      ) : (
        <div className="list">
          {pagination.pageItems.map((ban, i) => (
            <BanRow
              key={`${ban.banid}-${i}`}
              ban={ban}
              showLicenses={showLicenses}
              ipPrivacy={ipPrivacy}
              onClick={() => onSelectBan(ban.banid)}
            />
          ))}
        </div>
      )}

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onFirst={pagination.firstPage}
        onPrev={pagination.prevPage}
        onNext={pagination.nextPage}
        onLast={pagination.lastPage}
      />
    </div>
  )
}

function BanRow({
  ban,
  showLicenses,
  ipPrivacy,
  onClick,
}: {
  ban: BanEntry
  showLicenses: boolean
  ipPrivacy: boolean
  onClick: () => void
}) {
  const secondary = (() => {
    if (showLicenses) {
      const visible = ban.identifiers?.find((id) => {
        if (ipPrivacy && id.split(':')[0] === 'ip') return false
        return true
      })
      if (visible) return visible
    }
    return ban.reason || 'No reason'
  })()

  return (
    <div
      className="list-item"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="avatar avatar-sm">
        <Icon name="ban" size="xs" className="text-red" />
      </div>
      <div className="list-item-content">
        <div className="list-item-title">{ban.name ?? 'Unknown'}</div>
        <div className="list-item-subtitle text-mono truncate">{secondary}</div>
      </div>
      <div className="list-item-meta">
        {ban.expireString && ban.expire !== -1 && (
          <span className="badge badge-default">{ban.expireString}</span>
        )}
        {ban.expire === -1 && <span className="badge badge-danger">Permanent</span>}
      </div>
    </div>
  )
}

function BanListSkeleton() {
  return (
    <div className="list">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="list-item">
          <Skeleton width={32} height={32} circle />
          <div className="list-item-content flex flex-col gap-1">
            <Skeleton width="40%" height={14} />
            <Skeleton width="60%" height={12} />
          </div>
        </div>
      ))}
    </div>
  )
}
