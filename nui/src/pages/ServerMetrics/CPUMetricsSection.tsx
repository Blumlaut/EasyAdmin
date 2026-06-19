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
// CPUMetricsSection
// ============================================================

interface CPUMetricsSectionProps {
  snapshots: Array<{ timestamp: number; usagePercent: number }>
  coreCount: number
  range: MetricsRange
  loading: boolean
}

export function CPUMetricsSection({ snapshots, coreCount, range, loading }: CPUMetricsSectionProps) {
  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null

  // Compute avg from snapshots
  const avgUsage = useMemo(() => {
    if (snapshots.length === 0) return 0
    const sum = snapshots.reduce((acc, s) => acc + s.usagePercent, 0)
    return sum / snapshots.length
  }, [snapshots])

  // Compute max
  const maxUsage = useMemo(() => {
    if (snapshots.length === 0) return 0
    return Math.max(...snapshots.map((s) => s.usagePercent))
  }, [snapshots])

  // Chart lines
  const lines: TimeSeriesLine[] = useMemo(() => [
    {
      label: 'CPU %',
      data: snapshots.map((s) => ({ timestamp: s.timestamp * 1000, value: s.usagePercent })),
      color: '#d29922',
      fillColor: 'rgba(210, 153, 34, 0.15)',
    },
  ], [snapshots])

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
          label="Current CPU"
          value={latest ? `${latest.usagePercent.toFixed(1)}%` : '—'}
          icon="zap"
          iconColor="var(--accent-orange)"
          bgColor="var(--bg-orange)"
          subValue={`${coreCount} core${coreCount > 1 ? 's' : ''}`}
        />
        <StatCard
          label="Average CPU"
          value={`${avgUsage.toFixed(1)}%`}
          icon="activity"
          iconColor="var(--accent-blue)"
          bgColor="var(--bg-blue)"
        />
        <StatCard
          label="Peak CPU"
          value={`${maxUsage.toFixed(1)}%`}
          icon="trending-up"
          iconColor="var(--accent-red)"
          bgColor="var(--bg-red)"
        />
        <StatCard
          label="Data Points"
          value={snapshots.length.toLocaleString()}
          icon="database"
          iconColor="var(--accent-green)"
          bgColor="var(--bg-green)"
        />
      </div>

      {/* Chart */}
      <div className="card metrics-chart-card">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">CPU Usage Over Time</p>
          {!loading && latest && (
            <span className={`badge ${latest.usagePercent > 80 ? 'badge-danger' : latest.usagePercent > 50 ? 'badge-warning' : 'badge-online'}`}>
              {latest.usagePercent.toFixed(1)}%
            </span>
          )}
        </div>
        <TimeSeriesChart
          lines={lines}
          range={chartRange}
          height={220}
          unit="%"
          emptyMessage="No CPU data collected yet"
        />
      </div>
    </>
  )
}
