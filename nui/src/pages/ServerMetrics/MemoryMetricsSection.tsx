import { useMemo } from 'react'
import type { MetricsRange } from '../../types'
import { TimeSeriesChart, type TimeSeriesLine } from '../../components/TimeSeriesChart'
import { StatCard } from '../../components/StatCard'

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
// MemoryMetricsSection
// ============================================================

interface MemoryMetricsSectionProps {
  snapshots: Array<{ timestamp: number; totalMB: number; usedMB: number; freeMB: number; usagePercent: number }>
  current: { totalMB: number; usedMB: number; freeMB: number; usagePercent: number } | null
  range: MetricsRange
  loading: boolean
}

export function MemoryMetricsSection({ snapshots, current, range, loading: _loading }: MemoryMetricsSectionProps) {
  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null

  // Compute avg
  const avgUsage = useMemo(() => {
    if (snapshots.length === 0) return 0
    const sum = snapshots.reduce((acc, s) => acc + s.usagePercent, 0)
    return sum / snapshots.length
  }, [snapshots])

  // Compute peak
  const peakUsage = useMemo(() => {
    if (snapshots.length === 0) return 0
    return Math.max(...snapshots.map((s) => s.usagePercent))
  }, [snapshots])

  // Chart lines
  const lines: TimeSeriesLine[] = useMemo(() => [
    {
      label: 'Used MB',
      data: snapshots.map((s) => ({ timestamp: s.timestamp * 1000, value: s.usedMB })),
      color: '#58a6ff',
      fillColor: 'rgba(88, 166, 255, 0.15)',
    },
    {
      label: 'Free MB',
      data: snapshots.map((s) => ({ timestamp: s.timestamp * 1000, value: s.freeMB })),
      color: '#3fb950',
      fillColor: 'rgba(63, 185, 80, 0.1)',
    },
  ], [snapshots])

  const chartRange = useMemo(() => {
    const end = Date.now()
    const start = end - (rangeMs[range] || 86400000)
    return { start, end }
  }, [range])

  const totalMB = current?.totalMB ?? latest?.totalMB ?? 0

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-4 metrics-grid">
        <StatCard
          label="RAM Used"
          value={latest ? `${latest.usedMB} MB` : '—'}
          icon="server"
          iconColor="var(--accent-blue)"
          bgColor="var(--bg-blue)"
          subValue={totalMB > 0 ? `of ${totalMB} MB total` : undefined}
        />
        <StatCard
          label="RAM Free"
          value={latest ? `${latest.freeMB} MB` : '—'}
          icon="check-circle"
          iconColor="var(--accent-green)"
          bgColor="var(--bg-green)"
        />
        <StatCard
          label="Avg Usage"
          value={`${avgUsage.toFixed(1)}%`}
          icon="activity"
          iconColor="var(--accent-orange)"
          bgColor="var(--bg-orange)"
        />
        <StatCard
          label="Peak Usage"
          value={`${peakUsage.toFixed(1)}%`}
          icon="trending-up"
          iconColor="var(--accent-red)"
          bgColor="var(--bg-red)"
        />
      </div>

      {/* Usage bar */}
      {latest && totalMB > 0 && (
        <div className="card metrics-card mb-4">
          <p className="section-label mb-3">Current Memory Usage</p>
          <div className="metrics-bar-track">
            <div
              className={`metrics-bar-fill ${latest.usagePercent > 90 ? 'metrics-bar-critical' : latest.usagePercent > 70 ? 'metrics-bar-warning' : ''}`}
              style={{ width: `${Math.min(latest.usagePercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted">{latest.usedMB} MB used</span>
            <span className="text-xs text-muted">{latest.usagePercent.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="card metrics-chart-card">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">Memory Over Time</p>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: '#58a6ff' }} />
              Used
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: '#3fb950' }} />
              Free
            </span>
          </div>
        </div>
        <TimeSeriesChart
          lines={lines}
          range={chartRange}
          height={220}
          unit="MB"
          emptyMessage="No memory data collected yet"
        />
      </div>
    </>
  )
}
