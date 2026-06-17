import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DailyPeak, Notification, PaginatedPlayerRegistryResponse, PlayerRegistryEntry, StatsSummary, StatsRange } from '../../types'
import { callLua, on } from '../../fivem'
import { Icon } from '../../components/icons'
import { SearchBar } from '../../components/SearchBar'
import { SelectMenu, type SelectMenuItem } from '../../components/SelectMenu'
import { TimeSeriesChart, type TimeSeriesLine } from '../../components/TimeSeriesChart'
import { BarChart } from '../../components/BarChart'
import { Pagination } from '../../components/Pagination'
import { useDebounce } from '../../hooks/useDebounce'
import { useListKeyboardNav } from '../../hooks/useListKeyboardNav'

// ============================================================
// Types
// ============================================================

interface StatisticsPageProps {
  onToast: (text: string, type?: Notification['type']) => void
}

// ============================================================
// Helpers
// ============================================================

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatDayLabelFull(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

// ============================================================
// Range selector options
// ============================================================

const rangeOptions: Array<{ value: StatsRange; label: string }> = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '120d', label: '120 Days' },
]

// ============================================================
// StatCard
// ============================================================

function StatCard({
  label,
  value,
  subValue,
  icon,
  iconColor,
  bgColor,
}: {
  label: string
  value: string | number
  subValue?: string
  icon: string
  iconColor: string
  bgColor: string
}) {
  return (
    <div className="card statistics-card">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted statistics-label">{label}</p>
          <p className="text-2xl font-bold statistics-value mt-1">{value}</p>
          {subValue && <p className="text-xs text-muted mt-0.5">{subValue}</p>}
        </div>
        <div
          className="statistics-icon"
          // eslint-disable-next-line nui/no-inline-styles
          style={{ background: bgColor }}
        >
          {/* @ts-expect-error dynamic icon name */}
          <Icon name={icon} size="md" style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// DailyPeaksChart
// Multi-line time series showing daily max/avg/min player counts.
// Uses Chart.js for proper time-axis rendering.
// ============================================================

function DailyPeaksChart({ data }: { data: DailyPeak[] }) {
  const lines: TimeSeriesLine[] = useMemo(() => [
    {
      label: 'Max',
      data: data.map((d) => ({ timestamp: d.day * 1000, value: d.max })),
      color: '#3fb950',
      fillColor: 'rgba(63, 185, 80, 0.12)',
    },
    {
      label: 'Avg',
      data: data.map((d) => ({ timestamp: d.day * 1000, value: d.avg })),
      color: '#3b82f6',
      fillColor: 'rgba(59, 130, 246, 0.15)',
    },
    {
      label: 'Min',
      data: data.map((d) => ({ timestamp: d.day * 1000, value: d.min })),
      color: '#d29922',
      fill: false,
      borderDash: [4, 3],
    },
  ], [data])

  const chartRange = useMemo(() => {
    if (data.length === 0) return { start: Date.now() - 86400000 * 7, end: Date.now() }
    return {
      start: data[0].day * 1000 - 43200000, // 12h padding
      end: data[data.length - 1].day * 1000 + 43200000,
    }
  }, [data])

  return (
    <div className="card statistics-chart-card">
      <div className="flex items-center justify-between mb-3">
        <p className="section-label">Daily Player Peaks</p>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-green)' }} />
            Max
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--brand-blue-light)' }} />
            Avg
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-orange)' }} />
            Min
          </span>
        </div>
      </div>
      <TimeSeriesChart
        lines={lines}
        range={chartRange}
        height={200}
        showLegend={false}
        unit="players"
        emptyMessage="No data for this time range"
      />
    </div>
  )
}

// ============================================================
// PlayerRegistryTable
// Paginated, searchable table of tracked players with session stats.
// Uses server-side pagination to avoid loading all players at once.
// ============================================================

const REGISTRY_PAGE_SIZE = 20

type RegistrySortBy = 'sessions' | 'playtime' | 'lastSeen'

function PlayerRegistryTable({ filterDays }: { filterDays: number }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<RegistrySortBy>('lastSeen')
  const [players, setPlayers] = useState<PlayerRegistryEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  useListKeyboardNav(listRef, players.length)

  const fetchPage = useCallback((p: number, q: string, sort: RegistrySortBy) => {
    setLoading(true)
    callLua('requestPlayerRegistryPage', { page: p, pageSize: REGISTRY_PAGE_SIZE, query: q, sortBy: sort, filterDays })
  }, [filterDays])

  // Listen for paginated results pushed from Lua
  useEffect(() => {
    return on<PaginatedPlayerRegistryResponse>('playerRegistryPage', (data) => {
      // Server sends unix seconds; convert to ms for frontend
      setPlayers(data.players.map((p) => ({
        ...p,
        firstSeen: p.firstSeen * 1000,
        lastSeen: p.lastSeen * 1000,
      })))
      setTotal(data.total)
      setPage(data.page)
      setTotalPages(data.totalPages)
      setLoading(false)
    })
  }, [])

  // Fetch page 1 on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage(1, '', 'lastSeen')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refetch when debounced search changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
    fetchPage(1, debouncedQuery, sortBy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  // Refetch when sort changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
    fetchPage(1, debouncedQuery, sortBy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy])

  const handlePageChange = useCallback((p: number) => {
    setPage(p)
    fetchPage(p, debouncedQuery, sortBy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, sortBy])

  const handleFirstPage = useCallback(() => handlePageChange(1), [handlePageChange])
  const handleLastPage = useCallback(() => handlePageChange(totalPages), [handlePageChange, totalPages])
  const handleNextPage = useCallback(() => handlePageChange(Math.min(page + 1, totalPages)), [handlePageChange, page, totalPages])
  const handlePrevPage = useCallback(() => handlePageChange(Math.max(page - 1, 1)), [handlePageChange, page])

  const handleRefresh = useCallback(() => {
    fetchPage(page, debouncedQuery, sortBy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedQuery, sortBy])

  const handleSortChange = useCallback((item: SelectMenuItem) => {
    setSortBy(item.value as RegistrySortBy)
  }, [])

  const sortOptions: SelectMenuItem[] = [
    { value: 'lastSeen', label: 'Last Seen' },
    { value: 'sessions', label: 'Sessions' },
    { value: 'playtime', label: 'Playtime' },
  ]

  return (
    <div>
      <div className="card statistics-chart-card">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">Player Registry</p>
          <div className="flex items-center gap-2">
            <SelectMenu
              items={sortOptions}
              onChange={handleSortChange}
              ariaLabel="Sort players by"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by name…"
            resultCount={players.length > 0 ? { shown: players.length, total: total } : undefined}
            ariaLabel="Search player registry"
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

        {loading && players.length === 0 ? (
          <div className="flex items-center justify-center" style={{ minHeight: '100px' }}>
            <p className="text-xs text-muted">Loading player data…</p>
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="empty-state-icon empty-state-icon-blue mb-3">
              <Icon name="users" size="lg" className="text-blue" />
            </div>
            <p className="text-sm text-muted">{total === 0 ? 'No player data collected yet' : 'No players match your search'}</p>
            {total === 0 && <p className="text-xs text-muted mt-1">Players will appear here after connecting</p>}
          </div>
        ) : (
          <div ref={listRef} className="overflow-x-auto">
            <table className="statistics-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>First Seen</th>
                  <th>Last Seen</th>
                  <th>Sessions</th>
                  <th>Total Playtime</th>
                  <th>Avg Session</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.identifier}>
                    <td className="truncate max-w-[160px]" title={player.name}>
                      {player.name}
                    </td>
                    <td className="text-xs text-muted">{formatDayLabelFull(player.firstSeen / 1000)}</td>
                    <td className="text-xs text-muted">{formatDayLabelFull(player.lastSeen / 1000)}</td>
                    <td className="text-xs font-semibold">{player.sessions}</td>
                    <td className="text-xs">{formatDuration(player.playtime)}</td>
                    <td className="text-xs">{player.sessions > 0 ? formatDuration(player.playtime / player.sessions) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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

// ============================================================
// Skeleton loader
// ============================================================

function StatisticsSkeleton() {
  return (
    <div className="page-container">
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 gap-3 mb-4 statistics-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card statistics-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="skeleton" style={{ width: '60%', height: '12px' }} />
                <div className="skeleton mt-2" style={{ width: '40%', height: '24px' }} />
              </div>
              <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
            </div>
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="grid grid-cols-1 gap-3">
        <div className="card statistics-chart-card">
          <div className="skeleton" style={{ width: '30%', height: '16px' }} />
          <div className="skeleton mt-4" style={{ width: '100%', height: '160px' }} />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// StatisticsPage
// ============================================================

export function StatisticsPage({ onToast: _onToast }: StatisticsPageProps) {
  const [range, setRange] = useState<StatsRange>('30d')
  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [dailyPeaks, setDailyPeaks] = useState<DailyPeak[]>([])
  const [loading, setLoading] = useState(true)

  // Full registry data for bar chart summaries (top-N only).
  // The paginated table uses its own server-side pagination.
  const [registry, setRegistry] = useState<PlayerRegistryEntry[]>([])

  // Version refs to discard stale responses when range changes rapidly
  const rangeVer = useRef(0)
  const registryVer = useRef(0)

  const rangeDays = useMemo(() => {
    if (range === '7d') return 7
    if (range === '30d') return 30
    if (range === '90d') return 90
    return 120
  }, [range])

  const currentRangeVer = useRef(0)
  const currentRegistryVer = useRef(0)

  // Listen for summary results pushed from Lua
  useEffect(() => {
    return on<StatsSummary>('statsSummary', (data) => {
      if (currentRangeVer.current === rangeVer.current) {
        setSummary(data)
        setLoading(false)
      }
    })
  }, [])

  // Listen for daily peaks results pushed from Lua
  useEffect(() => {
    return on<DailyPeak[]>('dailyPeaks', (data) => {
      if (currentRangeVer.current === rangeVer.current) {
        setDailyPeaks(data)
        setLoading(false)
      }
    })
  }, [])

  // Listen for full player registry results (used for bar chart summaries only).
  // The registry table uses server-side pagination via PlayerRegistryTable.
  useEffect(() => {
    return on<PlayerRegistryEntry[]>('playerRegistry', (data) => {
      if (currentRegistryVer.current === registryVer.current) {
        // Server sends unix seconds; convert to ms for frontend
        setRegistry(data.map((p) => ({
          ...p,
          firstSeen: p.firstSeen * 1000,
          lastSeen: p.lastSeen * 1000,
        })))
      }
    })
  }, [])

  // Fire requests when range changes
  useEffect(() => {
    const ver = ++rangeVer.current
    currentRangeVer.current = ver
    setLoading(true)
    setSummary(null)
    setDailyPeaks([])
    callLua('requestStatsSummary', { range }).catch(() => {})
    callLua('requestDailyPeaks', { range }).catch(() => {})
  }, [range])

  // Fire registry request for bar chart data when range days changes.
  // This is kept for the top-N bar charts; the table uses pagination separately.
  useEffect(() => {
    const ver = ++registryVer.current
    currentRegistryVer.current = ver
    setRegistry([])
    callLua('requestPlayerRegistry', { filterDays: rangeDays }).catch(() => {})
  }, [rangeDays])

  // Top sessions players (for mini bar chart)
  const topSessions = useMemo(() => {
    return [...registry]
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5)
      .map((p) => ({
        label: p.name,
        value: p.sessions,
      }))
  }, [registry])

  // Top playtime players
  const topPlaytime = useMemo(() => {
    return [...registry]
      .sort((a, b) => b.playtime - a.playtime)
      .slice(0, 5)
      .map((p) => ({
        label: p.name,
        value: Math.round(p.playtime / 60), // minutes
      }))
  }, [registry])

  const rangeSelectItems: SelectMenuItem[] = rangeOptions.map((r) => ({
    value: r.value,
    label: r.label,
  }))

  if (loading) return <StatisticsSkeleton />

  return (
    <div className="page-container">
      {/* Header with range selector */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Server Statistics</h3>
          <p className="text-xs text-muted mt-0.5">Long-term analytics and player insights</p>
        </div>
        <SelectMenu
          items={rangeSelectItems}
          onChange={(item) => setRange(item.value as StatsRange)}
          ariaLabel="Statistics time range"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4 statistics-grid">
        <StatCard
          label="Unique Players"
          value={summary?.totalUnique ?? '—'}
          subValue={`All time tracked`}
          icon="users"
          iconColor="var(--accent-blue)"
          bgColor="var(--bg-blue)"
        />
        <StatCard
          label="New Players"
          value={summary?.newPlayers ?? '—'}
          subValue={`Joined in last ${range}`}
          icon="plus"
          iconColor="var(--accent-green)"
          bgColor="var(--bg-green)"
        />
        <StatCard
          label="Returning Players"
          value={summary?.returningPlayers ?? '—'}
          subValue={`${summary?.retentionRate ?? 0}% retention rate`}
          icon="refresh"
          iconColor="var(--accent-purple)"
          bgColor="var(--bg-purple)"
        />
        <StatCard
          label="Avg Session"
          value={summary ? formatDuration(summary.avgSessionLength) : '—'}
          subValue={summary && summary.totalSessions > 0
            ? `Median: ${formatDuration(summary.medianSessionLength)} · Range: ${formatDuration(summary.shortestSession)} – ${formatDuration(summary.longestSession)}`
            : '—'}
          icon="clock"
          iconColor="var(--accent-orange)"
          bgColor="var(--bg-orange)"
        />
        <StatCard
          label="Total Sessions"
          value={summary?.totalSessions?.toLocaleString() ?? '—'}
          subValue={`All tracked players`}
          icon="activity"
          iconColor="var(--accent-pink)"
          bgColor="var(--bg-pink)"
        />
        <StatCard
          label="Total Playtime"
          value={summary ? formatDuration(summary.totalPlaytime) : '—'}
          subValue={`All time accumulated`}
          icon="gauge"
          iconColor="var(--accent-green)"
          bgColor="var(--bg-green)"
        />
      </div>

      {/* Daily peaks chart */}
      <div className="mb-4">
        <DailyPeaksChart data={dailyPeaks} />
      </div>

      {/* Player insights row */}
      <div className="grid grid-cols-2 gap-3 mb-4 statistics-grid">
        {/* Top sessions */}
        <div className="card statistics-chart-card">
          <p className="section-label mb-3">Top by Sessions</p>
          <BarChart
            items={topSessions}
            height={120}
            emptyMessage="No data yet"
          />
        </div>

        {/* Top playtime */}
        <div className="card statistics-chart-card">
          <p className="section-label mb-3">Top by Playtime (min)</p>
          <BarChart
            items={topPlaytime}
            height={120}
            emptyMessage="No data yet"
          />
        </div>
      </div>

      {/* Player registry table (server-side paginated) */}
      <PlayerRegistryTable filterDays={rangeDays} />
    </div>
  )
}
