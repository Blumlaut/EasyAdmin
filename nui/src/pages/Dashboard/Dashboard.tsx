import { useEffect, useMemo, useState } from 'react'
import type { RestartInfo, ServerStats, UpdateInfo } from '../../types'
import { callLua } from '../../fivem'
import { notify } from '../../lib/notify'
import { type IconName, Icon } from '../../components/icons'
import { Alert } from '../../components/Alert'
import { CopyButton } from '../../components/CopyButton'
import { StatCard, type StatCardProps } from '../../components/StatCard'
import { TimeSeriesChart, type TimeSeriesLine } from '../../components/TimeSeriesChart'
import { DoughnutChart } from '../../components/DoughnutChart'
import { useTranslation } from '../../lib/i18n'
import { PluginWidgetHost, type PluginDashboardWidget } from '../../plugins'

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
// Integrity status types
// ============================================================

interface IntegrityStatus {
  checked: boolean
  passed: boolean
  totalFiles: number
  missingHashFile?: boolean
  missingFiles?: string[]
  modifiedFiles?: string[]
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
  const { t } = useTranslation()
  const max = Math.max(vehicles, peds, objects, 1)

  const bars = [
    { label: t('Vehicles'), value: vehicles, color: 'var(--accent-blue)', icon: 'zap' as IconName },
    { label: t('Peds'), value: peds, color: 'var(--accent-orange)', icon: 'users' as IconName },
    { label: t('Objects'), value: objects, color: 'var(--accent-green)', icon: 'box' as IconName },
  ]

  return (
    <div className="card dashboard-card">
      <p className="section-label mb-3">{t("World Entities")}</p>
      <div className="flex flex-col gap-3">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-fg-subtle">{bar.label}</span>
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
    <h3 className="dashboard-greeting text-2xl font-bold">
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
  restartInfo: RestartInfo | null
  onClearRestart: () => void
  onNavigateToResources: () => void
  /** Plugin-contributed dashboard widgets (runtime, schema-rendered). */
  pluginWidgets?: Array<PluginDashboardWidget & { _pluginId: string }>
}

export function Dashboard({ playerCount, updateInfo, onDismissUpdate, restartInfo, onClearRestart, onNavigateToResources, pluginWidgets }: DashboardProps) {
  const { t } = useTranslation()
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPride] = useState(shouldShowPride)
  const [greeting] = useState(getGreeting)
  const [resourceUpdates, setResourceUpdates] = useState<OutdatedResource[]>([])
  const [integrityStatus, setIntegrityStatus] = useState<IntegrityStatus | null>(null)
  const [integrityDismissed, setIntegrityDismissed] = useState(false)
  const [countdown, setCountdown] = useState(restartInfo?.secondsRemaining ?? 0)

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

  // Request integrity status from server on mount
  useEffect(() => {
    let cancelled = false
    callLua<IntegrityStatus | null>('requestIntegrityStatus')
      .then((res) => {
        if (!cancelled && res) {
          setIntegrityStatus(res)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Countdown timer for scheduled restart
  useEffect(() => {
    if (!restartInfo) {
      setCountdown(0)
      return
    }
    setCountdown(restartInfo.secondsRemaining)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onClearRestart()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [restartInfo, onClearRestart])

  // Format countdown (seconds) into a human-readable string
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format uptime (seconds) into a human-readable string
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  // Build stat cards
  const statCards: StatCardProps[] = [
    {
      label: t('Players Online'),
      value: playerCount,
      icon: 'users',
      iconColor: 'var(--accent-green)',
      bgColor: 'var(--bg-green)',
    },
    {
      label: t('Peak Today'),
      value: stats?.peakToday ?? '—',
      icon: 'arrow-up-circle',
      iconColor: 'var(--accent-blue)',
      bgColor: 'var(--bg-blue)',
    },
    {
      label: t('Average Ping'),
      value: stats ? (stats.avgPing > 0 ? `${stats.avgPing} ms` : '—') : '—',
      icon: 'activity',
      iconColor: 'var(--accent-red)',
      bgColor: 'var(--bg-red)',
    },
    {
      label: t('Resources'),
      value: stats ? `${stats.resources.started}/${stats.resources.total}` : '—',
      icon: 'layers',
      iconColor: 'var(--accent-orange)',
      bgColor: 'var(--bg-orange)',
    },
    {
      label: t('Admins Online'),
      value: stats?.adminsOnline ?? '—',
      icon: 'shield',
      iconColor: 'var(--accent-purple)',
      bgColor: 'var(--bg-purple)',
    },
    {
      label: t('Server Uptime'),
      value: stats ? formatUptime(stats.uptime) : '—',
      icon: 'clock',
      iconColor: 'var(--accent-green)',
      bgColor: 'var(--bg-green)',
    },
    {
      label: t('Pending Reports'),
      value: stats?.pendingReports ?? '—',
      icon: 'flag',
      iconColor: 'var(--accent-purple)',
      bgColor: 'var(--bg-purple)',
    },
  ]

  // Skeleton loader
  if (loading) {
    return (
      <div className="page-container">
        <div className="dashboard-grid grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
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
        <div className="dashboard-skeleton-row flex gap-3">
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
          <h3 className="dashboard-greeting text-2xl font-bold">
            {greeting}
          </h3>
        )}

      </div>

      {/* Update notification banner */}
      {updateInfo && (
        <div className="mb-4">
          <Alert
            variant="info"
            title={t("Update available")}
            icon="download"
            action={
              <CopyButton
                value={`https://github.com/Blumlaut/EasyAdmin/releases/${updateInfo.latestVersion}`}
                label={t("Copy URL")}
                onCopy={() => notify(t('Release URL copied to clipboard'), 'success')}
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
            title={t("{count} resource(s) have updates", { count: String(resourceUpdates.length) })}
            onDismiss={() => setResourceUpdates([])}
          >
            <div className="flex flex-col gap-1">
              {resourceUpdates.map((r) => (
                <span key={r.name} className="text-sm">
                  <span className="text-mono font-medium">{r.name}</span>
                  {' '}
                  <span className="text-fg-muted">v{r.current ?? '?'} → v{r.latest}</span>
                </span>
              ))}
            </div>
            <div className="mt-2">
              <button
                className="btn btn-sm btn-ghost"
                onClick={onNavigateToResources}
              >
                <Icon name="layers" size="xs" />
                {t("View resources")}
              </button>
            </div>
          </Alert>
        </div>
      )}

      {/* Integrity check failure alert */}
      {integrityStatus && !integrityStatus.passed && !integrityDismissed && (
        <div className="mb-4">
          <Alert
            variant="error"
            title={t("Integrity check failed")}
            icon="shield-alert"
            onDismiss={() => setIntegrityDismissed(true)}
          >
            <p className="text-sm">
              {t("EasyAdmin has been modified from its original release. No support will be provided for modified builds.")}
            </p>
            {(integrityStatus.modifiedFiles && integrityStatus.modifiedFiles.length > 0) && (
              <div className="mt-2 flex flex-col gap-1">
                <span className="text-xs text-fg-muted">{t("Modified files:")}</span>
                {integrityStatus.modifiedFiles.map((f) => (
                  <span key={f} className="text-sm">
                    <span className="text-mono font-medium">{f}</span>
                  </span>
                ))}
              </div>
            )}
            {(integrityStatus.missingFiles && integrityStatus.missingFiles.length > 0) && (
              <div className="mt-2 flex flex-col gap-1">
                <span className="text-xs text-fg-muted">{t("Missing files:")}</span>
                {integrityStatus.missingFiles.map((f) => (
                  <span key={f} className="text-sm">
                    <span className="text-mono font-medium">{f}</span>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-2">
              <a
                className="btn btn-sm btn-ghost"
                href="https://github.com/Blumlaut/EasyAdmin/releases"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="download" size="xs" />
                {t("Download clean release")}
              </a>
            </div>
          </Alert>
        </div>
      )}

      {/* Scheduled restart alert (txAdmin) */}
      {restartInfo && countdown > 0 && (
        <div className="mb-4">
          <Alert
            variant="warning"
            title={t("Server restart scheduled")}
            icon="clock"
            onDismiss={onClearRestart}
          >
            <p className="text-sm">{restartInfo.message}</p>
            <p className="mt-1 text-lg font-mono font-semibold text-fg">
              {formatCountdown(countdown)}
            </p>
          </Alert>
        </div>
      )}

      {/* Stat cards row */}
      <div className="dashboard-grid grid gap-3">
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

      {/* Plugin-contributed widgets (schema-rendered) */}
      {pluginWidgets && pluginWidgets.length > 0 && (
        <div className="dashboard-grid grid gap-3">
          {pluginWidgets.map((widget) => (
            <PluginWidgetHost key={widget.id} pluginId={widget._pluginId} renderAction={widget.renderAction} />
          ))}
        </div>
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
  const { t } = useTranslation()
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
    // eslint-disable-next-line react-hooks/purity -- Date.now() is stable within a single render; recomputes only when range changes
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
      <div className="mb-3 flex items-center justify-between">
        <p className="section-label">{t("Players Over Time")}</p>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="badge badge-online">{t("{count} online", { count: String(playerCount) })}</span>
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
        emptyMessage={t("No data for this time range")}
      />
    </div>
  )
}
