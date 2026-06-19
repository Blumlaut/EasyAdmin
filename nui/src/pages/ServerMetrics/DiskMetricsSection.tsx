import { useMemo } from 'react'
import type { MetricsRange } from '../../types'
import { TimeSeriesChart, type TimeSeriesLine } from '../../components/TimeSeriesChart'
import { StatCard } from '../../components/StatCard'
import { Icon } from '../../components/icons'

// ============================================================
// Range ms mapping
// ============================================================

const rangeMs: Record<string, number> = {
  '1h': 3600000,
  '6h': 21600000,
  '24h': 86400000,
  '7d': 604800000,
  '30d': 2592000000,
}

// ============================================================
// DiskDriveBar
// ============================================================

function DiskDriveBar({ drive }: { drive: { path: string; device: string; totalGB: number; usedGB: number; freeGB: number; usagePercent: number } }) {
  const barClass = drive.usagePercent > 90
    ? 'metrics-bar-critical'
    : drive.usagePercent > 70
      ? 'metrics-bar-warning'
      : ''

  return (
    <div className="metrics-drive-row">
      <div className="metrics-drive-info">
        <span className="metrics-drive-path" title={drive.path}>{drive.path}</span>
        <span className="metrics-drive-device">{drive.device}</span>
      </div>
      <div className="metrics-drive-bar">
        <div className="metrics-bar-track metrics-bar-track-sm">
          <div className={`metrics-bar-fill ${barClass}`} style={{ width: `${Math.min(drive.usagePercent, 100)}%` }} />
        </div>
        <span className="metrics-drive-percent">{drive.usagePercent}%</span>
      </div>
      <div className="metrics-drive-stats">
        <span>{drive.usedGB} GB / {drive.totalGB} GB</span>
        <span className="text-muted">{drive.freeGB} GB free</span>
      </div>
    </div>
  )
}

// ============================================================
// DiskMetricsSection
// ============================================================

interface DiskMetricsSectionProps {
  snapshots: Array<{ timestamp: number; drives: Array<{ path: string; device: string; totalGB: number; usedGB: number; freeGB: number; usagePercent: number }> }>
  current: { drives: Array<{ path: string; device: string; totalGB: number; usedGB: number; freeGB: number; usagePercent: number }> } | null
  range: MetricsRange
  loading: boolean
}

export function DiskMetricsSection({ snapshots, current, range, loading }: DiskMetricsSectionProps) {
  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null
  const drives = current?.drives ?? latest?.drives ?? []

  // Total disk stats
  const diskStats = useMemo(() => {
    const total = drives.reduce((acc, d) => acc + d.totalGB, 0)
    const used = drives.reduce((acc, d) => acc + d.usedGB, 0)
    const free = drives.reduce((acc, d) => acc + d.freeGB, 0)
    const pct = total > 0 ? (used / total) * 100 : 0
    return { total, used, free, pct }
  }, [drives])

  // Chart: total used GB over time (aggregate across all drives)
  const lines: TimeSeriesLine[] = useMemo(() => {
    if (snapshots.length === 0) return []
    return [
      {
        label: 'Total Used GB',
        data: snapshots.map((s) => ({
          timestamp: s.timestamp * 1000,
          value: s.drives.reduce((acc, d) => acc + d.usedGB, 0),
        })),
        color: '#d29922',
        fillColor: 'rgba(210, 153, 34, 0.15)',
      },
    ]
  }, [snapshots])

  const chartRange = useMemo(() => {
    const end = Date.now()
    const start = end - (rangeMs[range] || 86400000)
    return { start, end }
  }, [range])

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-4 metrics-grid">
        <StatCard
          label="Drives"
          value={drives.length}
          icon="archive"
          iconColor="var(--accent-blue)"
          bgColor="var(--bg-blue)"
        />
        <StatCard
          label="Total Capacity"
          value={`${diskStats.total} GB`}
          icon="hard-drive"
          iconColor="var(--accent-purple)"
          bgColor="var(--bg-purple)"
        />
        <StatCard
          label="Total Used"
          value={`${diskStats.used} GB`}
          icon="database"
          iconColor="var(--accent-orange)"
          bgColor="var(--bg-orange)"
          subValue={`${diskStats.pct.toFixed(1)}% used`}
        />
        <StatCard
          label="Total Free"
          value={`${diskStats.free} GB`}
          icon="check-circle"
          iconColor="var(--accent-green)"
          bgColor="var(--bg-green)"
        />
      </div>

      {/* Drive list */}
      <div className="card metrics-card mb-4">
        <p className="section-label mb-3">Disk Drives</p>
        {drives.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="empty-state-icon empty-state-icon-blue mb-3">
              <Icon name="archive" size="lg" className="text-blue" />
            </div>
            <p className="text-sm text-muted">No disk data available</p>
            <p className="text-xs text-muted mt-1">Disk metrics will appear after the first sample</p>
          </div>
        ) : (
          <div className="metrics-drive-list">
            {drives.map((drive) => (
              <DiskDriveBar key={drive.device + drive.path} drive={drive} />
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="card metrics-chart-card">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">Disk Usage Over Time</p>
          {!loading && latest && (
            <span className="badge badge-info">{latest.drives.reduce((a, d) => a + d.usedGB, 0)} GB used</span>
          )}
        </div>
        <TimeSeriesChart
          lines={lines}
          range={chartRange}
          height={200}
          unit="GB"
          emptyMessage="No disk data collected yet"
        />
      </div>
    </>
  )
}
