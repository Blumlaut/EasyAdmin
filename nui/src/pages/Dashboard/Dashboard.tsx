import { useEffect, useState } from 'react'
import type { ServerStats } from '../../types'
import { callLua } from '../../fivem'
import { Icon, type IconName } from '../../components/icons'

// ============================================================
// Types
// ============================================================

interface StatCardConfig {
  label: string
  value: string | number
  icon: IconName
  color: string
  bgColor: string
}

// ============================================================
// CircularProgressGauge
// SVG donut showing a percentage (e.g. player capacity)
// ============================================================

interface CircularProgressGaugeProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  subLabel?: string
}

function CircularProgressGauge({
  value,
  max,
  size = 160,
  strokeWidth = 10,
  subLabel,
}: CircularProgressGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circumference * (1 - pct)
  const pctText = max > 0 ? Math.round(pct * 100) : 0

  // Color based on capacity
  let strokeColor = 'var(--accent-green)'
  if (pct >= 0.9) strokeColor = 'var(--accent-red)'
  else if (pct >= 0.7) strokeColor = 'var(--accent-orange)'

  return (
    <div className="card flex flex-col items-center justify-center dashboard-card">
      <p className="section-label mb-2">Player Capacity</p>
      <div className="flex-1 flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-hover)"
          strokeWidth={strokeWidth}
        />
        {/* Foreground arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="dashboard-gauge-arc"
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2 - 8}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-primary)"
          className="dashboard-gauge-value"
        >
          {value}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-muted)"
          className="dashboard-gauge-max"
        >
          / {max}
        </text>
      </svg>
        </div>
      {/* eslint-disable-next-line nui/no-inline-styles */}
      <p className="text-sm font-semibold mt-3" style={{ color: strokeColor }}>
        {pctText}% full
      </p>
      {subLabel && <p className="text-xs text-muted mt-1">{subLabel}</p>}
    </div>
  )
}

// ============================================================
// SparklineChart
// Simple SVG sparkline showing values over time
// ============================================================

interface SparklineChartProps {
  data: { timestamp: number; count: number }[]
  label: string
  current?: number
  height?: number
  range?: string
  onRangeChange?: (range: string) => void
  ranges?: Array<{ value: string; label: string }>
}

function SparklineChart({ data, label, current, height = 120, range, onRangeChange, ranges }: SparklineChartProps) {
  if (data.length < 2) {
    return (
      <div className="card dashboard-card">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">{label}</p>
          <div className="flex items-center gap-2">
            {current !== undefined && (
              <span className="badge badge-online">{current} online</span>
            )}
            {ranges && onRangeChange && (
              <div className="flex items-center gap-0.5">
                {ranges.map((r) => (
                  <button
                    key={r.value}
                    className={`btn btn-xs ${range === r.value ? 'btn-primary' : 'btn-ghost'} dashboard-range-btn`}
                    onClick={() => onRangeChange(r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center dashboard-sparkline-container">
          <p className="text-xs text-muted">Tracking player activity…</p>
        </div>
      </div>
    )
  }

  const width = 400
  const padding = { top: 8, bottom: 20, left: 4, right: 4 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const maxVal = Math.max(...data.map((d) => d.count), 1)
  const minVal = Math.min(...data.map((d) => d.count), 0)
  const valueRange = maxVal - minVal || 1

  // Build SVG path
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW
    const y = padding.top + chartH - ((d.count - minVal) / valueRange) * chartH
    return { x, y }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`

  // Time labels
  const timeLabels: { label: string; x: number }[] = []
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  if (data.length >= 2) {
    const firstTs = data[0].timestamp
    const lastTs = data[data.length - 1].timestamp
    const span = lastTs - firstTs

    if (span > 0) {
      // Show 3-4 time labels
      const steps = Math.min(4, data.length - 1)
      for (let i = 0; i <= steps; i++) {
        const idx = Math.round((i / steps) * (data.length - 1))
        const ago = Math.round((now - data[idx].timestamp) / 60000)
        let label: string
        if (ago < 1) label = 'now'
        else if (ago < 60) label = `${ago}m ago`
        else label = `${Math.floor(ago / 60)}h ago`
        timeLabels.push({ label, x: points[idx].x })
      }
    }
  }

  return (
    <div className="card dashboard-card">
      <div className="flex items-center justify-between mb-3">
        <p className="section-label">{label}</p>
        <div className="flex items-center gap-2">
          {current !== undefined && (
            <span className="badge badge-online">{current} online</span>
          )}
          {ranges && onRangeChange && (
            <div className="flex items-center gap-0.5">
              {ranges.map((r) => (
                <button
                  key={r.value}
                  className={`btn btn-xs ${range === r.value ? 'btn-primary' : 'btn-ghost'} dashboard-range-btn`}
                  onClick={() => onRangeChange(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="dashboard-sparkline-svg">
        <defs>
          <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-blue-light)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--brand-blue-light)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path d={areaPath} fill="url(#sparklineGrad)" />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--brand-blue-light)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots on first and last point */}
        {points.length > 1 && (
          <>
            <circle cx={points[0].x} cy={points[0].y} r="3" fill="var(--brand-blue-light)" />
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill="var(--brand-blue-light)" />
          </>
        )}
        {/* Time labels */}
        {timeLabels.map((tl, i) => (
          <text
            key={i}
            x={tl.x}
            y={height - 2}
            textAnchor="middle"
            fill="var(--text-muted)"
            className="dashboard-gauge-label"
          >
            {tl.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ============================================================
// StatCard
// Small metric card with icon, label, value
// ============================================================

function StatCard({ config }: { config: StatCardConfig }) {
  return (
    <div className="card dashboard-card-sm">
      <div className="flex items-center gap-3">
        <div
          className="dashboard-stat-icon"
          // eslint-disable-next-line nui/no-inline-styles
          style={{ background: config.bgColor }}
        >
          <Icon name={config.icon} size="sm"
            // eslint-disable-next-line nui/no-inline-styles
            style={{ color: config.color }}
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted dashboard-stat-label">{config.label}</p>
          <p className="text-xl font-bold dashboard-stat-value">
            {config.value}
          </p>
        </div>
      </div>
    </div>
  )
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
}

export function Dashboard({ playerCount }: DashboardProps) {
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPride] = useState(shouldShowPride)
  const [greeting] = useState(getGreeting)

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

  // Build stat cards
  const statCards: StatCardConfig[] = [
    {
      label: 'Players Online',
      value: playerCount,
      icon: 'users',
      color: 'var(--accent-green)',
      bgColor: 'var(--bg-green)',
    },
    {
      label: 'Resources',
      value: stats ? `${stats.resources.started}/${stats.resources.total}` : '—',
      icon: 'layers',
      color: 'var(--accent-blue)',
      bgColor: 'var(--bg-blue)',
    },
    {
      label: 'Resources Stopped',
      value: stats?.resources.stopped ?? '—',
      icon: 'user-minus',
      color: 'var(--accent-orange)',
      bgColor: 'var(--bg-orange)',
    },
    {
      label: 'Active Entities',
      value: stats
        ? (stats.entities.vehicles + stats.entities.peds + stats.entities.objects).toLocaleString()
        : '—',
      icon: 'box',
      color: 'var(--accent-purple)',
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
      </div>

      {/* Stat cards row */}
      <div className="grid gap-3 dashboard-grid">
        {statCards.map((card) => (
          <StatCard key={card.label} config={card} />
        ))}
      </div>

      {/* Charts row */}
      <div className="dashboard-charts-grid">
        <CircularProgressGauge
          value={playerCount}
          max={stats?.maxPlayers ?? 48}
          subLabel={`${(stats?.maxPlayers ?? 48) - playerCount} slots available`}
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
// Fetches player count history from the server with time range filters
// ============================================================

const historyRanges: Array<{ value: '1h' | '6h' | '24h' | '7d'; label: string }> = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
]

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

  return (
    <SparklineChart
      data={data}
      label="Players Over Time"
      current={playerCount}
      range={loading ? undefined : range}
      onRangeChange={(r) => setRange(r as '1h' | '6h' | '24h' | '7d')}
      ranges={historyRanges}
    />
  )
}
