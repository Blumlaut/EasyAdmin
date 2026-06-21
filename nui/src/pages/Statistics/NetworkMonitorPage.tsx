import { useEffect, useMemo, useState, useCallback } from 'react'
import type { HistoryRange, NetworkSnapshot, NetworkStatsResponse, PlayerNetworkHistoryPoint, PlayerNetworkStats } from '../../types'
import { callLua } from '../../fivem'
import { Icon, type IconName } from '../../components/icons'
import { StatCard, type StatCardProps } from '../../components/StatCard'
import { TimeSeriesChart, type TimeSeriesLine } from '../../components/TimeSeriesChart'

// ============================================================
// Thresholds for color-coding
// ============================================================

const PING_THRESHOLDS = { good: 60, warn: 120 }  // ms
const LOSS_THRESHOLDS = { good: 1, warn: 5 }       // percent

// ============================================================
// Time range presets
// ============================================================

const historyRanges: Array<{ value: HistoryRange; label: string }> = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
]

const rangeMs: Record<string, number> = {
  '1h': 3600000,
  '6h': 21600000,
  '24h': 86400000,
  '7d': 604800000,
  '30d': 2592000000,
  '90d': 7776000000,
  '120d': 10368000000,
}

// ============================================================
// Helpers
// ============================================================

function getPingVariant(rtt: number): 'good' | 'warn' | 'bad' {
  if (rtt <= PING_THRESHOLDS.good) return 'good'
  if (rtt <= PING_THRESHOLDS.warn) return 'warn'
  return 'bad'
}

function getLossVariant(loss: number): 'good' | 'warn' | 'bad' {
  if (loss <= LOSS_THRESHOLDS.good) return 'good'
  if (loss <= LOSS_THRESHOLDS.warn) return 'warn'
  return 'bad'
}

function getVariantColor(variant: 'good' | 'warn' | 'bad'): string {
  switch (variant) {
    case 'good': return 'var(--accent-green)'
    case 'warn': return 'var(--accent-orange)'
    case 'bad': return 'var(--accent-red)'
  }
}

function getVariantBg(variant: 'good' | 'warn' | 'bad'): string {
  switch (variant) {
    case 'good': return 'var(--bg-green)'
    case 'warn': return 'var(--bg-orange)'
    case 'bad': return 'var(--bg-red)'
  }
}

// ============================================================
// PlayerNetworkRow
// Clickable row in the player list
// ============================================================

interface PlayerNetworkRowProps {
  name: string
  stats: PlayerNetworkStats
  isSelected: boolean
  onSelect: () => void
}

function PlayerNetworkRow({ name, stats, isSelected, onSelect }: PlayerNetworkRowProps) {
  const pingVariant = getPingVariant(stats.rtt)
  const lossVariant = getLossVariant(stats.packetLoss)

  return (
    <button
      className={`network-row${isSelected ? ' network-row--selected' : ''}`}
      onClick={onSelect}
      title={`Click to view ${name}'s detailed stats`}
    >
      <span className="network-row-name" title={name}>{name}</span>
      <span className="network-row-cell" title="Mean RTT">
        <span
          className="network-value"
          // eslint-disable-next-line nui/no-inline-styles
          style={{ color: getVariantColor(pingVariant) }}
        >
          {stats.rtt} ms
        </span>
      </span>
      <span className="network-row-cell" title="RTT Variance (jitter)">
        {stats.rttVariance} ms
      </span>
      <span className="network-row-cell" title="Last RTT">
        {stats.lastRtt} ms
      </span>
      <span className="network-row-cell" title="Packet Loss">
        <span
          className="network-value"
          // eslint-disable-next-line nui/no-inline-styles
          style={{ color: getVariantColor(lossVariant) }}
        >
          {stats.packetLoss.toFixed(1)}%
        </span>
      </span>
      <span className="network-row-expand">
        <Icon
          name="chevron-right"
          size="xs"
          className={`network-expand-icon${isSelected ? ' network-expand-icon--open' : ''}`}
        />
      </span>
    </button>
  )
}

// ============================================================
// PlayerDetailPanel
// Unfolds below a selected player row, showing their individual chart
// ============================================================

interface PlayerDetailPanelProps {
  playerId: string
  playerName: string
  stats: PlayerNetworkStats
  range: HistoryRange
  onClose: () => void
}

function PlayerDetailPanel({ playerId, playerName, stats, range, onClose }: PlayerDetailPanelProps) {
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<PlayerNetworkHistoryPoint[]>([])

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setHistory([])
    callLua<NetworkStatsResponse>('requestNetworkStats', { playerId, range })
      .then((result) => {
        if (!cancelled && result?.playerHistory) {
          setHistory(result.playerHistory)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [playerId, range])

  const chartRange = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const end = Date.now()
    const start = end - (rangeMs[range] || 86400000)
    return { start, end }
  }, [range])

  const lines: TimeSeriesLine[] = useMemo(() => [
    {
      label: 'Ping (RTT)',
      data: history.map((d) => ({ timestamp: d.timestamp * 1000, value: d.rtt })),
      color: '#3b82f6',
      fillColor: 'rgba(59, 130, 246, 0.15)',
      unit: 'ms',
    },
    {
      label: 'Jitter',
      data: history.map((d) => ({ timestamp: d.timestamp * 1000, value: d.rttVariance })),
      color: '#f59e0b',
      fillColor: 'rgba(245, 158, 11, 0.1)',
      unit: 'ms',
    },
    {
      label: 'Loss',
      data: history.map((d) => ({ timestamp: d.timestamp * 1000, value: d.packetLoss })),
      color: '#ef4444',
      fillColor: 'rgba(239, 68, 68, 0.08)',
      unit: '%',
    },
  ], [history])

  // Compute stats from history
  const historyStats = useMemo(() => {
    if (history.length === 0) return null
    const rtts = history.map((d) => d.rtt)
    const losses = history.map((d) => d.packetLoss)
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10
    return {
      avgRtt: avg(rtts),
      maxRtt: Math.max(...rtts),
      avgLoss: avg(losses),
      maxLoss: Math.max(...losses),
      dataPoints: history.length,
    }
  }, [history])

  return (
    <div className="network-player-detail">
      <div className="network-player-detail-header">
        <span className="network-player-detail-name">
          <Icon name="users" size="xs" className="text-fg-muted" />
          {playerName}
        </span>
        <button className="btn btn-xs btn-ghost" onClick={onClose} title="Close detail">
          <Icon name="x" size="xs" />
        </button>
      </div>

      {/* Current stats badges */}
      <div className="network-player-badges">
        <span className={`badge badge-network badge-network--${getPingVariant(stats.rtt)}`}>
          {stats.rtt} ms ping
        </span>
        <span className="badge badge-network">
          {stats.rttVariance} ms jitter
        </span>
        <span className={`badge badge-network badge-network--${getLossVariant(stats.packetLoss)}`}>
          {stats.packetLoss.toFixed(1)}% loss
        </span>
      </div>

      {/* History mini-stats */}
      {historyStats && (
        <div className="network-player-history-stats">
          <span className="text-xs text-fg-muted">
            {historyStats.dataPoints} samples · Avg {historyStats.avgRtt} ms · Max {historyStats.maxRtt} ms · Loss {historyStats.avgLoss}%
          </span>
        </div>
      )}

      {/* Per-player chart */}
      <div className="network-player-chart">
        {loading ? (
          <div className="skeleton network-skeleton-player-chart" />
        ) : history.length === 0 ? (
          <div className="py-3 text-center text-fg-muted">No historical data for this player</div>
        ) : (
          <TimeSeriesChart
            lines={lines}
            range={chartRange}
            emptyMessage="No data for this time range"
          />
        )}
      </div>
    </div>
  )
}

// ============================================================
// NetworkMonitorPage
// Dedicated page: summary + global chart + player list with expandable detail
//
// Loading strategy:
// - Full layout always renders (no early return skeleton)
// - Each section has its own loading state
// - Summary cards + player table load together (live stats — fast)
// - Global chart loads separately (history — may be slow)
// - Per-player charts load lazily on expand
// ============================================================

export function NetworkMonitorPage() {
  const [stats, setStats] = useState<Record<string, PlayerNetworkStats>>({})
  const [names, setNames] = useState<Record<string, string>>({})
  const [globalHistory, setGlobalHistory] = useState<NetworkSnapshot[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const [range, setRange] = useState<HistoryRange>('24h')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'rtt' | 'packetLoss'>('rtt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Fetch stats + history in a single request.
  // The client pendingNetworkCb pattern only supports one pending request at a time,
  // so we always include range to get both current stats and history together.
  const fetchData = useCallback(() => {
    setStatsLoading(true)
    setChartLoading(true)
    callLua<NetworkStatsResponse>('requestNetworkStats', { range })
      .then((result) => {
        setStats(result?.players ?? {})
        setNames(result?.names ?? {})
        if (result?.history) {
          setGlobalHistory(result.history)
        }
      })
      .catch(() => {})
      .finally(() => {
        setStatsLoading(false)
        setChartLoading(false)
      })
  }, [range])

  // Initial fetch: stats + history together
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  // Build sorted player rows
  const playerRows = useMemo(() => {
    const entries = Object.entries(stats).map(([id, s]) => ({
      id,
      name: names[id] || `Player ${id}`,
      stats: s,
    }))

    entries.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else if (sortBy === 'rtt') {
        cmp = a.stats.rtt - b.stats.rtt
      } else {
        cmp = a.stats.packetLoss - b.stats.packetLoss
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return entries
  }, [stats, names, sortBy, sortDir])

  // Summary calculations
  const summary = useMemo(() => {
    const entries = Object.values(stats)
    if (entries.length === 0) return { avgPing: 0, worstPing: 0, avgLoss: 0, playerCount: 0 }

    let totalPing = 0
    let worstPing = 0
    let totalLoss = 0

    for (const s of entries) {
      totalPing += s.rtt
      if (s.rtt > worstPing) worstPing = s.rtt
      totalLoss += s.packetLoss
    }

    return {
      avgPing: Math.round(totalPing / entries.length),
      worstPing,
      avgLoss: Math.round((totalLoss / entries.length) * 10) / 10,
      playerCount: entries.length,
    }
  }, [stats])

  // Global chart data
  const globalChartRange = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const end = Date.now()
    const start = end - (rangeMs[range] || 86400000)
    return { start, end }
  }, [range])

  const globalLines: TimeSeriesLine[] = useMemo(() => [
    {
      label: 'Avg Ping',
      data: globalHistory.map((d) => ({ timestamp: d.timestamp * 1000, value: d.avgPing })),
      color: '#3b82f6',
      fillColor: 'rgba(59, 130, 246, 0.12)',
      unit: 'ms',
    },
    {
      label: 'Worst Ping',
      data: globalHistory.map((d) => ({ timestamp: d.timestamp * 1000, value: d.worstPing })),
      color: '#ef4444',
      fillColor: 'rgba(239, 68, 68, 0.08)',
      unit: 'ms',
    },
    {
      label: 'Avg Jitter',
      data: globalHistory.map((d) => ({ timestamp: d.timestamp * 1000, value: d.avgJitter })),
      color: '#f59e0b',
      fillColor: 'rgba(245, 158, 11, 0.1)',
      unit: 'ms',
    },
    {
      label: 'Avg Loss',
      data: globalHistory.map((d) => ({ timestamp: d.timestamp * 1000, value: d.avgLoss })),
      color: '#a855f7',
      fillColor: 'rgba(168, 85, 247, 0.08)',
      unit: '%',
    },
  ], [globalHistory])

  // Stat cards
  const statCards: StatCardProps[] = [
    {
      label: 'Players Tracked',
      value: summary.playerCount,
      icon: 'users',
      iconColor: 'var(--accent-blue)',
      bgColor: 'var(--bg-blue)',
    },
    {
      label: 'Avg Ping',
      value: `${summary.avgPing} ms`,
      icon: 'activity',
      iconColor: getVariantColor(getPingVariant(summary.avgPing)),
      bgColor: getVariantBg(getPingVariant(summary.avgPing)),
    },
    {
      label: 'Worst Ping',
      value: `${summary.worstPing} ms`,
      icon: 'alert-triangle',
      iconColor: getVariantColor(getPingVariant(summary.worstPing)),
      bgColor: getVariantBg(getPingVariant(summary.worstPing)),
    },
    {
      label: 'Avg Packet Loss',
      value: `${summary.avgLoss}%`,
      icon: 'activity',
      iconColor: getVariantColor(getLossVariant(summary.avgLoss)),
      bgColor: getVariantBg(getLossVariant(summary.avgLoss)),
    },
  ]

  // Sort header toggle
  const handleSort = (column: 'name' | 'rtt' | 'packetLoss') => {
    if (sortBy === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDir(column === 'name' ? 'asc' : 'desc')
    }
  }

  const sortIcon = (column: 'name' | 'rtt' | 'packetLoss'): IconName => {
    if (sortBy !== column) return 'chevron-down'
    return sortDir === 'asc' ? 'chevron-up' : 'chevron-down'
  }

  const selectedPlayer = selectedPlayerId
    ? { id: selectedPlayerId, name: names[selectedPlayerId] || `Player ${selectedPlayerId}`, stats: stats[selectedPlayerId] }
    : null

  // Player table row skeletons
  const skeletonRows = useMemo(() => Array.from({ length: 5 }, (_, i) => i), [])

  return (
    <div className="page-container">
      {/* Summary cards */}
      <div className="network-summary-grid mb-4 grid gap-3">
        {statsLoading
          ? skeletonRows.map((i) => (
            <div key={i} className="skeleton network-skeleton-stat" />
          ))
          : statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))
        }
      </div>

      {/* Global network chart */}
      <div className="card network-card mb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="section-label">Server Network Overview</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {historyRanges.map((r) => (
                <button
                  key={r.value}
                  className={`btn btn-xs ${range === r.value ? 'btn-primary' : 'btn-ghost'} network-range-btn`}
                  onClick={() => setRange(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              className="btn btn-xs btn-ghost network-refresh-btn"
              onClick={fetchData}
              title="Refresh now"
            >
              <Icon name="refresh" size="xs" />
            </button>
          </div>
        </div>
        {chartLoading ? (
          <div className="skeleton network-skeleton-chart" />
        ) : (
          <TimeSeriesChart
            lines={globalLines}
            range={globalChartRange}
            emptyMessage="No network data for this time range"
          />
        )}
      </div>

      {/* Player list with expandable detail */}
      <div className="card network-card">
        <div className="mb-3 flex items-center justify-between">
          <p className="section-label">Player Connections</p>
          <span className="text-xs text-fg-muted">
            Click a player to view detailed history
          </span>
        </div>

        {/* Table header */}
        <div className="network-table-header">
          <span className="network-col-name">
            <button className="network-sort-btn" onClick={() => handleSort('name')}>
              Player
              <Icon name={sortIcon('name')} size="xs" className="network-sort-icon" />
            </button>
          </span>
          <span className="network-col-ping">
            <button className="network-sort-btn" onClick={() => handleSort('rtt')}>
              Ping
              <Icon name={sortIcon('rtt')} size="xs" className="network-sort-icon" />
            </button>
          </span>
          <span className="network-col-jitter">Jitter</span>
          <span className="network-col-last">Last RTT</span>
          <span className="network-col-loss">
            <button className="network-sort-btn" onClick={() => handleSort('packetLoss')}>
              Loss
              <Icon name={sortIcon('packetLoss')} size="xs" className="network-sort-icon" />
            </button>
          </span>
          <span className="network-col-expand" />
        </div>

        {/* Player rows + detail panels */}
        <div className="network-table-body">
          {statsLoading
            ? skeletonRows.map((i) => (
              <div key={i} className="skeleton network-skeleton-row" />
            ))
            : playerRows.length === 0
              ? <div className="py-4 text-center text-fg-muted">No players connected</div>
              : playerRows.map((row) => (
                <div key={row.id}>
                  <PlayerNetworkRow
                    name={row.name}
                    stats={row.stats}
                    isSelected={selectedPlayerId === row.id}
                    onSelect={() => setSelectedPlayerId(selectedPlayerId === row.id ? null : row.id)}
                  />
                  {selectedPlayerId === row.id && selectedPlayer && (
                    <PlayerDetailPanel
                      playerId={row.id}
                      playerName={row.name}
                      stats={row.stats}
                      range={range}
                      onClose={() => setSelectedPlayerId(null)}
                    />
                  )}
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}
