import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DailyPeak, PaginatedPlayerRegistryResponse, PlayerPeakPoint, PlayerPeaksResponse, PlayerRegistryEntry, StatsSummary, StatsRange } from '../../types'
import { callLua, on } from '../../fivem'
import { Icon } from '../../components/icons'
import { StatCard } from '../../components/StatCard'
import { SearchBar } from '../../components/SearchBar'
import { useTranslation } from '../../lib/i18n'

import { TimeSeriesChart, type TimeSeriesLine } from '../../components/TimeSeriesChart'
import { BarChart } from '../../components/BarChart'
import { Pagination } from '../../components/Pagination'
import { SortableTable, type TableColumn, type SortState } from '../../components/SortableTable'
import { useDebounce } from '../../hooks/useDebounce'
import { useListKeyboardNav } from '../../hooks/useListKeyboardNav'

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
// PlayerPeaksChart
// Adaptive chart: raw 15-min snapshots for ≤7d, daily aggregates for >7d.
// Uses Chart.js for proper time-axis rendering (auto-picks tick granularity).
// ============================================================

interface PlayerPeaksChartProps {
  points: PlayerPeakPoint[]       // chart data (raw or daily)
  dailyPeaks: DailyPeak[]         // daily aggregates (for legend ping check)
  granularity: 'raw' | 'daily'
}

function PlayerPeaksChart({ points, dailyPeaks, granularity }: PlayerPeaksChartProps) {
  const { t } = useTranslation()
  const hasPing = useMemo(() => points.some((p) => p.avgPing > 0), [points])

  const lines: TimeSeriesLine[] = useMemo(() => {
    if (granularity === 'raw') {
      // Raw snapshots: single "Players" line + optional ping
      const baseLines: TimeSeriesLine[] = [
        {
          label: 'Players',
          data: points.map((p) => ({ timestamp: p.timestamp * 1000, value: p.count })),
          color: '#3b82f6',
          fillColor: 'rgba(59, 130, 246, 0.15)',
          unit: 'players',
        },
      ]
      if (hasPing) {
        baseLines.push({
          label: 'Avg Ping',
          data: points.map((p) => ({ timestamp: p.timestamp * 1000, value: p.avgPing })),
          color: '#f85149',
          fill: false,
          borderDash: [2, 2],
          unit: 'ms',
        })
      }
      return baseLines
    }

    // Daily aggregates: Max / Avg / Min + optional ping
    const baseLines: TimeSeriesLine[] = [
      {
        label: 'Max',
        data: dailyPeaks.map((d) => ({ timestamp: d.day * 1000, value: d.max })),
        color: '#3fb950',
        fillColor: 'rgba(63, 185, 80, 0.12)',
        unit: 'players',
      },
      {
        label: 'Avg',
        data: dailyPeaks.map((d) => ({ timestamp: d.day * 1000, value: d.avg })),
        color: '#3b82f6',
        fillColor: 'rgba(59, 130, 246, 0.15)',
        unit: 'players',
      },
      {
        label: 'Min',
        data: dailyPeaks.map((d) => ({ timestamp: d.day * 1000, value: d.min })),
        color: '#d29922',
        fill: false,
        borderDash: [4, 3],
        unit: 'players',
      },
    ]
    const hasDailyPing = dailyPeaks.some((d) => d.avgPing > 0)
    if (hasDailyPing) {
      baseLines.push({
        label: 'Avg Ping',
        data: dailyPeaks.map((d) => ({ timestamp: d.day * 1000, value: d.avgPing })),
        color: '#f85149',
        fill: false,
        borderDash: [2, 2],
        unit: 'ms',
      })
    }
    return baseLines
  }, [points, dailyPeaks, granularity, hasPing])

  const chartRange = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- Date.now() is stable within a single render; fallback only used when no data exists
    if (points.length === 0) return { start: Date.now() - 86400000 * 7, end: Date.now() }
    const timestamps = points.map((p) => p.timestamp * 1000)
    return {
      start: Math.min(...timestamps) - 43200000, // 12h padding
      end: Math.max(...timestamps) + 43200000,
    }
  }, [points])

  return (
    <div className="card statistics-chart-card">
      <div className="mb-3 flex items-center justify-between">
        <p className="section-label">{t(granularity === 'raw' ? 'Player Activity' : 'Daily Player Peaks')}</p>
        <div className="flex items-center gap-3 text-xs text-fg-muted">
          {granularity === 'raw' ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="legend-line legend-line--blue" />
                {t("Players")}
              </span>
              {hasPing && (
                <span className="flex items-center gap-1.5">
                  <span className="legend-line legend-line-dotted legend-line--red" />
                  {t("Avg Ping")}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <span className="legend-line legend-line--green" />
                {t("Max")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="legend-line legend-line--blue" />
                {t("Avg")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="legend-line legend-line-dashed legend-line--orange" />
                {t("Min")}
              </span>
              {dailyPeaks.some((d) => d.avgPing > 0) && (
                <span className="flex items-center gap-1.5">
                  <span className="legend-line legend-line-dotted legend-line--red" />
                  {t("Avg Ping")}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      <TimeSeriesChart
        lines={lines}
        range={chartRange}
        height={200}
        showLegend={false}
        unit="players"
        emptyMessage={t("No data for this time range")}
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

type RegistrySortBy = 'sessions' | 'playtime' | 'lastSeen' | 'firstSeen' | 'avgSession'

function PlayerRegistryTable({ filterDays }: { filterDays: number }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<RegistrySortBy>('lastSeen')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [players, setPlayers] = useState<PlayerRegistryEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  useListKeyboardNav(listRef, players.length)

  const fetchPage = useCallback((p: number, q: string, sort: RegistrySortBy, dir: 'asc' | 'desc') => {
    setLoading(true)
    callLua('requestPlayerRegistryPage', { page: p, pageSize: REGISTRY_PAGE_SIZE, query: q, sortBy: sort, sortDir: dir, filterDays })
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
    fetchPage(1, '', 'lastSeen', 'desc')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refetch when debounced search changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
    fetchPage(1, debouncedQuery, sortBy, sortDir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  // Refetch when sort changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
    fetchPage(1, debouncedQuery, sortBy, sortDir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortDir])

  const handlePageChange = useCallback((p: number) => {
    setPage(p)
    fetchPage(p, debouncedQuery, sortBy, sortDir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, sortBy, sortDir])

  const handleFirstPage = useCallback(() => handlePageChange(1), [handlePageChange])
  const handleLastPage = useCallback(() => handlePageChange(totalPages), [handlePageChange, totalPages])
  const handleNextPage = useCallback(() => handlePageChange(Math.min(page + 1, totalPages)), [handlePageChange, page, totalPages])
  const handlePrevPage = useCallback(() => handlePageChange(Math.max(page - 1, 1)), [handlePageChange, page])

  const handleRefresh = useCallback(() => {
    fetchPage(page, debouncedQuery, sortBy, sortDir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedQuery, sortBy, sortDir])

  const handleSortChange = useCallback((state: SortState) => {
    setSortBy(state.sortBy as RegistrySortBy)
    setSortDir(state.sortDir)
  }, [])

  const columns = useMemo<TableColumn<PlayerRegistryEntry>[]>(() => [
    {
      key: 'name',
      label: t('Player'),
      render: (p) => <span className="max-w-[160px] truncate" title={p.name}>{p.name}</span>,
    },
    {
      key: 'firstSeen',
      label: t('First Seen'),
      sortable: true,
      render: (p) => <span className="text-xs text-fg-muted">{formatDayLabelFull(p.firstSeen / 1000)}</span>,
    },
    {
      key: 'lastSeen',
      label: t('Last Seen'),
      sortable: true,
      render: (p) => <span className="text-xs text-fg-muted">{formatDayLabelFull(p.lastSeen / 1000)}</span>,
    },
    {
      key: 'sessions',
      label: t('Sessions'),
      sortable: true,
      render: (p) => <span className="text-xs font-semibold">{p.sessions}</span>,
    },
    {
      key: 'playtime',
      label: t('Total Playtime'),
      sortable: true,
      render: (p) => <span className="text-xs">{formatDuration(p.playtime)}</span>,
    },
    {
      key: 'avgSession',
      label: t('Avg Session'),
      sortable: true,
      render: (p) => <span className="text-xs">{p.sessions > 0 ? formatDuration(p.playtime / p.sessions) : '—'}</span>,
    },
  ], [t])

  return (
    <div>
      <div className="card statistics-chart-card">
        <p className="section-label mb-3">{t("Player Registry")}</p>
        <div className="mb-3 flex items-center gap-2">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={t("Search by name...")}
            resultCount={players.length > 0 ? { shown: players.length, total: total } : undefined}
            ariaLabel={t("Search player registry")}
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

        {loading && players.length === 0 ? (
          <div className="flex min-h-100 items-center justify-center">
            <p className="text-xs text-fg-muted">{t("Loading player data…")}</p>
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="empty-state-icon empty-state-icon-blue mb-3">
              <Icon name="users" size="lg" className="text-blue" />
            </div>
            <p className="text-sm text-fg-muted">{total === 0 ? t("No player data collected yet") : t("No players match your search")}</p>
            {total === 0 && <p className="mt-1 text-xs text-fg-muted">{t("Players will appear here after connecting")}</p>}
          </div>
        ) : (
          <div ref={listRef}>
            <SortableTable
              columns={columns}
              rows={players}
              sortBy={sortBy}
              sortDir={sortDir}
              onSortChange={handleSortChange}
              getKey={(p) => p.identifier}
            />
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
    <>
      {/* Summary cards skeleton — matches StatCard overlay variant */}
      <div className="statistics-grid mb-4 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card statistics-card overflow-hidden">
            <div className="skeleton skeleton--sm skeleton--w-55" />
            <div className="skeleton skeleton--xl skeleton--w-40 mt-1" />
            <div className="skeleton skeleton--sm skeleton--w-70 mt-0.5" />
            <div className="skeleton skeleton--icon skeleton--absolute-top-right" />
          </div>
        ))}
      </div>
      {/* Daily peaks chart skeleton */}
      <div className="mb-4">
        <div className="card statistics-chart-card">
          <div className="mb-3 flex items-center justify-between">
            <div className="skeleton skeleton--md skeleton--w-120" />
            <div className="flex items-center gap-3">
              <div className="skeleton skeleton--sm skeleton--w-28" />
              <div className="skeleton skeleton--sm skeleton--w-24" />
              <div className="skeleton skeleton--sm skeleton--w-24" />
            </div>
          </div>
          <div className="skeleton skeleton--chart" />
        </div>
      </div>
      {/* Bar charts skeleton */}
      <div className="statistics-grid mb-4 grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="card statistics-chart-card">
            <div className="skeleton skeleton--md skeleton--w-45 mb-3" />
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="skeleton skeleton--sm skeleton--w-90 shrink-0" />
                  {/* eslint-disable-next-line nui/no-inline-styles -- random width for visual variety in skeleton loader */}
                  <div className="skeleton skeleton--lg skeleton--pill" style={{ width: `${60 + Math.random() * 35}%` }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Player registry table skeleton */}
      <div className="card statistics-chart-card">
        {/* eslint-disable-next-line nui/no-inline-styles -- unique skeleton dimension */}
        <div className="skeleton skeleton--md mb-3" style={{ width: '25%' }} />
        <div className="mb-3 flex items-center gap-2">
          {/* eslint-disable-next-line nui/no-inline-styles -- unique skeleton dimension */}
          <div className="skeleton skeleton--w-240" style={{ height: '36px', borderRadius: '8px' }} />
          {/* eslint-disable-next-line nui/no-inline-styles -- unique skeleton dimension */}
          <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: '8px' }} />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            // eslint-disable-next-line nui/no-inline-styles -- unique skeleton dimension
            <div key={i} className="skeleton skeleton--w-full" style={{ height: '28px' }} />
          ))}
        </div>
      </div>
    </>
  )
}

// ============================================================
// StatisticsPage
// ============================================================

export function PlayerStatisticsPage() {
  const { t } = useTranslation()
  const [range, setRange] = useState<StatsRange>('30d')
  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [peaks, setPeaks] = useState<PlayerPeaksResponse | null>(null)
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

  // Listen for peaks results pushed from Lua
  useEffect(() => {
    return on<PlayerPeaksResponse>('dailyPeaks', (data) => {
      if (currentRangeVer.current === rangeVer.current) {
        setPeaks(data)
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting state before async fetch is the standard data-fetching pattern
    setLoading(true)
    setSummary(null)
    setPeaks(null)
    callLua('requestStatsSummary', { range }).catch(() => {})
    callLua('requestDailyPeaks', { range }).catch(() => {})
  }, [range])

  // Fire registry request for bar chart data when range days changes.
  // This is kept for the top-N bar charts; the table uses pagination separately.
  useEffect(() => {
    const ver = ++registryVer.current
    currentRegistryVer.current = ver
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting state before async fetch is the standard data-fetching pattern
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

  return (
    <div className="page-container">
      {/* Header with range selector */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("Player Statistics")}</h3>
          <p className="mt-0.5 text-xs text-fg-muted">{t("Long-term analytics and player insights")}</p>
        </div>
        <div className="flex items-center gap-0.5">
          {rangeOptions.map((r) => (
            <button
              key={r.value}
              className={`btn btn-xs ${range === r.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <StatisticsSkeleton />
      ) : (
        <>
          {/* Summary cards */}
          <div className="statistics-grid mb-4 grid grid-cols-2 gap-3">
        <StatCard variant="overlay"
          label={t("Unique Players")}
          value={summary?.totalUnique ?? '—'}
          subValue={t("All time tracked")}
          icon="users"
          iconColor="var(--accent-blue)"
          bgColor="var(--bg-blue)"
        />
        <StatCard variant="overlay"
          label={t("New Players")}
          value={summary?.newPlayers ?? '—'}
          subValue={t("Joined in last {range}", { range })}
          icon="plus"
          iconColor="var(--accent-green)"
          bgColor="var(--bg-green)"
        />
        <StatCard variant="overlay"
          label={t("Returning Players")}
          value={summary?.returningPlayers ?? '—'}
          subValue={t("{rate}% retention rate", { rate: String(summary?.retentionRate ?? 0) })}
          icon="refresh"
          iconColor="var(--accent-purple)"
          bgColor="var(--bg-purple)"
        />
        <StatCard variant="overlay"
          label={t("Avg Session")}
          value={summary ? formatDuration(summary.avgSessionLength) : '—'}
          subValue={summary && summary.totalSessions > 0
            ? t("Median: {median} · Range: {shortest} – {longest}", { median: formatDuration(summary.medianSessionLength), shortest: formatDuration(summary.shortestSession), longest: formatDuration(summary.longestSession) })
            : '—'}
          icon="clock"
          iconColor="var(--accent-orange)"
          bgColor="var(--bg-orange)"
        />
        <StatCard variant="overlay"
          label={t("Total Sessions")}
          value={summary?.totalSessions?.toLocaleString() ?? '—'}
          subValue={t("All tracked players")}
          icon="activity"
          iconColor="var(--accent-pink)"
          bgColor="var(--bg-pink)"
        />
        <StatCard variant="overlay"
          label={t("Total Playtime")}
          value={summary ? formatDuration(summary.totalPlaytime) : '—'}
          subValue={t("All time accumulated")}
          icon="gauge"
          iconColor="var(--accent-green)"
          bgColor="var(--bg-green)"
        />
      </div>

      {/* Player peaks chart (adaptive granularity) */}
      {peaks && (
        <div className="mb-4">
          <PlayerPeaksChart
            points={peaks.points}
            dailyPeaks={peaks.dailyPeaks}
            granularity={peaks.granularity}
          />
        </div>
      )}

      {/* Player insights row */}
      <div className="statistics-grid mb-4 grid grid-cols-2 gap-3">
        {/* Top sessions */}
        <div className="card statistics-chart-card">
          <p className="section-label mb-3">{t("Top by Sessions")}</p>
          <BarChart
            items={topSessions}
            height={120}
            emptyMessage={t("No data yet")}
          />
        </div>

        {/* Top playtime */}
        <div className="card statistics-chart-card">
          <p className="section-label mb-3">{t("Top by Playtime (min)")}</p>
          <BarChart
            items={topPlaytime}
            height={120}
            emptyMessage={t("No data yet")}
          />
        </div>
      </div>

      {/* Player registry table (server-side paginated) */}
      <PlayerRegistryTable filterDays={rangeDays} />
        </>
      )}
    </div>
  )
}
