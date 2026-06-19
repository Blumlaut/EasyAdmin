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
// NetworkMetricsSection
// ============================================================

interface NetworkMetricsSectionProps {
  snapshots: Array<{ timestamp: number; bytesInMBps: number; bytesOutMBps: number }>
  current: { bytesInMBps: number; bytesOutMBps: number } | null
  range: MetricsRange
  loading: boolean
}

export function NetworkMetricsSection({ snapshots, current: _current, range, loading: _loading }: NetworkMetricsSectionProps) {
  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null

  // Compute peak in/out
  const peakIn = useMemo(() => {
    if (snapshots.length === 0) return 0
    return Math.max(...snapshots.map((s) => s.bytesInMBps))
  }, [snapshots])

  const peakOut = useMemo(() => {
    if (snapshots.length === 0) return 0
    return Math.max(...snapshots.map((s) => s.bytesOutMBps))
  }, [snapshots])

  // Avg in/out
  const avgIn = useMemo(() => {
    if (snapshots.length === 0) return 0
    return snapshots.reduce((acc, s) => acc + s.bytesInMBps, 0) / snapshots.length
  }, [snapshots])

  const avgOut = useMemo(() => {
    if (snapshots.length === 0) return 0
    return snapshots.reduce((acc, s) => acc + s.bytesOutMBps, 0) / snapshots.length
  }, [snapshots])

  // Chart lines
  const lines: TimeSeriesLine[] = useMemo(() => [
    {
      label: 'Inbound',
      data: snapshots.map((s) => ({ timestamp: s.timestamp * 1000, value: s.bytesInMBps })),
      color: '#3fb950',
      fillColor: 'rgba(63, 185, 80, 0.15)',
    },
    {
      label: 'Outbound',
      data: snapshots.map((s) => ({ timestamp: s.timestamp * 1000, value: s.bytesOutMBps })),
      color: '#58a6ff',
      fillColor: 'rgba(88, 166, 255, 0.15)',
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
          label="Current Inbound"
          value={latest ? `${latest.bytesInMBps.toFixed(2)} MB/s` : '—'}
          icon="arrow-down-circle"
          iconColor="var(--accent-green)"
          bgColor="var(--bg-green)"
          subValue={`Avg: ${avgIn.toFixed(2)} MB/s`}
        />
        <StatCard
          label="Current Outbound"
          value={latest ? `${latest.bytesOutMBps.toFixed(2)} MB/s` : '—'}
          icon="arrow-up-circle"
          iconColor="var(--accent-blue)"
          bgColor="var(--bg-blue)"
          subValue={`Avg: ${avgOut.toFixed(2)} MB/s`}
        />
        <StatCard
          label="Peak Inbound"
          value={`${peakIn.toFixed(2)} MB/s`}
          icon="trending-up"
          iconColor="var(--accent-green)"
          bgColor="var(--bg-green)"
        />
        <StatCard
          label="Peak Outbound"
          value={`${peakOut.toFixed(2)} MB/s`}
          icon="trending-up"
          iconColor="var(--accent-blue)"
          bgColor="var(--bg-blue)"
        />
      </div>

      {/* Chart */}
      <div className="card metrics-chart-card">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">Network Throughput</p>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: '#3fb950' }} />
              Inbound
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: '#58a6ff' }} />
              Outbound
            </span>
          </div>
        </div>
        <TimeSeriesChart
          lines={lines}
          range={chartRange}
          height={220}
          unit="MB/s"
          emptyMessage="No network data collected yet"
        />
      </div>
    </>
  )
}
