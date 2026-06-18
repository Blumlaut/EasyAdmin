import { useEffect, useMemo, useState } from 'react'
import type { ServerStats, UpdateInfo } from '../../types'
import { callLua } from '../../fivem'
import { type IconName, Icon } from '../../components/icons'
import { Alert } from '../../components/Alert'
import { CopyButton } from '../../components/CopyButton'
import { StatCard, type StatCardProps } from '../../components/StatCard'
import { TimeSeriesChart, type TimeSeriesLine } from '../../components/TimeSeriesChart'
import { DoughnutChart } from '../../components/DoughnutChart'

// ============================================================
// Resource update summary types
// ============================================================

interface OutdatedResource {
  name: string
  current: string | null
  latest: string
}

interface ResourceUpdateSummary {
  outdated: OutdatedResource[]
}

// ============================================================
// EntityBar
// Horizontal bar showing entity counts
// ============================================================

interface EntityBarProps {
  vehicles: number
  peds: number
  objects: number
}

function EntityBars({ vehicles, peds, objects }: EntityBarProps) {
  const max = Math.max(vehicles, peds, objects, 1)

  const bars = [
    { label: 'Vehicles', value: vehicles, color: 'var(--accent-blue)', icon: 'zap' as IconName },
    { label: 'Peds', value: peds, color: 'var(--accent-orange)', icon: 'users' as IconName },
    { label: 'Objects', value: objects, color: 'var(--accent-green)', icon: 'box' as IconName },
  ]

  return (
    <div className="card dashboard-card">
      <p className="section-label mb-3">World Entities</p>
      <div className="flex flex-col gap-3">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-secondary">{bar.label}</span>
              <span className="text-xs font-semibold"
                // eslint-disable-next-line nui/no-inline-styles
                style={{ color: bar.color }}
              >
                {bar.value.toLocaleString()}
              </span>
            </div>
            <div className="dashboard-bar-track">
              <div className="dashboard-bar-fill"
                // eslint-disable-next-line nui/no-inline-styles
                style={{
                  width: `${Math.max((bar.value / max) * 100, 2)}%`,
                  background: bar.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Time-dependent greeting
// ============================================================

const greetings: Array<[number, string[]]> = [
  // 00:00 - 05:59: late night / early morning
  [6, [
    'Just one more ban before bed?',
    'The server sleeps, but you don\'t?',
    'Night shift moderation. Respect.',
    'Even the bots are offline by now.',
  ]],
  // 06:00 - 09:59: morning
  [10, [
    'Good morning! Fresh coffee, fresh bans.',
    'Rise and shine, moderator.',
    'Morning shift, let\'s clean this server up.',
    'Good morning! The server missed you.',
  ]],
  // 10:00 - 16:59: day
  [17, [
    'Hi there! Server looking good today.',
    'Afternoon moderation, you got this.',
    'Hope your shift is going smoothly.',
    'Dashboard loaded, let\'s get to work.',
  ]],
  // 17:00 - 21:59: evening
  [22, [
    'Evening shift, nice work.',
    'Evening moderation, the troublemakers come out now.',
    'Good evening! Time to watch the chat.',
    'Evening shift loaded and ready.',
  ]],
  // 22:00 - 23:59: late evening
  [-1, [
    'Late evening moderation?',
    'Still here? Impressive dedication.',
    'Late night patrol, stay sharp.',
    'The night owls are online now.',
  ]],
]

function getGreeting(): string {
  const hour = new Date().getHours()
  for (const [cutoff, messages] of greetings) {
    if (cutoff === -1 || hour < cutoff) {
      return messages[Math.floor(Math.random() * messages.length)]
    }
  }
  return 'Hi there!'
}

// Pride Month: 1 in 3 chance during June
function isPrideMonth(): boolean {
  return new Date().getMonth() === 5 // June (0-indexed)
}

function shouldShowPride(): boolean {
  return isPrideMonth() && Math.random() < 1 / 3
}

const prideColors = ['#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787']

function PrideGreeting() {
  const text = 'Happy Pride!'
  const stops = prideColors.map((color, i) => `${color} ${(i / (prideColors.length - 1)) * 100}%`)
  return (
    <h3 className="text-2xl font-bold dashboard-greeting">
      <span
        // eslint-disable-next-line nui/no-inline-styles
        style={{
          background: `linear-gradient(90deg, ${stops.join(', ')})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {text}
      </span>
    </h3>
  )
}

// ============================================================
// Dashboard
// ============================================================

interface DashboardProps {
  playerCount: number
  updateInfo: UpdateInfo | null
  onDismissUpdate: () => void
  onToast: (text: string, type?: 'info' | 'success' | 'error') => void
  onNavigateToResources: () => void
}

export function Dashboard({ playerCount, updateInfo, onDismissUpdate, onToast, onNavigateToResources }: DashboardProps) {
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPride] = useState(shouldShowPride)
  const [greeting] = useState(getGreeting)
  const [resourceUpdates, setResourceUpdates] = useState<OutdatedResource[]>([])

  // Fetch server stats on mount
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    callLua<ServerStats>('requestServerStats')
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Request update info from server on mount
  useEffect(() => {
    callLua('requestUpdateInfo').catch(() => {})
  }, [])

  // Request cached resource update summary on mount
  useEffect(() => {
    let cancelled = false
    callLua<ResourceUpdateSummary>('requestResourceUpdateSummary')
      .then((res) => {
        if (!cancelled && res?.outdated && res.outdated.length > 0) {
          setResourceUpdates(res.outdated)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Build stat cards
  const statCards: StatCardProps[] = [
    {
      label: 'Players Online',
      value: playerCount,
      icon: 'users',
      iconColor: 'var(--accent-green)',
      bgColor: 'var(--bg-green)',
    },
    {
      label: 'Resources',
      value: stats ? `${stats.resources.started}/${stats.resources.total}` : '—',
      icon: 'layers',
      iconColor: 'var(--accent-blue)',
      bgColor: 'var(--bg-blue)',
    },
    {
      label: 'Resources Stopped',
      value: stats?.resources.stopped ?? '—',
      icon: 'user-minus',
      iconColor: 'var(--accent-orange)',
      bgColor: 'var(--bg-orange)',
    },
    {
      label: 'Active Entities',
      value: stats
        ? (stats.entities.vehicles + stats.entities.peds + stats.entities.objects).toLocaleString()
        : '—',
      icon: 'box',
      iconColor: 'var(--accent-purple)',
      bgColor: 'var(--bg-purple)',
    },
  ]

  // Skeleton loader
  if (loading) {
    return (
      <div className="page-container">
        <div className="grid grid-cols-2 gap-3 dashboard-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card dashboard-card-sm">
              <div className="flex items-center gap-3">
                <div className="skeleton dashboard-skeleton-icon" />
                <div className="flex-1">
                  <div className="skeleton dashboard-skeleton-label" />
                  <div className="skeleton dashboard-skeleton-value" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 dashboard-skeleton-row">
          <div className="skeleton card dashboard-skeleton-card" />
          <div className="skeleton card dashboard-skeleton-chart" />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Greeting */}
      <div className="mb-5">
        {showPride ? <PrideGreeting /> : (
          <h3 className="text-2xl font-bold dashboard-greeting">
            {greeting}
          </h3>
        )}
        <div className="flex gap-2 mt-2">
          <button className="btn btn-xs btn-ghost" onClick={() => onToast('Info toast test', 'info')}>Test info</button>
          <button className="btn btn-xs btn-ghost" onClick={() => onToast('Success toast test', 'success')}>Test success</button>
          <button className="btn btn-xs btn-ghost" onClick={() => onToast('Error toast test', 'error')}>Test error</button>
        </div>
      </div>

      {/* Update notification banner */}
      {updateInfo && (
        <div className="mb-4">
          <Alert
            variant="info"
            title="Update available"
            icon="download"
            action={
              <CopyButton
                value={`https://github.com/Blumlaut/EasyAdmin/releases/${updateInfo.latestVersion}`}
                label="Copy URL"
                onCopy={() => onToast('Release URL copied to clipboard', 'success')}
              />
            }
            onDismiss={onDismissUpdate}
          >
            <span>
              EasyAdmin {updateInfo.latestVersion} is available (you have {updateInfo.currentVersion}).
            </span>
          </Alert>
        </div>
      )}

      {/* Resource updates alert */}
      {resourceUpdates.length > 0 && (
        <div className="mb-4">
          <Alert
            variant="warning"
            title={`${resourceUpdates.length} resource(s) have updates available`}
            onDismiss={() => setResourceUpdates([])}
          >
            <div className="flex flex-col gap-1">
              {resourceUpdates.map((r) => (
                <span key={r.name} className="text-sm">
                  <span className="font-medium text-mono">{r.name}</span>
                  {' '}
                  <span className="text-muted">v{r.current ?? '?'} → v{r.latest}</span>
                </span>
              ))}
            </div>
            <div className="mt-2">
              <button
                className="btn btn-sm btn-ghost"
                onClick={onNavigateToResources}
              >
                <Icon name="layers" size="xs" />
                View resources
              </button>
            </div>
          </Alert>
        </div>
      )}

      {/* Stat cards row */}
      <div className="grid gap-3 dashboard-grid">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts row */}
      <div className="dashboard-charts-grid">
        <DoughnutChart
          value={playerCount}
          max={stats?.maxPlayers ?? 48}
          subLabel={`${(stats?.maxPlayers ?? 48) - playerCount} slots available`}
          className="dashboard-card"
        />

        <PlayerSparkline playerCount={playerCount} />
      </div>

      {/* Entity bars */}
      {stats && (
        <EntityBars
          vehicles={stats.entities.vehicles}
          peds={stats.entities.peds}
          objects={stats.entities.objects}
        />
      )}
    </div>
  )
}

// ============================================================
// PlayerSparkline
// Fetches player count history from the server with time range filters.
// Uses Chart.js for proper time-axis rendering — shows full range
// even when data is sparse or absent.
// ============================================================

const historyRanges: Array<{ value: '1h' | '6h' | '24h' | '7d'; label: string }> = [
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
}

interface PlayerSparklineProps {
  playerCount: number
}

function PlayerSparkline({ playerCount }: PlayerSparklineProps) {
  const [data, setData] = useState<Array<{ timestamp: number; count: number }>>([])
  const [range, setRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h')
  const [loading, setLoading] = useState(true)

  // Fetch history when range changes
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    callLua<Array<{ timestamp: number; count: number }>>('requestPlayerHistory', { range })
      .then((result) => {
        if (!cancelled && result) {
          // Server sends unix seconds; frontend expects milliseconds
          setData(result.map((p) => ({ timestamp: p.timestamp * 1000, count: p.count })))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [range])

  // Build time range for the chart axis
  const chartRange = useMemo(() => {
    const end = Date.now()
    const start = end - (rangeMs[range] || 86400000)
    return { start, end }
  }, [range])

  // Build Chart.js line data (map count → value)
  const lines: TimeSeriesLine[] = useMemo(() => [
    {
      label: 'Players',
      data: data.map((d) => ({ timestamp: d.timestamp, value: d.count })),
      color: '#3b82f6',
      fillColor: 'rgba(59, 130, 246, 0.18)',
    },
  ], [data])

  return (
    <div className="card dashboard-card flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="section-label">Players Over Time</p>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="badge badge-online">{playerCount} online</span>
          )}
          <div className="flex items-center gap-0.5">
            {historyRanges.map((r) => (
              <button
                key={r.value}
                className={`btn btn-xs ${range === r.value ? 'btn-primary' : 'btn-ghost'} dashboard-range-btn`}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <TimeSeriesChart
        lines={lines}
        range={chartRange}
        unit="players"
        emptyMessage="No data for this time range"
      />
    </div>
  )
}
