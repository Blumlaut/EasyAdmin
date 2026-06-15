import { useCallback, useEffect, useRef, useState } from 'react'
import type { BanListEntry, Notification, PaginatedBanResponse } from '../../types'
import { on, callLua } from '../../fivem'
import { useDebounce } from '../../hooks/useDebounce'
import { SearchBar } from '../../components/SearchBar'
import { Pagination } from '../../components/Pagination'
import { Skeleton } from '../../components/Skeleton'
import { Icon } from '../../components/icons'

interface BanListPageProps {
  showLicenses: boolean
  ipPrivacy: boolean
  onSelectBan: (banId: string) => void
  onToast: (text: string, type?: Notification['type']) => void
}

const PAGE_SIZE = 10

export function BanListPage({
  showLicenses,
  ipPrivacy,
  onSelectBan,
  onToast: _onToast,
}: BanListPageProps) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const [bans, setBans] = useState<BanListEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Stable ref so the NUI message handler doesn't stale-out
  const bansRef = useRef(bans)
  bansRef.current = bans
  const totalRef = useRef(total)
  totalRef.current = total
  const pageRef = useRef(page)
  pageRef.current = page

  const fetchPage = useCallback((p: number, q: string) => {
    setLoading(true)
    callLua('requestBanPage', { page: p, pageSize: PAGE_SIZE, query: q })
  }, [])

  // Listen for paginated results pushed from Lua
  useEffect(() => {
    return on<PaginatedBanResponse>('banPage', (data) => {
      setBans(data.bans)
      setTotal(data.total)
      setPage(data.page)
      setTotalPages(data.totalPages)
      setLoading(false)
    })
  }, [])

  // Fetch page 1 on mount
  useEffect(() => {
    fetchPage(1, '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refetch when debounced search changes
  useEffect(() => {
    setPage(1)
    fetchPage(1, debouncedQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const handlePageChange = useCallback((p: number) => {
    setPage(p)
    fetchPage(p, debouncedQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const handleFirstPage = useCallback(() => handlePageChange(1), [handlePageChange])
  const handleLastPage = useCallback(() => handlePageChange(totalPages), [handlePageChange, totalPages])
  const handleNextPage = useCallback(() => handlePageChange(Math.min(page + 1, totalPages)), [handlePageChange, page, totalPages])
  const handlePrevPage = useCallback(() => handlePageChange(Math.max(page - 1, 1)), [handlePageChange, page])

  const handleRefresh = useCallback(() => {
    fetchPage(page, debouncedQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedQuery])

  return (
    <div className="page-container">
      <div className="flex items-center gap-2 mb-3">
        <SearchBar
          value={query}
          onChange={(v) => {
            setQuery(v)
          }}
          placeholder="Search by ID, name, reason, or identifier..."
          resultCount={{ shown: bans.length, total: total }}
          ariaLabel="Search bans"
        />
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          <Icon name="refresh" size="xs" />
          Refresh
        </button>
      </div>

      {loading && bans.length === 0 ? (
        <BanListSkeleton />
      ) : bans.length === 0 ? (
        <div className="card empty-state">
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-2)',
          }}>
            <Icon name="ban" size="lg" className="text-red" />
          </div>
          <p className="text-secondary">{total === 0 ? 'No bans on record' : 'No bans match your search'}</p>
        </div>
      ) : (
        <div className="list">
          {bans.map((ban, i) => (
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
        page={page}
        totalPages={totalPages}
        onFirst={handleFirstPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        onLast={handleLastPage}
      />
    </div>
  )
}

function BanRow({
  ban,
  showLicenses: _showLicenses,
  ipPrivacy: _ipPrivacy,
  onClick,
}: {
  ban: BanListEntry
  showLicenses: boolean
  ipPrivacy: boolean
  onClick: () => void
}) {
  // List entries don't include identifiers (fetched on-demand for detail view).
  // Show reason as secondary text.
  const secondary = ban.reason || 'No reason'

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
      <div className="avatar avatar-sm" style={{
        background: 'var(--bg-red)',
        borderColor: 'rgba(248, 81, 73, 0.3)',
      }}>
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
      <Icon name="chevron-right" size="xs" className="text-muted" style={{ opacity: 0.4 }} />
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
