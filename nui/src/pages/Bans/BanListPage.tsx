import { useCallback, useEffect, useRef, useState } from 'react'
import type { BanListEntry, PaginatedBanResponse } from '../../types'
import { on, callLua } from '../../fivem'
import { useDebounce } from '../../hooks/useDebounce'
import { useListKeyboardNav } from '../../hooks/useListKeyboardNav'
import { useTranslation } from '../../lib/i18n'
import { SearchBar } from '../../components/SearchBar'
import { Pagination } from '../../components/Pagination'
import { Icon } from '../../components/icons'
import { ListItem } from '../../components/ListItem'
import { PlayerListSkeleton } from '../../components/PlayerListSkeleton'

interface BanListPageProps {
  ipPrivacy: boolean
  onSelectBan: (banId: string) => void
}

const PAGE_SIZE = 10

export function BanListPage({
  ipPrivacy,
  onSelectBan,
}: BanListPageProps) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const [bans, setBans] = useState<BanListEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)

  useListKeyboardNav(listRef, bans.length)

  // Stable refs so the NUI message handler doesn't stale-out
  const bansRef = useRef<BanListEntry[]>([])
  const totalRef = useRef(0)
  const pageRef = useRef(1)

  useEffect(() => {
    bansRef.current = bans
    totalRef.current = total
    pageRef.current = page
  }, [bans, total, page])

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage(1, '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refetch when debounced search changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const { t } = useTranslation()

  const handleRefresh = useCallback(() => {
    fetchPage(page, debouncedQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedQuery])

  return (
    <div className="page-container">
      <div className="mb-3 flex items-center gap-2">
        <SearchBar
          value={query}
          onChange={(v) => {
            setQuery(v)
          }}
          placeholder={t("Search by name, ID, or identifier...")}
          resultCount={{ shown: bans.length, total: total }}
          ariaLabel={t("Search bans")}
        />
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          <Icon name="refresh" size="xs" />
          {t("Refresh")}
        </button>
      </div>

      {loading && bans.length === 0 ? (
        <BanListSkeleton />
      ) : bans.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon empty-state-icon-red">
            <Icon name="ban" size="lg" className="text-red" />
          </div>
          <p className="text-fg-subtle">{total === 0 ? t("No bans on record") : t("No bans match your search")}</p>
        </div>
      ) : (
        <div ref={listRef} className="list">
          {bans.map((ban, i) => (
            <BanRow
              key={`${ban.banid}-${i}`}
              ban={ban}
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
  ipPrivacy: _ipPrivacy,
  onClick,
}: {
  ban: BanListEntry
  ipPrivacy: boolean
  onClick: () => void
}) {
  const { t } = useTranslation()
  // List entries don't include identifiers (fetched on-demand for detail view).
  // Show reason as secondary text.
  const secondary = ban.reason || t('No reason')

  return (
    <ListItem onClick={onClick}>
      <div className="avatar avatar-sm avatar-ban">
        <Icon name="ban" size="xs" className="text-red" />
      </div>
      <div className="list-item-content">
        <div className="list-item-title">{ban.name ?? t('Unknown')}</div>
        <div className="list-item-subtitle text-mono truncate">{secondary}</div>
      </div>
      <div className="list-item-meta">
        {ban.expireString && ban.expire !== -1 && (
          <span className="badge badge-default">{ban.expireString}</span>
        )}
        {ban.expire === -1 && <span className="badge badge-danger">{t("Permanent")}</span>}
      </div>
      <Icon name="chevron-right" size="xs" className="opacity-subtle text-fg-muted" />
    </ListItem>
  )
}

function BanListSkeleton() {
  return <PlayerListSkeleton />
}
